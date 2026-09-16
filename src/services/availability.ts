import { isArray, readStoredJson, writeStoredJson } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { assertHouseholdWriteIfNoRows, rethrowHouseholdMutationError } from './householdWriteGuard';
import type { MealType, MemberAbsence } from '../types';
import { isMemberAwayForMeal } from '../lib/presence';

// V2 cache intentionally separates the meal-specific model from the older all-day demo cache.
const cacheKey = (householdId:string) => `member-meal-absences:${householdId}`;

async function readDemo(householdId:string):Promise<MemberAbsence[]> {
  return readStoredJson<MemberAbsence[]>(cacheKey(householdId),[],isArray as (value:unknown)=>value is MemberAbsence[]);
}

async function writeDemo(householdId:string,rows:MemberAbsence[]) {
  await writeStoredJson(cacheKey(householdId),rows);
}

export async function fetchMemberAbsences(householdId:string,fromDate:string,toDate:string,demo=false):Promise<MemberAbsence[]> {
  if(demo) return (await readDemo(householdId)).filter(x=>x.absence_date>=fromDate&&x.absence_date<=toDate);
  if(!supabase) return [];
  const {data,error}=await supabase.from('member_absences').select('id,household_id,user_id,absence_date,meal_type,created_by,created_at').eq('household_id',householdId).gte('absence_date',fromDate).lte('absence_date',toDate).order('absence_date');
  if(error) throw error;
  return (data??[]) as MemberAbsence[];
}

export async function setMemberMealAway(householdId:string,userId:string,date:string,mealType:MealType,away:boolean,demo=false):Promise<void> {
  if(demo){
    const rows=await readDemo(householdId);
    const without=rows.filter(x=>!(x.user_id===userId&&x.absence_date===date&&x.meal_type===mealType));
    if(away) without.push({id:`demo-away-${userId}-${date}-${mealType}`,household_id:householdId,user_id:userId,absence_date:date,meal_type:mealType});
    await writeDemo(householdId,without);
    return;
  }
  if(!supabase) throw new Error('BACKEND_NOT_CONFIGURED');
  if(away){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) throw new Error('AUTH_REQUIRED');
    const {error}=await supabase.from('member_absences').upsert({household_id:householdId,user_id:userId,absence_date:date,meal_type:mealType,created_by:user.id},{onConflict:'household_id,user_id,absence_date,meal_type'});
    if(error)return rethrowHouseholdMutationError(householdId,error);
  }else{
    const {data,error}=await supabase.from('member_absences').delete().eq('household_id',householdId).eq('user_id',userId).eq('absence_date',date).eq('meal_type',mealType).select('id');
    if(error)return rethrowHouseholdMutationError(householdId,error);
    await assertHouseholdWriteIfNoRows(householdId,data);
  }
}
