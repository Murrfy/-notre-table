import { isArray, readStoredJson, writeStoredJson } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { assertHouseholdWriteIfNoRows, rethrowHouseholdMutationError } from './householdWriteGuard';
import { MealGuest, MealMode, MealSlot, MealType } from '../types';

export async function fetchMeals(householdId: string, from: string, to: string): Promise<MealSlot[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('meal_plans')
    .select('id, meal_date, meal_type, recipe_id, custom_title, cook_user_id, servings, notes, meal_mode, leftover_from_meal_id, recipes(title)')
    .eq('household_id', householdId)
    .gte('meal_date', from)
    .lte('meal_date', to)
    .order('meal_date');
  if (error) throw error;

  const mealIds=(data??[]).map((row:any)=>row.id);
  let participantRows:any[]=[];
  if(mealIds.length){
    const {data:parts,error:partsError}=await supabase
      .from('meal_participants')
      .select('meal_plan_id,user_id,eating')
      .in('meal_plan_id',mealIds)
      .eq('eating',true);
    if(partsError) throw partsError;
    participantRows=parts??[];
  }
  let guestRows:any[]=[];
  if(mealIds.length){
    const {data:guests,error:guestError}=await supabase
      .from('meal_guests')
      .select('id,meal_plan_id,name')
      .in('meal_plan_id',mealIds)
      .order('created_at');
    if(guestError) throw guestError;
    guestRows=guests??[];
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    meal_date: row.meal_date,
    meal_type: row.meal_type,
    recipe_id: row.recipe_id ?? null,
    title: row.recipes?.title ?? row.custom_title ?? 'Repas',
    cook_user_id: row.cook_user_id ?? null,
    servings: row.servings == null ? null : Number(row.servings),
    participant_user_ids: participantRows.filter((p:any)=>p.meal_plan_id===row.id).map((p:any)=>p.user_id),
    guests: guestRows.filter((g:any)=>g.meal_plan_id===row.id).map((g:any)=>({id:g.id,name:g.name})) as MealGuest[],
    notes: row.notes ?? null,
    meal_mode: (row.meal_mode ?? 'fresh') as MealMode,
    leftover_from_meal_id: row.leftover_from_meal_id ?? null,
  }));
}

export async function setMealSlot(args: {
  householdId: string;
  date: string;
  mealType: MealType;
  recipeId?: string | null;
  customTitle?: string | null;
  notes?: string | null;
  cookUserId?: string | null;
  participantUserIds?: string[];
  guestNames?: string[];
  servings?: number | null;
  mealMode?: MealMode;
  leftoverFromMealId?: string | null;
}) {
  if (!supabase) throw new Error('Mode démo');
  const { data, error } = await supabase.rpc('set_meal_slot', {
    p_household_id: args.householdId,
    p_meal_date: args.date,
    p_meal_type: args.mealType,
    p_recipe_id: args.recipeId ?? null,
    p_custom_title: args.customTitle ?? null,
    p_notes: args.notes ?? null,
    p_servings: args.servings ?? null,
    p_meal_mode: args.mealMode ?? 'fresh',
    p_leftover_from_meal_id: args.leftoverFromMealId ?? null,
    p_cook_user_id: args.cookUserId ?? null,
    p_participant_user_ids: args.participantUserIds ?? null,
    p_guest_names: args.guestNames ?? null,
  });
  if (error) throw error;
  return String(data);
}

export async function clearMealSlot(householdId: string, date: string, mealType: MealType) {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('household_id', householdId)
    .eq('meal_date', date)
    .eq('meal_type', mealType)
    .select('id');
  if (error) return rethrowHouseholdMutationError(householdId,error);
  await assertHouseholdWriteIfNoRows(householdId,data);
}

export async function addQuickMeal(householdId: string, date: string, title: string, mealType: MealType = 'dinner') {
  return setMealSlot({ householdId, date, mealType, customTitle: title });
}

export async function rebuildShoppingList(householdId: string, weekStart: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('rebuild_weekly_shopping_list', {
    p_household_id: householdId,
    p_week_start: weekStart,
  });
  if (error) throw error;
}

export async function copyPreviousWeek(householdId:string,targetWeekStart:string):Promise<number>{
  if(!supabase) return 0;
  const {data,error}=await supabase.rpc('copy_previous_week',{p_household_id:householdId,p_target_week_start:targetWeekStart});
  if(error) throw error;
  return Number(data??0);
}

const mealCacheKey=(householdId:string,weekStart:string)=>`notre-table:planning:${householdId}:${weekStart}`;
export async function readCachedMeals(householdId:string,weekStart:string):Promise<MealSlot[]>{
  return readStoredJson<MealSlot[]>(mealCacheKey(householdId,weekStart),[],isArray as (value:unknown)=>value is MealSlot[]);
}
export async function cacheMeals(householdId:string,weekStart:string,meals:MealSlot[]):Promise<void>{
  await writeStoredJson(mealCacheKey(householdId,weekStart),meals);
}
