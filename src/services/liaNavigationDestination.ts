import type {LiaNavigationCoordinate} from '../../modules/lia-navigation';
import {supabase} from '../lib/supabase';

export type LiaNavigationDestinationCandidate={placeId:string;title:string;address:string;latitude:number;longitude:number};
export type LiaNavigationDestinationResolution=
  |{status:'resolved';candidate:LiaNavigationDestinationCandidate}
  |{status:'ambiguous';candidates:LiaNavigationDestinationCandidate[]}
  |{status:'not_found'}
  |{status:'unavailable'};

function finite(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value);}
function validCandidate(value:unknown):value is LiaNavigationDestinationCandidate{
  if(!value||typeof value!=='object')return false;const row=value as Record<string,unknown>;
  return typeof row.placeId==='string'&&row.placeId.length>0&&typeof row.title==='string'&&row.title.length>0&&typeof row.address==='string'&&finite(row.latitude)&&finite(row.longitude);
}
function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}

export async function resolveLiaNavigationDestination(input:{query:string;origin:LiaNavigationCoordinate;languageTag:string}):Promise<LiaNavigationDestinationResolution>{
  const query=input.query.trim();if(query.length<2)return{status:'not_found'};
  if(!supabase)return{status:'unavailable'};
  try{
    const {data,error}=await supabase.functions.invoke('lia-navigation-resolve',{body:{query,origin:{latitude:input.origin.latitude,longitude:input.origin.longitude},languageCode:input.languageTag}});
    if(error)return{status:'unavailable'};
    const rows=(data as {candidates?:unknown})?.candidates;
    if(!Array.isArray(rows))return{status:'unavailable'};
    const candidates=rows.filter(validCandidate).slice(0,3);
    if(candidates.length===0)return{status:'not_found'};
    if(candidates.length===1)return{status:'resolved',candidate:candidates[0]};
    const wanted=normalize(query);
    const exact=candidates.filter(candidate=>normalize(candidate.title)===wanted||normalize(candidate.address)===wanted);
    if(exact.length===1)return{status:'resolved',candidate:exact[0]};
    return{status:'ambiguous',candidates};
  }catch{return{status:'unavailable'};}
}
