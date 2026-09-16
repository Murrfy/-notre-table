import { isArray, readStoredJson, writeStoredJson } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { ShoppingItem } from '../types';
import { AisleCode, normalizeAisle } from '../domain/catalog';
import { canonicalIngredientKey } from '../domain/ingredients';
import { compactPendingToggleQueue, overlayPendingToggles, replayBelongsToCurrentUser, shoppingQueueStorageKey, type PendingToggle } from '../lib/offlineQueue';
import { assertHouseholdWriteAllowed, assertHouseholdWriteIfNoRows, rethrowHouseholdMutationError } from './householdWriteGuard';

const cacheKey = (householdId: string, weekStart: string) => `notre-table:shopping:${householdId}:${weekStart}`;

export async function readCachedShopping(householdId: string, weekStart: string): Promise<ShoppingItem[]> {
  return readStoredJson<ShoppingItem[]>(cacheKey(householdId, weekStart),[],isArray as (value:unknown)=>value is ShoppingItem[]);
}
export async function cacheShopping(householdId: string, weekStart: string, items: ShoppingItem[]) { await writeStoredJson(cacheKey(householdId, weekStart),items); }
function isPendingToggleArray(value:unknown):value is PendingToggle[]{
  return Array.isArray(value)&&value.every(item=>!!item&&typeof item==='object'&&typeof (item as PendingToggle).id==='string'&&typeof (item as PendingToggle).checked==='boolean');
}
async function currentUserId(): Promise<string | null> {
  if(!supabase)return null;
  const {data}=await supabase.auth.getSession();
  return data.session?.user.id??null;
}

const queueLocks=new Map<string,Promise<void>>();
async function withQueueLock<T>(key:string,task:()=>Promise<T>):Promise<T>{
  const previous=queueLocks.get(key)??Promise.resolve();
  let release!:()=>void;
  const current=new Promise<void>(resolve=>{release=resolve;});
  const tail=previous.catch(()=>undefined).then(()=>current);
  queueLocks.set(key,tail);
  await previous.catch(()=>undefined);
  try{return await task();}
  finally{
    release();
    if(queueLocks.get(key)===tail)queueLocks.delete(key);
  }
}
async function queueContext(householdId:string,weekStart:string):Promise<{key:string;userId:string}|null>{
  const userId=await currentUserId();
  return userId?{key:shoppingQueueStorageKey(householdId,weekStart,userId),userId}:null;
}
async function readQueueByKey(key:string):Promise<PendingToggle[]>{
  return readStoredJson<PendingToggle[]>(key,[],isPendingToggleArray);
}
async function queueToggle(householdId: string, weekStart: string, op: PendingToggle) {
  const context=await queueContext(householdId,weekStart);
  if(!context)return;
  await withQueueLock(context.key,async()=>{
    const current=await readQueueByKey(context.key);
    await writeStoredJson(context.key,compactPendingToggleQueue(current,op));
  });
}
export async function pendingShoppingQueueCount(householdId:string,weekStart:string):Promise<number>{
  if(!supabase)return 0;
  const context=await queueContext(householdId,weekStart);
  if(!context)return 0;
  return withQueueLock(context.key,async()=>(await readQueueByKey(context.key)).length);
}
export async function flushShoppingQueue(householdId: string, weekStart: string): Promise<number> {
  if (!supabase) return 0;
  const context=await queueContext(householdId,weekStart);
  if(!context)return 0;
  return withQueueLock(context.key,async()=>{
    const ops=await readQueueByKey(context.key);
    if (!ops.length) return 0;
    const failed: PendingToggle[] = [];
    for (let index=0;index<ops.length;index++) {
      const op=ops[index];
      const replayUserId=await currentUserId();
      if(!replayBelongsToCurrentUser(context.userId,replayUserId)){
        failed.push(...ops.slice(index));
        break;
      }
      const { data, error } = await supabase.from('shopping_items').update({ checked: op.checked, checked_at: op.checked ? new Date().toISOString() : null }).eq('id', op.id).eq('household_id', householdId).eq('week_start', weekStart).select('id');
      if(error){failed.push(op);continue;}
      if(!(data??[]).length){
        try{await assertHouseholdWriteAllowed(householdId);}catch(gate){
          if(gate instanceof Error&&gate.message==='FAMILY_PLAN_REQUIRED')throw gate;
          failed.push(op);
        }
      }
    }
    // The per-context lock prevents a concurrently queued user intention from
    // being erased by the end-of-replay write.
    await writeStoredJson(context.key,failed);
    return failed.length;
  });
}
export async function fetchShopping(householdId: string, weekStart: string): Promise<ShoppingItem[]> {
  if (!supabase) return readCachedShopping(householdId, weekStart);
  await flushShoppingQueue(householdId, weekStart);
  const { data, error } = await supabase.from('shopping_items').select('id, household_id, label, quantity, unit, aisle, ingredient_key, checked, week_start, source').eq('household_id', householdId).eq('week_start', weekStart).order('aisle').order('created_at');
  if (error) throw error;
  const serverItems = (data ?? []) as ShoppingItem[];
  const context=await queueContext(householdId,weekStart);
  const pending=context?await withQueueLock(context.key,()=>readQueueByKey(context.key)):[];
  const items=overlayPendingToggles(serverItems,pending);
  await cacheShopping(householdId, weekStart, items);
  return items;
}
export async function toggleShoppingItem(householdId: string, weekStart: string, item: ShoppingItem, checked: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.from('shopping_items').update({ checked, checked_at: checked ? new Date().toISOString() : null }).eq('id', item.id).eq('household_id', householdId).eq('week_start', weekStart).select('id');
  if (error) { await queueToggle(householdId, weekStart, { id: item.id, checked }); return false; }
  if(!(data??[]).length){await assertHouseholdWriteAllowed(householdId);return false;}
  return true;
}
export async function addShoppingItem(householdId: string, weekStart: string, label: string, aisle:AisleCode='other') {
  if (!supabase) throw new Error('Mode démo');
  const { error } = await supabase.from('shopping_items').insert({household_id: householdId,week_start: weekStart,label: label.trim(),ingredient_key:canonicalIngredientKey(label),aisle,source: 'manual'});
  if(error)return rethrowHouseholdMutationError(householdId,error);
}
export async function deleteCheckedShopping(householdId:string,weekStart:string){
  if(!supabase)return;
  const {data,error}=await supabase.from('shopping_items').delete().eq('household_id',householdId).eq('week_start',weekStart).eq('checked',true).select('id');
  if(error)return rethrowHouseholdMutationError(householdId,error);
  await assertHouseholdWriteIfNoRows(householdId,data);
}

