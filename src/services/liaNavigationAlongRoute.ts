import {getLiaNavigationCurrentLocation} from '../../modules/lia-navigation';
import {supabase} from '../lib/supabase';
import type {LiaNavigationDestinationCandidate} from './liaNavigationDestination';
import {getLiaNavigationLiveSession} from './liaNavigationLiveSession';
import {requestLiaNavigationStopover} from './liaNavigationLiveControl';

export type LiaAlongRouteCandidate=LiaNavigationDestinationCandidate&{detourSeconds:number|null;driveSeconds:number|null};
export type LiaAlongRouteResult=
  |{status:'not_recognized'}
  |{status:'unavailable';spokenReply:string}
  |{status:'not_found';spokenReply:string}
  |{status:'needs_confirmation';candidate:LiaAlongRouteCandidate;spokenReply:string}
  |{status:'added';candidate:LiaAlongRouteCandidate;spokenReply:string}
  |{status:'cancelled';spokenReply:string};

let pending:LiaAlongRouteCandidate|null=null;
function fr(languageTag:string){return languageTag.toLowerCase().startsWith('fr');}
function fold(v:string){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
function queryFrom(text:string){
  const s=fold(text);
  if(/\b(station service|station essence|essence|carburant|gas station|fuel)\b/.test(s))return fr('fr')?'station-service':'gas station';
  if(/\b(parking|stationnement|car park)\b/.test(s))return 'parking';
  if(/\b(pharmacie|pharmacy)\b/.test(s))return fr('fr')?'pharmacie':'pharmacy';
  if(/\b(restaurant|resto|restaurant on the way)\b/.test(s))return 'restaurant';
  return null;
}
function secondsLabel(value:number|null,languageTag:string){if(value===null||!Number.isFinite(value))return null;const minutes=Math.max(1,Math.round(value/60));return fr(languageTag)?`${minutes} min`:`${minutes} min`;}
function yes(text:string){return /^(?:oui|ouais|vas y|vas-y|ajoute|ajoute la|yes|yeah|add it|do it)\b/.test(fold(text));}
function no(text:string){return /^(?:non|laisse|laisse tomber|pas maintenant|no|never mind|not now)\b/.test(fold(text));}
export function liaNavigationAlongRoutePending(){return pending!==null;}
export function clearLiaNavigationAlongRoutePending(){pending=null;}

export async function prepareLiaNavigationAlongRouteFromSpeech(text:string,languageTag:string):Promise<LiaAlongRouteResult>{
  const query=queryFrom(text);if(!query)return{status:'not_recognized'};
  const state=getLiaNavigationLiveSession();
  if(!state.active||state.destinationLatitude===null||state.destinationLongitude===null){return{status:'unavailable',spokenReply:fr(languageTag)?'Je n’ai pas de trajet actif sur lequel chercher.':'I do not have an active route to search along.'};}
  if(!supabase)return{status:'unavailable',spokenReply:fr(languageTag)?'La recherche sur le trajet n’est pas disponible pour le moment.':'Search along the route is not available right now.'};
  const origin=await getLiaNavigationCurrentLocation();
  if(!origin)return{status:'unavailable',spokenReply:fr(languageTag)?'Je n’arrive pas à récupérer ta position actuelle.':'I cannot get your current location.'};
  try{
    const {data,error}=await supabase.functions.invoke('lia-navigation-along-route',{body:{query,origin:{latitude:origin.latitude,longitude:origin.longitude},destination:{latitude:state.destinationLatitude,longitude:state.destinationLongitude,placeId:state.destinationPlaceId,title:state.destinationTitle},languageCode:languageTag}});
    if(error)return{status:'unavailable',spokenReply:fr(languageTag)?'Je n’arrive pas à chercher sur le trajet pour le moment.':'I cannot search along the route right now.'};
    const rows=(data as {candidates?:unknown})?.candidates;
    if(!Array.isArray(rows)||rows.length===0)return{status:'not_found',spokenReply:fr(languageTag)?'Je n’ai rien trouvé d’assez pratique sur notre route.':'I did not find a practical option along our route.'};
    const row=rows[0] as Record<string,unknown>;
    const candidate:LiaAlongRouteCandidate={placeId:String(row.placeId??''),title:String(row.title??''),address:String(row.address??''),latitude:Number(row.latitude),longitude:Number(row.longitude),detourSeconds:typeof row.detourSeconds==='number'&&Number.isFinite(row.detourSeconds)?row.detourSeconds:null,driveSeconds:typeof row.driveSeconds==='number'&&Number.isFinite(row.driveSeconds)?row.driveSeconds:null};
    if(!candidate.placeId||!candidate.title||!Number.isFinite(candidate.latitude)||!Number.isFinite(candidate.longitude))return{status:'unavailable',spokenReply:fr(languageTag)?'Le résultat reçu n’est pas assez fiable.':'The result is not reliable enough.'};
    pending=candidate;
    const detour=secondsLabel(candidate.detourSeconds,languageTag);const drive=secondsLabel(candidate.driveSeconds,languageTag);
    const detail=fr(languageTag)?(detour?` avec environ ${detour} de détour`:drive?` à environ ${drive}`:''):(detour?` with about ${detour} extra`:drive?` about ${drive} away`:'');
    return{status:'needs_confirmation',candidate,spokenReply:fr(languageTag)?`J’ai trouvé ${candidate.title}${detail}. Tu veux que je l’ajoute au trajet ?`:`I found ${candidate.title}${detail}. Do you want me to add it to the route?`};
  }catch{return{status:'unavailable',spokenReply:fr(languageTag)?'Je n’arrive pas à chercher sur le trajet pour le moment.':'I cannot search along the route right now.'};}
}

export function continueLiaNavigationAlongRoute(text:string,languageTag:string):LiaAlongRouteResult{
  const candidate=pending;if(!candidate)return{status:'not_recognized'};
  if(no(text)){pending=null;return{status:'cancelled',spokenReply:fr(languageTag)?'D’accord, on garde la route comme elle est.':'Okay, we will keep the route as it is.'};}
  if(!yes(text))return{status:'needs_confirmation',candidate,spokenReply:fr(languageTag)?`Tu veux que j’ajoute ${candidate.title} au trajet ?`:`Do you want me to add ${candidate.title} to the route?`};
  pending=null;requestLiaNavigationStopover(candidate);
  return{status:'added',candidate,spokenReply:fr(languageTag)?`C’est fait, j’ajoute ${candidate.title} sur la route.`:`Done, I am adding ${candidate.title} to the route.`};
}
