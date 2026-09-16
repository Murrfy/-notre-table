import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const jsonHeaders={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
};

function json(status:number,body:unknown){
  return new Response(JSON.stringify(body),{status,headers:jsonHeaders});
}

function defaultSecretKey():string{
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){
    try{
      const parsed=JSON.parse(modern);
      if(typeof parsed?.default==='string'&&parsed.default)return parsed.default;
    }catch{/* fall through to legacy */}
  }
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(legacy)return legacy;
  throw new Error('SERVER_SECRET_NOT_CONFIGURED');
}

type HouseholdAccessRow={
  household_id:string;
  plan:'free'|'family';
  payer_user_id:string|null;
  entitlement_id:string|null;
  expires_at:string|null;
  last_verified_at:string|null;
  updated_at:string;
};

type RcEntitlement={
  expires_date?:string|null;
  grace_period_expires_date?:string|null;
};

type RcSubscriber={
  subscriber?:{entitlements?:Record<string,RcEntitlement|undefined>};
};

function maxIsoDate(values:Array<string|null|undefined>):string|null{
  let best:string|null=null;
  let bestMs=Number.NEGATIVE_INFINITY;
  for(const value of values){
    if(!value)continue;
    const ms=Date.parse(value);
    if(Number.isFinite(ms)&&ms>bestMs){bestMs=ms;best=value;}
  }
  return best;
}

function entitlementState(payload:RcSubscriber,entitlementId:string):{active:boolean;expiresAt:string|null}{
  const entitlement=payload?.subscriber?.entitlements?.[entitlementId];
  if(!entitlement)return {active:false,expiresAt:null};
  // RevenueCat represents lifetime access with a null expiry. For renewable subscriptions,
  // compare both the normal and grace-period expiry against the current time.
  if(entitlement.expires_date===null)return {active:true,expiresAt:null};
  const expiresAt=maxIsoDate([entitlement.expires_date,entitlement.grace_period_expires_date]);
  if(!expiresAt)return {active:false,expiresAt:null};
  return {active:Date.parse(expiresAt)>Date.now(),expiresAt};
}

