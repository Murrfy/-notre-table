const jsonHeaders={
  'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
  'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'authorization,apikey,content-type,x-client-info',
};
function json(status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:jsonHeaders});}
function defaultSecretKey():string{const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const parsed=JSON.parse(modern);if(typeof parsed?.default==='string'&&parsed.default)return parsed.default;}catch{}}const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(legacy)return legacy;throw new Error('SERVER_SECRET_NOT_CONFIGURED');}
async function requireUser(req:Request){const auth=req.headers.get('authorization')??'';const token=auth.replace(/^Bearer\s+/i,'').trim();if(!token)return null;const url=Deno.env.get('SUPABASE_URL');if(!url)return null;const {createClient}=await import('npm:@supabase/supabase-js@2.57.4');const admin=createClient(url,defaultSecretKey(),{auth:{autoRefreshToken:false,persistSession:false}});const {data,error}=await admin.auth.getUser(token);return error||!data.user?null:data.user;}
function finite(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value);}
function safeText(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
function parseSeconds(value:unknown):number|null{if(typeof value!=='string')return null;const match=value.match(/^([0-9]+(?:\.[0-9]+)?)s$/);return match?Number(match[1]):null;}
type GooglePlace={id?:string;displayName?:{text?:string};formattedAddress?:string;location?:{latitude?:number;longitude?:number}};
type RoutingSummary={legs?:Array<{duration?:string;distanceMeters?:number}>};

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:jsonHeaders});
  if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
  try{
    if(!await requireUser(req))return json(401,{error:'AUTH_REQUIRED'});
    const key=Deno.env.get('GOOGLE_MAPS_API_KEY')?.trim();if(!key)return json(503,{error:'NAVIGATION_PROVIDER_NOT_CONFIGURED'});
    const body=await req.json().catch(()=>({}));
    const query=safeText(body?.query,120);if(query.length<2)return json(400,{error:'QUERY_REQUIRED'});
    const oLat=body?.origin?.latitude,oLng=body?.origin?.longitude,dLat=body?.destination?.latitude,dLng=body?.destination?.longitude;
    if(!finite(oLat)||!finite(oLng)||!finite(dLat)||!finite(dLng))return json(400,{error:'ROUTE_COORDINATES_REQUIRED'});
    const routesResponse=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
      method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key,'x-goog-fieldmask':'routes.duration,routes.polyline.encodedPolyline'},
      body:JSON.stringify({origin:{location:{latLng:{latitude:oLat,longitude:oLng}}},destination:{location:{latLng:{latitude:dLat,longitude:dLng}}},travelMode:'DRIVE',routingPreference:'TRAFFIC_UNAWARE'}),signal:AbortSignal.timeout(9000),
    });
    if(!routesResponse.ok)return json(502,{error:'ROUTE_PROVIDER_FAILED'});
    const routesData=await routesResponse.json() as {routes?:Array<{duration?:string;polyline?:{encodedPolyline?:string}}>};
    const route=routesData.routes?.[0];const encodedPolyline=safeText(route?.polyline?.encodedPolyline,20000);if(!encodedPolyline)return json(502,{error:'ROUTE_POLYLINE_MISSING'});
    const baselineSeconds=parseSeconds(route?.duration);
    const languageCode=safeText(body?.languageCode,12);
    const placesResponse=await fetch('https://places.googleapis.com/v1/places:searchText',{
      method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key,'x-goog-fieldmask':'places.id,places.displayName.text,places.formattedAddress,places.location,routingSummaries'},
      body:JSON.stringify({textQuery:query,maxResultCount:3,...(languageCode?{languageCode:languageCode.split('-')[0]}:{}),searchAlongRouteParameters:{polyline:{encodedPolyline}},routingParameters:{origin:{latitude:oLat,longitude:oLng},travelMode:'DRIVE'}}),signal:AbortSignal.timeout(9000),
    });
    if(!placesResponse.ok)return json(502,{error:'PLACE_PROVIDER_FAILED'});
    const placesData=await placesResponse.json() as {places?:GooglePlace[];routingSummaries?:RoutingSummary[]};
    const summaries=placesData.routingSummaries??[];
    const candidates=(placesData.places??[]).flatMap((place,index)=>{
      const placeId=safeText(place.id,240),title=safeText(place.displayName?.text,180),address=safeText(place.formattedAddress,320);const latitude=place.location?.latitude,longitude=place.location?.longitude;
      if(!placeId||!title||!finite(latitude)||!finite(longitude))return[];
      const legs=summaries[index]?.legs??[];const legSeconds=legs.map(leg=>parseSeconds(leg.duration)).filter((value):value is number=>value!==null);const totalSeconds=legSeconds.length?legSeconds.reduce((a,b)=>a+b,0):null;
      const driveSeconds=legSeconds[0]??null;const detourSeconds=totalSeconds!==null&&baselineSeconds!==null?Math.max(0,totalSeconds-baselineSeconds):null;
      return[{placeId,title,address:address||title,latitude,longitude,driveSeconds,detourSeconds}];
    }).sort((a,b)=>(a.detourSeconds??Number.MAX_SAFE_INTEGER)-(b.detourSeconds??Number.MAX_SAFE_INTEGER)).slice(0,3);
    return json(200,{candidates,provider:'google-places-search-along-route',attribution:'Google Maps'});
  }catch(error){console.error('lia-navigation-along-route failed',error);return json(502,{error:'ALONG_ROUTE_SEARCH_FAILED'});}
});
