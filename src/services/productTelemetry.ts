export type ProductTelemetryEvent=
  |'commander_open'
  |'restaurant_open'
  |'outbound_order_click'
  |'sponsored_impression'
  |'sponsored_click';

type Scalar=string|number|boolean|null;
export type ProductTelemetryMetadata=Record<string,Scalar>;

export type ProductTelemetryProvider={
  track:(event:ProductTelemetryEvent,metadata:ProductTelemetryMetadata)=>Promise<void>|void;
};

const allowedKeys:Record<ProductTelemetryEvent,ReadonlySet<string>>={
  commander_open:new Set(['address_present']),
  restaurant_open:new Set(['source','sponsored','delivery_state','distance_bucket']),
  outbound_order_click:new Set(['source','sponsored','delivery_state']),
  sponsored_impression:new Set(['source','placement']),
  sponsored_click:new Set(['source','placement']),
};

let provider:ProductTelemetryProvider|null=null;
let hasAnalyticsConsent=()=>false;

export function configureProductTelemetryProvider(next:ProductTelemetryProvider|null){provider=next;}
export function configureProductTelemetryConsent(check:()=>boolean){hasAnalyticsConsent=check;}

export function sanitizeProductTelemetry(event:ProductTelemetryEvent,input:ProductTelemetryMetadata={}){
  const safe:ProductTelemetryMetadata={};
  const allowed=allowedKeys[event];
  for(const[key,value]of Object.entries(input)){
    if(!allowed.has(key))continue;
    safe[key]=typeof value==='string'&&value.length>80?value.slice(0,80):value;
  }
  return safe;
}

export async function emitProductTelemetry(event:ProductTelemetryEvent,metadata:ProductTelemetryMetadata={}){
  if(!provider||!hasAnalyticsConsent())return;
  await provider.track(event,sanitizeProductTelemetry(event,metadata));
}

export function commanderDistanceBucket(distanceKm:number|null|undefined){
  if(typeof distanceKm!=='number'||!Number.isFinite(distanceKm))return'unknown';
  if(distanceKm<=3)return'0-3';
  if(distanceKm<=5)return'3-5';
  if(distanceKm<=10)return'5-10';
  return'over-10';
}