async function fetchRevenueCatCustomer(appUserId:string,secret:string,entitlementId:string){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10_000);
  try{
    const response=await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,{
      method:'GET',
      headers:{Authorization:`Bearer ${secret}`,Accept:'application/json','Content-Type':'application/json'},
      signal:controller.signal,
    });
    if(!response.ok)throw new Error(`REVENUECAT_LOOKUP_FAILED_${response.status}`);
    return entitlementState(await response.json() as RcSubscriber,entitlementId);
  }finally{
    clearTimeout(timer);
  }
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});

  const authHeader=req.headers.get('authorization')??'';
  const match=authHeader.match(/^Bearer\s+(.+)$/i);
  if(!match)return json(401,{error:'AUTHENTICATION_REQUIRED'});

  const url=Deno.env.get('SUPABASE_URL');
  const revenueCatSecret=Deno.env.get('REVENUECAT_SECRET_API_KEY')?.trim();
  const entitlementId=Deno.env.get('REVENUECAT_ENTITLEMENT_ID')?.trim();
  if(!url||!revenueCatSecret||!entitlementId)return json(500,{error:'SERVER_CONFIGURATION_ERROR'});

  try{
    const body=await req.json().catch(()=>({}));
    const requestedHouseholdId=typeof body?.household_id==='string'?body.household_id:null;
    if(!requestedHouseholdId)return json(400,{error:'HOUSEHOLD_REQUIRED'});

    const admin=createClient(url,defaultSecretKey(),{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:{user},error:userError}=await admin.auth.getUser(match[1]);
    if(userError||!user)return json(401,{error:'AUTHENTICATION_REQUIRED'});

    const membership=await admin
      .from('household_members')
      .select('household_id')
      .eq('user_id',user.id)
      .eq('household_id',requestedHouseholdId)
      .maybeSingle();
    if(membership.error)throw membership.error;
    if(!membership.data)return json(403,{error:'HOUSEHOLD_ACCESS_DENIED'});

    const currentResult=await admin
      .from('household_access')
      .select('household_id,plan,payer_user_id,entitlement_id,expires_at,last_verified_at,updated_at')
      .eq('household_id',requestedHouseholdId)
      .maybeSingle();
    if(currentResult.error)throw currentResult.error;
    const current=currentResult.data as HouseholdAccessRow|null;
    const verifiedAt=new Date().toISOString();

    // First test the current authenticated member. This lets a new/restored purchase claim the
    // household without ever letting the mobile client write entitlement state directly.
    let callerState:{active:boolean;expiresAt:string|null}|null=null;
    let callerLookupFailed=false;
    try{callerState=await fetchRevenueCatCustomer(user.id,revenueCatSecret,entitlementId);}catch(error){
      callerLookupFailed=true;
      console.error('RevenueCat caller lookup failed',error);
    }

    if(callerState?.active){
      const row={
        household_id:requestedHouseholdId,
        plan:'family' as const,
        payer_user_id:user.id,
        entitlement_id:entitlementId,
        expires_at:callerState.expiresAt,
        last_verified_at:verifiedAt,
        updated_at:verifiedAt,
      };
      const saved=await admin.from('household_access').upsert(row,{onConflict:'household_id'}).select('household_id,plan,payer_user_id,entitlement_id,expires_at,last_verified_at,updated_at').single();
      if(saved.error)throw saved.error;
      return json(200,{access:saved.data,verified:true});
    }

    // A non-paying household member must still inherit the household's paid access. Re-check the
    // recorded payer server-side; never require each family member to purchase separately.
    if(current?.payer_user_id&&current.payer_user_id!==user.id){
      try{
        const payerState=await fetchRevenueCatCustomer(current.payer_user_id,revenueCatSecret,entitlementId);
        const row={
          household_id:requestedHouseholdId,
          plan:payerState.active?'family' as const:'free' as const,
          payer_user_id:current.payer_user_id,
          entitlement_id:entitlementId,
          expires_at:payerState.expiresAt,
          last_verified_at:verifiedAt,
          updated_at:verifiedAt,
        };
        const saved=await admin.from('household_access').upsert(row,{onConflict:'household_id'}).select('household_id,plan,payer_user_id,entitlement_id,expires_at,last_verified_at,updated_at').single();
        if(saved.error)throw saved.error;
        return json(200,{access:saved.data,verified:true});
      }catch(error){
        console.error('RevenueCat payer lookup failed',error);
        // A transport/provider outage must not revoke an already verified household entitlement.
        // Return the last server truth and let the client enforce any stored expiry locally.
        if(current)return json(200,{access:current,verified:false,provider_unavailable:true});
      }
    }

    if(callerLookupFailed){
      if(current)return json(200,{access:current,verified:false,provider_unavailable:true});
      return json(503,{error:'REVENUECAT_TEMPORARILY_UNAVAILABLE'});
    }

    // If the payer account was permanently deleted, keep only a previously verified Store period
    // until its known expiry. Otherwise fail closed to free; do not create indefinite family access.
    if(current?.plan==='family'&&!current.payer_user_id&&current.expires_at&&Date.parse(current.expires_at)>Date.now()){
      return json(200,{access:current,verified:false,preserved_until_expiry:true});
    }

    const freeRow={
      household_id:requestedHouseholdId,
      plan:'free' as const,
      payer_user_id:current?.payer_user_id??null,
      entitlement_id:entitlementId,
      expires_at:current?.expires_at??null,
      last_verified_at:callerState?verifiedAt:(current?.last_verified_at??null),
      updated_at:verifiedAt,
    };
    const saved=await admin.from('household_access').upsert(freeRow,{onConflict:'household_id'}).select('household_id,plan,payer_user_id,entitlement_id,expires_at,last_verified_at,updated_at').single();
    if(saved.error)throw saved.error;
    return json(200,{access:saved.data,verified:Boolean(callerState)});
  }catch(error){
    console.error('sync-household-access failed',error);
    return json(500,{error:'HOUSEHOLD_ACCESS_SYNC_FAILED'});
  }
});
