import { supabase } from '../lib/supabase';
import { isArray, isRecord, readStoredJson, writeStoredJson } from '../lib/storage';
import type { CommanderPlace } from '../domain/commander';

export type CommanderFavorite={
  id:string;
  provider:string;
  place_key:string;
  display_name:string|null;
  categories:string[];
  created_at:string;
  updated_at:string;
};

const DEMO_FAVORITES_KEY='@notre-table/commander-favorites-demo-v1';
const providerFor=(place:CommanderPlace)=>(place.source?.trim()||'commander').slice(0,80);
const placeKeyFor=(place:CommanderPlace)=>place.id.trim().slice(0,240);

function validFavorite(value:unknown):value is CommanderFavorite{
  if(!isRecord(value))return false;
  return typeof value.id==='string'&&typeof value.provider==='string'&&typeof value.place_key==='string'&&(value.display_name===null||typeof value.display_name==='string')&&isArray(value.categories)&&value.categories.every(category=>typeof category==='string')&&typeof value.created_at==='string'&&typeof value.updated_at==='string';
}
function validFavoriteList(value:unknown):value is CommanderFavorite[]{return isArray(value)&&value.every(validFavorite);}
async function localList(){return readStoredJson<CommanderFavorite[]>(DEMO_FAVORITES_KEY,[],validFavoriteList);}
async function localWrite(rows:CommanderFavorite[]){await writeStoredJson(DEMO_FAVORITES_KEY,rows);}
function localId(){return `commander-favorite-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;}

export async function isCommanderFavorite(place:CommanderPlace):Promise<boolean>{
  const provider=providerFor(place);const placeKey=placeKeyFor(place);
  if(!placeKey)return false;
  if(!supabase){const rows=await localList();return rows.some(row=>row.provider===provider&&row.place_key===placeKey);}
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('commander_favorites').select('id').eq('user_id',user.id).eq('provider',provider).eq('place_key',placeKey).limit(1);
  if(error)throw error;return (data?.length??0)>0;
}

export async function setCommanderFavorite(place:CommanderPlace,favorite:boolean):Promise<void>{
  const provider=providerFor(place);const placeKey=placeKeyFor(place);const displayName=place.name.trim();const googlePlace=provider==='google-places';
  if(!placeKey||!displayName)throw new Error('INVALID_COMMANDER_FAVORITE');
  if(!supabase){
    const rows=await localList();const kept=rows.filter(row=>!(row.provider===provider&&row.place_key===placeKey));
    if(!favorite){await localWrite(kept);return;}
    const now=new Date().toISOString();
    const next:CommanderFavorite={id:localId(),provider,place_key:placeKey,display_name:googlePlace?null:displayName,categories:googlePlace?[]:place.categories.slice(0,12),created_at:now,updated_at:now};
    await localWrite([next,...kept]);return;
  }
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  if(!favorite){const {error}=await supabase.from('commander_favorites').delete().eq('user_id',user.id).eq('provider',provider).eq('place_key',placeKey);if(error)throw error;return;}
  const {error}=await supabase.from('commander_favorites').upsert({user_id:user.id,provider,place_key:placeKey,display_name:googlePlace?null:displayName,categories:googlePlace?[]:place.categories.slice(0,12),updated_at:new Date().toISOString()},{onConflict:'user_id,provider,place_key'});
  if(error)throw error;
}
