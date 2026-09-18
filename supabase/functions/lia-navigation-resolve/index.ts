const jsonHeaders={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'access-control-allow-origin':'*',
  'access-control-allow-methods':'POST,OPTIONS',
  'access-control-allow-headers':'authorization,apikey,content-type,x-client-info',
};
function json(status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:jsonHeaders});}
function defaultSecretKey():string{
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){try{const parsed=JSON.parse(modern);if(typeof parsed?.default==='string'&&parsed.default)return parsed.default;}catch{}}
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(legacy)return legacy;
  throw new Error('SERVER_SECRET_NOT_CONFIGURED');
}
async function requireUser(req:Request){
  const auth=req.headers.get('authorization')??'';const token=auth.replace(/^Bearer\s+/i,'').trim();if(!token)return null;
  const url=Deno.env.get('SUPABASE_URL');if(!url)return null;
  const {createClient}=await import('npm:@supabase/supabase-js@2.57.4');
  const admin=createClient(url,defaultSecretKey(),{auth:{autoRefreshToken:false,persistSession:false}});
  const {data,error}=await admin.auth.getUser(token);return error||!data.user?null:data.user;
}
function finite(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value);}
function safeText(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
type GooglePlace={id?:string;displayName?:{text?:string};formattedAddress?:string;location?:{latitude?:number;longitude?:number}};
type SearchResponse={places?:GooglePlace[]};

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:jsonHeaders});
  if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
  try{
    if(!await requireUser(req))return json(401,{error:'AUTH_REQUIRED'});
    const key=Deno.env.get('GOOGLE_MAPS_API_KEY')?.trim();if(!key)return json(503,{error:'NAVIGATION_PROVIDER_NOT_CONFIGURED'});
    const body=await req.json().catch(()=>({}));
    const query=safeText(body?.query,220);if(query.length<2)return json(400,{error:'DESTINATION_REQUIRED'});
    const languageCode=safeText(body?.languageCode,12);
    const originLat=body?.origin?.latitude,originLng=body?.origin?.longitude;
    const requestBody:Record<string,unknown>={textQuery:query,pageSize:3};
    if(languageCode)requestBody.languageCode=languageCode.split('-')[0];
    if(finite(originLat)&&finite(originLng)&&originLat>=-90&&originLat<=90&&originLng>=-180&&originLng<=180){
      requestBody.locationBias={circle:{center:{latitude:originLat,longitude:originLng},radius:50000}};
    }
    const response=await fetch('https://places.googleapis.com/v1/places:searchText',{
      method:'POST',
      headers:{'content-type':'application/json','x-goog-api-key':key,'x-goog-fieldmask':'places.id,places.displayName.text,places.formattedAddress,places.location'},
      body:JSON.stringify(requestBody),signal:AbortSignal.timeout(9000),
    });
    if(!response.ok)return json(502,{error:'DESTINATION_PROVIDER_FAILED'});
    const data=await response.json() as SearchResponse;
    const candidates=(data.places??[]).flatMap(place=>{
      const placeId=safeText(place.id,240),title=safeText(place.displayName?.text,180),address=safeText(place.formattedAddress,320);
      const latitude=place.location?.latitude,longitude=place.location?.longitude;
      if(!placeId||!title||!finite(latitude)||!finite(longitude))return[];
      return[{placeId,title,address:address||title,latitude,longitude}];
    }).slice(0,3);
    return json(200,{candidates,provider:'google-places',attribution:'Google Maps'});
  }catch(error){console.error('lia-navigation-resolve failed',error);return json(502,{error:'DESTINATION_RESOLUTION_FAILED'});}
});
