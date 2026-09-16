import { isArray, readStoredJson, writeStoredJson } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { assertHouseholdWriteIfNoRows, rethrowHouseholdMutationError } from './householdWriteGuard';
import type { PantryItem, ShoppingItem } from '../types';
import { canonicalIngredientKey } from '../domain/ingredients';
import { normalizeAisle, normalizeUnit, type AisleCode } from '../domain/catalog';
import { earliestExpiry, parseIsoDay } from '../lib/pantryExpiry';

const cacheKey=(householdId:string)=>`notre-table:pantry:${householdId}`;

export async function readCachedPantry(householdId:string):Promise<PantryItem[]>{
  return readStoredJson<PantryItem[]>(cacheKey(householdId),[],isArray as (value:unknown)=>value is PantryItem[]);
}

export async function cachePantry(householdId:string,items:PantryItem[]):Promise<void>{
  await writeStoredJson(cacheKey(householdId),items);
}

export async function fetchPantry(householdId:string):Promise<PantryItem[]>{
  if(!supabase)return readCachedPantry(householdId);
  const {data,error}=await supabase
    .from('pantry_items')
    .select('id,household_id,label,ingredient_key,quantity,unit,aisle,expires_on,updated_at')
    .eq('household_id',householdId)
    .order('aisle')
    .order('label');
  if(error)throw error;
  const items=(data??[]) as PantryItem[];
  await cachePantry(householdId,items);
  return items;
}

export async function addPantryItem(args:{householdId:string;label:string;quantity?:number|null;unit?:string|null;aisle?:AisleCode|null;expiresOn?:string|null}):Promise<void>{
  if(!supabase)throw new Error('DEMO');
  const label=args.label.trim();
  const ingredientKey=canonicalIngredientKey(label);
  const unit=normalizeUnit(args.unit??null)??null;
  const aisle=normalizeAisle(args.aisle);
  const expiresOn=args.expiresOn?.trim()||null;
  if(expiresOn&&!parseIsoDay(expiresOn))throw new Error('INVALID_EXPIRY');
  const {error}=await supabase.rpc('upsert_pantry_item',{
    p_household_id:args.householdId,
    p_label:label,
    p_ingredient_key:ingredientKey,
    p_quantity:args.quantity??null,
    p_unit:unit,
    p_aisle:aisle,
    p_expires_on:expiresOn,
  });
  if(error)throw error;
}

export async function removePantryItem(householdId:string,id:string):Promise<void>{
  if(!supabase)return;
  const {data,error}=await supabase.from('pantry_items').delete().eq('id',id).eq('household_id',householdId).select('id');
  if(error)return rethrowHouseholdMutationError(householdId,error);
  await assertHouseholdWriteIfNoRows(householdId,data);
}

export async function addCachedPantryItem(args:{householdId:string;label:string;quantity?:number|null;unit?:string|null;aisle?:AisleCode|null;expiresOn?:string|null}):Promise<void>{
  const current=await readCachedPantry(args.householdId);
  const key=canonicalIngredientKey(args.label);
  const unit=normalizeUnit(args.unit??null)??null;
  const aisle=normalizeAisle(args.aisle);
  const expiresOn=args.expiresOn?.trim()||null;
  if(expiresOn&&!parseIsoDay(expiresOn))throw new Error('INVALID_EXPIRY');
  const idx=current.findIndex(item=>(item.ingredient_key??canonicalIngredientKey(item.label))===key&&(item.unit??null)===unit);
  const quantity=args.quantity??null;
  if(idx>=0){
    const existing=current[idx];
    const merged=existing.quantity==null||quantity==null?null:(existing.quantity+quantity);
    current[idx]={...existing,label:args.label.trim(),quantity:merged,aisle,expires_on:earliestExpiry(existing.expires_on,expiresOn),updated_at:new Date().toISOString()};
  }else{
    current.push({id:`pantry-demo-${Date.now()}`,household_id:args.householdId,label:args.label.trim(),ingredient_key:key,quantity,unit,aisle,expires_on:expiresOn,updated_at:new Date().toISOString()});
  }
  await cachePantry(args.householdId,current);
}

export async function removeCachedPantryItem(householdId:string,id:string):Promise<void>{
  const current=await readCachedPantry(householdId);
  await cachePantry(householdId,current.filter(item=>item.id!==id));
}

/**
 * Client-side preview used in demo/offline mode. A pantry line with an explicit
 * quantity only subtracts from a shopping line when units match. A pantry line
 * without a quantity acts as an intentional "we already have this" marker.
 */
export function subtractPantryFromShopping(items:ShoppingItem[],pantry:PantryItem[]):ShoppingItem[]{
  return items.flatMap(item=>{
    if(item.source==='manual')return [item];
    const key=item.ingredient_key??canonicalIngredientKey(item.label);
    const matches=pantry.filter(p=>(p.ingredient_key??canonicalIngredientKey(p.label))===key);
    if(!matches.length)return [item];
    if(matches.some(p=>p.quantity==null))return [];
    if(item.quantity==null)return [item];
    const sameUnit=matches.filter(p=>(p.unit??null)===(item.unit??null)&&p.quantity!=null);
    if(!sameUnit.length)return [item];
    const available=sameUnit.reduce((sum,p)=>sum+Number(p.quantity??0),0);
    const remaining=Math.max(0,Number(item.quantity)-available);
    return remaining>0?[{...item,quantity:remaining}]:[];
  });
}
