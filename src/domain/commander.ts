export const COMMANDER_MAX_RADIUS_KM=10;

export type CommanderDeliveryState='confirmed'|'unknown'|'unavailable';
export type CommanderOrderPathKind='official'|'platform'|'phone';
export type CommanderOrderPath={id:string;kind:CommanderOrderPathKind;label?:string|null;url?:string|null;phone?:string|null;source?:string|null};
export type CommanderOpenState='open'|'closed'|'unknown'|'closing_soon';
export type CommanderPlace={
  id:string;
  source?:string|null;
  sourceAttribution?:string|null;
  name:string;
  categories:string[];
  latitude:number;
  longitude:number;
  distanceKm?:number|null;
  openState:CommanderOpenState;
  delivery:CommanderDeliveryState;
  etaMin?:number|null;
  etaMax?:number|null;
  deliveryFee?:number|null;
  minimumOrder?:number|null;
  currencyCode?:string|null;
  rating?:number|null;
  ratingCount?:number|null;
  orderUrl?:string|null;
  orderPaths?:CommanderOrderPath[];
  phone?:string|null;
  imageUrl?:string|null;
  address?:string|null;
  sponsored?:boolean;
  sponsorCampaignId?:string|null;
};
export type CommanderDestination={latitude:number;longitude:number};
export type RankedCommanderPlace=CommanderPlace&{distanceKm:number;score:number};

export function commanderDistanceKm(a:CommanderDestination,b:Pick<CommanderPlace,'latitude'|'longitude'>){
  const r=6371;const dLat=(b.latitude-a.latitude)*Math.PI/180;const dLng=(b.longitude-a.longitude)*Math.PI/180;const lat1=a.latitude*Math.PI/180;const lat2=b.latitude*Math.PI/180;
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;return 2*r*Math.asin(Math.sqrt(h));
}

export function rankCommanderPlaces(rows:CommanderPlace[],destination:CommanderDestination,query=''):RankedCommanderPlace[]{
  const q=query.trim().toLowerCase();
  return rows.map(row=>{const distanceKm=commanderDistanceKm(destination,row);let score=0;if(row.delivery==='confirmed')score+=40;if(row.delivery==='unavailable')score-=100;if(row.openState==='open')score+=25;if(row.openState==='closing_soon')score+=10;if(row.openState==='closed')score-=80;score+=Math.max(0,15-distanceKm*1.5);if(q&&(row.name.toLowerCase().includes(q)||row.categories.some(category=>category.toLowerCase().includes(q))))score+=30;return {...row,distanceKm,score};})
    .filter(row=>row.distanceKm<=COMMANDER_MAX_RADIUS_KM&&row.delivery!=='unavailable')
    .sort((a,b)=>b.score-a.score||a.distanceKm-b.distanceKm);
}

export function insertCommanderSponsored<T extends {sponsored?:boolean}>(natural:T[],sponsored:T[],limit=8):T[]{
  const base=natural.filter(row=>!row.sponsored);const ads=sponsored.filter(row=>row.sponsored);const result:T[]=[];let adIndex=0;
  for(const item of base){result.push(item);if(result.length===2&&ads[adIndex]&&result.length<limit)result.push(ads[adIndex++]);if(result.length>=limit)break;}
  return result.slice(0,limit);
}
