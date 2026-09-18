import {COMMANDER_MAX_RADIUS_KM,type CommanderOrderPath,type CommanderPlace} from '../domain/commander';
import {mergeCommanderPlaceSources} from '../domain/commanderProviders';
import {configuredCommanderPlaceProvider} from './commanderGoogleProvider';

export type CommanderSearchContext={
  deliveryAddress?:string|null;
  maxRadiusKm?:number;
};

export type CommanderSponsoredSearchContext=Required<Pick<CommanderSearchContext,'maxRadiusKm'>>&{
  deliveryAddress:string;
};

export interface CommanderPlaceProvider{
  search(context:Required<Pick<CommanderSearchContext,'maxRadiusKm'>>&{deliveryAddress:string}):Promise<CommanderPlace[]>;
}

export interface CommanderSponsoredProvider{
  searchSponsored(context:CommanderSponsoredSearchContext):Promise<CommanderPlace[]>;
}

export type CommanderDeliveryVerification={
  placeId:string;
  delivery:'confirmed'|'unknown'|'unavailable';
  etaMin?:number|null;
  etaMax?:number|null;
  deliveryFee?:number|null;
  minimumOrder?:number|null;
  currencyCode?:string|null;
  orderUrl?:string|null;
  orderPaths?:CommanderOrderPath[];
};

export interface CommanderDeliveryProvider{
  verifyDelivery(context:Required<Pick<CommanderSearchContext,'maxRadiusKm'>>&{deliveryAddress:string},places:ReadonlyArray<CommanderPlace>):Promise<CommanderDeliveryVerification[]>;
}

const configuredLiveProvider=configuredCommanderPlaceProvider();
let liveProviders:CommanderPlaceProvider[]=configuredLiveProvider?[configuredLiveProvider]:[];
let sponsoredProvider:CommanderSponsoredProvider|null=null;
let deliveryProviders:CommanderDeliveryProvider[]=[];

/**
 * A real organic provider can be injected by the production integration layer
 * once its data source, delivery coverage and commercial terms are verified.
 * Sponsored rows returned accidentally by this provider are discarded so paid
 * placement can never alter the natural Commander ranking.
 */
export function configureCommanderPlaceProvider(provider:CommanderPlaceProvider|null){liveProviders=provider?[provider]:[];}
export function configureCommanderPlaceProviders(providers:ReadonlyArray<CommanderPlaceProvider>){liveProviders=[...providers];}

/**
 * Sponsored inventory uses a separate provider boundary. It stays completely
 * disabled until a verified commercial integration is explicitly configured.
 */
export function configureCommanderSponsoredProvider(provider:CommanderSponsoredProvider|null){sponsoredProvider=provider;}

/**
 * Delivery confirmation is intentionally separate from place discovery.
 * A nearby restaurant is never treated as deliverable merely because it was
 * found by the organic provider.
 */
export function configureCommanderDeliveryProvider(provider:CommanderDeliveryProvider|null){deliveryProviders=provider?[provider]:[];}
export function configureCommanderDeliveryProviders(providers:ReadonlyArray<CommanderDeliveryProvider>){deliveryProviders=[...providers];}

function boundedContext(context:CommanderSearchContext){
  const deliveryAddress=context.deliveryAddress?.trim();
  if(!deliveryAddress)return null;
  return {deliveryAddress,maxRadiusKm:Math.min(COMMANDER_MAX_RADIUS_KM,Math.max(0,context.maxRadiusKm??COMMANDER_MAX_RADIUS_KM))};
}

export async function loadCommanderPlaces(context:CommanderSearchContext={}):Promise<CommanderPlace[]>{
  const safe=boundedContext(context);
  if(!safe||liveProviders.length===0)return [];
  const discovered=await Promise.allSettled(liveProviders.map(provider=>provider.search(safe)));
  const fulfilled=discovered.filter((result):result is PromiseFulfilledResult<CommanderPlace[]>=>result.status==='fulfilled');
  if(fulfilled.length===0){const rejected=discovered.find(result=>result.status==='rejected') as PromiseRejectedResult|undefined;if(rejected)throw rejected.reason;return [];}
  let organic=mergeCommanderPlaceSources(fulfilled.flatMap(result=>result.value.filter(row=>!row.sponsored))).filter(row=>row.delivery!=='unavailable');
  for(const provider of deliveryProviders){
    const pending=organic.filter(row=>row.delivery==='unknown');
    if(pending.length===0)break;
    let checks:CommanderDeliveryVerification[];
    try{checks=await provider.verifyDelivery(safe,pending);}catch{continue;}
    const byId=new Map(checks.map(check=>[check.placeId,check]));
    organic=organic.map(row=>{
      if(row.delivery!=='unknown')return row;
      const check=byId.get(row.id);if(!check)return row;
      const orderPaths=[...(row.orderPaths??[]),...(check.orderPaths??[])].filter((path,index,all)=>all.findIndex(other=>other.id===path.id)===index);
      return {...row,delivery:check.delivery,etaMin:check.etaMin??row.etaMin,etaMax:check.etaMax??row.etaMax,deliveryFee:check.deliveryFee??row.deliveryFee,minimumOrder:check.minimumOrder??row.minimumOrder,currencyCode:check.currencyCode??row.currencyCode,orderUrl:check.orderUrl??row.orderUrl,orderPaths};
    }).filter(row=>row.delivery!=='unavailable');
  }
  return organic;
}

export async function loadCommanderSponsoredPlaces(context:CommanderSearchContext={}):Promise<CommanderPlace[]>{
  const safe=boundedContext(context);
  if(!sponsoredProvider||!safe)return [];
  const rows=await sponsoredProvider.searchSponsored(safe);
  return rows.filter(row=>row.sponsored===true);
}
