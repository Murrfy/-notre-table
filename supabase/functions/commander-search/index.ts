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
  if(modern){
    try{
      const parsed=JSON.parse(modern);
      if(typeof parsed?.default==='string'&&parsed.default)return parsed.default;
    }catch{/* fall back to legacy key */}
  }
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(legacy)return legacy;
  throw new Error('SERVER_SECRET_NOT_CONFIGURED');
}

async function requireUser(req:Request){
  const auth=req.headers.get('authorization')??'';
  const token=auth.replace(/^Bearer\s+/i,'').trim();
  if(!token)return null;
  const url=Deno.env.get('SUPABASE_URL');
  if(!url)return null;
  const {createClient}=await import('npm:@supabase/supabase-js@2.57.4');
  const admin=createClient(url,defaultSecretKey(),{auth:{autoRefreshToken:false,persistSession:false}});
  const {data,error}=await admin.auth.getUser(token);
  if(error||!data.user)return null;
  return data.user;
}

type GeocodeResponse={status?:string;results?:Array<{geometry?:{location?:{lat?:number;lng?:number}}}>};
type GooglePlace={
  id?:string;
  displayName?:{text?:string};
  formattedAddress?:string;
  location?:{latitude?:number;longitude?:number};
  types?:string[];
  primaryType?:string;
  currentOpeningHours?:{openNow?:boolean};
  rating?:number;
  userRatingCount?:number;
};
type NearbyResponse={places?:GooglePlace[]};

function finiteNumber(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value);}
function safeText(value:unknown,max=300){return typeof value==='string'?value.trim().slice(0,max):'';}
function normalizeCategory(value:string){return value.replace(/_/g,' ').trim();}
function distanceKm(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){const r=6371;const dLat=(b.latitude-a.latitude)*Math.PI/180;const dLng=(b.longitude-a.longitude)*Math.PI/180;const lat1=a.latitude*Math.PI/180;const lat2=b.latitude*Math.PI/180;const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;return 2*r*Math.asin(Math.sqrt(h));}

async function geocodeAddress(address:string,key:string){
  const url=new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address',address);
  url.searchParams.set('key',key);
  const response=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('GEOCODING_HTTP_ERROR');
  const body=await response.json() as GeocodeResponse;
  const location=body.results?.[0]?.geometry?.location;
  if(body.status!=='OK'||!finiteNumber(location?.lat)||!finiteNumber(location?.lng))return null;
  return {latitude:location.lat,longitude:location.lng};
}

async function searchNearby(center:{latitude:number;longitude:number},radiusMeters:number,key:string){
  const response=await fetch('https://places.googleapis.com/v1/places:searchNearby',{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-goog-api-key':key,
      'x-goog-fieldmask':'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.currentOpeningHours.openNow,places.rating,places.userRatingCount',
    },
    body:JSON.stringify({
      includedTypes:['restaurant'],
      maxResultCount:20,
      rankPreference:'POPULARITY',
      locationRestriction:{circle:{center,radius:radiusMeters}},
    }),
    signal:AbortSignal.timeout(9000),
  });
  if(!response.ok)throw new Error('PLACES_HTTP_ERROR');
  return await response.json() as NearbyResponse;
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:jsonHeaders});
  if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
  try{
    const user=await requireUser(req);
    if(!user)return json(401,{error:'AUTH_REQUIRED'});
    const key=Deno.env.get('GOOGLE_MAPS_API_KEY')?.trim();
    if(!key)return json(503,{error:'COMMANDER_PROVIDER_NOT_CONFIGURED'});

    const body=await req.json().catch(()=>({}));
    const deliveryAddress=safeText(body?.deliveryAddress,500);
    const requestedKm=finiteNumber(body?.maxRadiusKm)?body.maxRadiusKm:10;
    const radiusKm=Math.min(10,Math.max(0.25,requestedKm));
    if(!deliveryAddress)return json(400,{error:'DELIVERY_ADDRESS_REQUIRED'});

    const center=await geocodeAddress(deliveryAddress,key);
    if(!center)return json(200,{places:[],provider:'google-places',attribution:'Google Maps'});
    const nearby=await searchNearby(center,radiusKm*1000,key);
    const places=(nearby.places??[]).flatMap(place=>{
      const id=safeText(place.id,240),name=safeText(place.displayName?.text,180);
      const latitude=place.location?.latitude,longitude=place.location?.longitude;
      if(!id||!name||!finiteNumber(latitude)||!finiteNumber(longitude))return [];
      const types=(place.types??[]).filter(value=>typeof value==='string').slice(0,12).map(normalizeCategory);
      const primary=safeText(place.primaryType,80);
      if(primary&&!types.includes(normalizeCategory(primary)))types.unshift(normalizeCategory(primary));
      return [{
        id:`google:${id}`,
        source:'google-places',
        sourceAttribution:'Google Maps',
        name,
        categories:types.length?types:['restaurant'],
        latitude,
        longitude,
        distanceKm:distanceKm(center,{latitude,longitude}),
        openState:typeof place.currentOpeningHours?.openNow==='boolean'?(place.currentOpeningHours.openNow?'open':'closed'):'unknown',
        delivery:'unknown',
        rating:finiteNumber(place.rating)?place.rating:null,
        ratingCount:finiteNumber(place.userRatingCount)?place.userRatingCount:null,
        address:safeText(place.formattedAddress,300)||null,
        orderUrl:null,
        sponsored:false,
      }];
    });
    return json(200,{places,provider:'google-places',attribution:'Google Maps'});
  }catch(error){
    console.error('commander-search failed',error);
    return json(502,{error:'COMMANDER_SEARCH_FAILED'});
  }
});