export async function addRecipeToShopping(householdId:string,weekStart:string,recipeId:string):Promise<number>{
  if(!supabase) return 0;
  const {data,error}=await supabase.rpc('add_recipe_to_shopping_list',{p_household_id:householdId,p_week_start:weekStart,p_recipe_id:recipeId});
  if(error) throw error;
  return Number(data??0);
}

export async function addRecipeIngredientsToCachedShopping(
  householdId:string,
  weekStart:string,
  ingredients:Array<{name:string;quantity?:number|null;unit?:string|null;aisle?:string|null}>
):Promise<number>{
  const current=await readCachedShopping(householdId,weekStart);
  const next=[...current];
  for(const ingredient of ingredients){
    const aisle=normalizeAisle(ingredient.aisle);
    const idx=next.findIndex(x=>!x.checked&&(x.ingredient_key??canonicalIngredientKey(x.label))===canonicalIngredientKey(ingredient.name)&&(x.unit??'')===(ingredient.unit??'')&&x.aisle===aisle);
    if(idx>=0){
      const prev=next[idx];
      const quantity=prev.quantity==null&&ingredient.quantity==null?null:prev.quantity==null?ingredient.quantity??null:ingredient.quantity==null?prev.quantity:(prev.quantity+ingredient.quantity);
      next[idx]={...prev,quantity};
    }else{
      next.push({id:`cache-${Date.now()}-${next.length}`,household_id:householdId,label:ingredient.name,ingredient_key:canonicalIngredientKey(ingredient.name),quantity:ingredient.quantity??null,unit:ingredient.unit??null,aisle,checked:false,week_start:weekStart,source:'recipe'});
    }
  }
  await cacheShopping(householdId,weekStart,next);
  return ingredients.length;
}
