import { isRecord, readStoredJson, removeStoredValue, writeStoredJson } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { assertHouseholdWriteIfNoRows, rethrowHouseholdMutationError } from './householdWriteGuard';
import type { ShoppingResponsibility } from '../types';

const cacheKey=(householdId:string,weekStart:string)=>`shopping-responsibility:${householdId}:${weekStart}`;

async function readDemo(householdId:string,weekStart:string):Promise<ShoppingResponsibility|null>{
  const raw=await readStoredJson<Record<string,unknown>|null>(cacheKey(householdId,weekStart),null,(value):value is Record<string,unknown>|null=>value===null||isRecord(value));
  if(!raw||typeof raw.household_id!=='string'||typeof raw.week_start!=='string'||typeof raw.assigned_user_id!=='string')return null;
  return raw as unknown as ShoppingResponsibility;
}

async function writeDemo(householdId:string,weekStart:string,value:ShoppingResponsibility|null){
  const key=cacheKey(householdId,weekStart);
  if(value) await writeStoredJson(key,value);
  else await removeStoredValue(key);
}

export async function fetchShoppingResponsibility(householdId:string,weekStart:string,demo=false):Promise<ShoppingResponsibility|null>{
  if(demo)return readDemo(householdId,weekStart);
  if(!supabase)return null;
  const {data,error}=await supabase.from('shopping_responsibilities')
    .select('household_id,week_start,assigned_user_id,updated_by,updated_at')
    .eq('household_id',householdId).eq('week_start',weekStart).maybeSingle();
  if(error)throw error;
  return (data??null) as ShoppingResponsibility|null;
}

export async function claimShoppingResponsibility(householdId:string,weekStart:string,userId:string,demo=false):Promise<ShoppingResponsibility>{
  const value:ShoppingResponsibility={household_id:householdId,week_start:weekStart,assigned_user_id:userId,updated_by:userId,updated_at:new Date().toISOString()};
  if(demo){await writeDemo(householdId,weekStart,value);return value;}
  if(!supabase)throw new Error('BACKEND_NOT_CONFIGURED');
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('shopping_responsibilities').upsert({household_id:householdId,week_start:weekStart,assigned_user_id:user.id,updated_by:user.id},{onConflict:'household_id,week_start'}).select('household_id,week_start,assigned_user_id,updated_by,updated_at').single();
  if(error)return rethrowHouseholdMutationError(householdId,error);
  return data as ShoppingResponsibility;
}

export async function clearShoppingResponsibility(householdId:string,weekStart:string,demo=false):Promise<void>{
  if(demo){await writeDemo(householdId,weekStart,null);return;}
  if(!supabase)throw new Error('BACKEND_NOT_CONFIGURED');
  const {data,error}=await supabase.from('shopping_responsibilities').delete().eq('household_id',householdId).eq('week_start',weekStart).select('household_id');
  if(error)return rethrowHouseholdMutationError(householdId,error);
  await assertHouseholdWriteIfNoRows(householdId,data);
}
