import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const jsonHeaders={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
};

function json(status:number,body:unknown){
  return new Response(JSON.stringify(body),{status,headers:jsonHeaders});
}


function revenueCatDeletionEnabled():boolean{
  return /^(1|true)$/i.test(Deno.env.get('REVENUECAT_CUSTOMER_DELETION_ENABLED')??'');
}

async function deleteRevenueCatCustomer(appUserId:string):Promise<boolean>{
  if(!revenueCatDeletionEnabled()) return false;
  const secret=Deno.env.get('REVENUECAT_SECRET_API_KEY')?.trim();
  if(!secret) throw new Error('REVENUECAT_SERVER_SECRET_NOT_CONFIGURED');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  let response:Response;
  try{
    response=await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,{
      method:'DELETE',
      headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},
      signal:controller.signal,
    });
  }finally{
    clearTimeout(timer);
  }
  // RevenueCat documents both 200 and 404 as successful ensure-deleted outcomes.
  if(response.status!==200&&response.status!==404) throw new Error(`REVENUECAT_DELETE_FAILED_${response.status}`);
  return true;
}

function defaultSecretKey():string{
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){
    try{
      const parsed=JSON.parse(modern);
      if(typeof parsed?.default==='string'&&parsed.default) return parsed.default;
    }catch{/* fall through to legacy */}
  }
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(legacy) return legacy;
  throw new Error('SERVER_SECRET_NOT_CONFIGURED');
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json(405,{error:'METHOD_NOT_ALLOWED'});

  let body:any;
  try{body=await req.json();}catch{return json(400,{error:'INVALID_JSON'});}
  if(body?.confirm!==true) return json(400,{error:'CONFIRMATION_REQUIRED'});

  const authHeader=req.headers.get('authorization')??'';
  const match=authHeader.match(/^Bearer\s+(.+)$/i);
  if(!match) return json(401,{error:'AUTHENTICATION_REQUIRED'});

  const url=Deno.env.get('SUPABASE_URL');
  if(!url) return json(500,{error:'SERVER_CONFIGURATION_ERROR'});

  try{
    const admin=createClient(url,defaultSecretKey(),{
      auth:{autoRefreshToken:false,persistSession:false},
    });

    // Resolve the caller from the bearer token on the server. Never trust a user id from the body.
    const {data:{user},error:userError}=await admin.auth.getUser(match[1]);
    if(userError||!user) return json(401,{error:'AUTHENTICATION_REQUIRED'});

    const {data:profile,error:profileError}=await admin
      .from('profiles')
      .select('avatar_path')
      .eq('id',user.id)
      .maybeSingle();
    if(profileError) throw profileError;

    // Billing data is erased before destructive local mutations. If RevenueCat cleanup is
    // enabled but unavailable, the account remains intact and the request can be retried.
    // The App User ID contract is the Supabase Auth user id used by the mobile adapter.
    const revenueCatCustomerDeleted=await deleteRevenueCatCustomer(user.id);

    // Delete the private binary first. A failed storage deletion leaves the account intact and can be retried.
    if(profile?.avatar_path){
      const {error:avatarError}=await admin.storage.from('profile-avatars').remove([profile.avatar_path]);
      if(avatarError) throw avatarError;
    }

    // This idempotent server-only RPC removes authored data and keeps a shared household viable.
    const {error:prepareError}=await admin.rpc('prepare_account_deletion',{p_user_id:user.id});
    if(prepareError) throw prepareError;

    // Permanent Auth deletion is deliberately last: FK cascades now remove remaining personal rows.
    const {error:deleteError}=await admin.auth.admin.deleteUser(user.id,false);
    if(deleteError) throw deleteError;

    return json(200,{deleted:true,revenuecat_customer_deleted:revenueCatCustomerDeleted});
  }catch(error){
    console.error('delete-account failed',error);
    return json(500,{error:'ACCOUNT_DELETION_FAILED'});
  }
});
