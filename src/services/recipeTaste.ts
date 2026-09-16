import { isRecord, readStoredJson, writeStoredJson } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { assertHouseholdWriteIfNoRows, rethrowHouseholdMutationError } from './householdWriteGuard';
import { summarizeRecipeTaste } from '../lib/recipeTaste';
import type { RecipeReaction, RecipeTasteSummary } from '../types';

const demoKey=(householdId:string)=>`notre-table:demo:recipe-taste:${householdId}`;

type DemoTasteMap=Record<string,RecipeReaction>;

async function readDemoMap(householdId:string):Promise<DemoTasteMap>{
  const stored=await readStoredJson<Record<string,unknown>>(demoKey(householdId),{},isRecord);
  const clean:DemoTasteMap={};
  for(const [recipeId,reaction] of Object.entries(stored)){if(reaction==='again'||reaction==='ok'||reaction==='skip')clean[recipeId]=reaction;}
  return clean;
}

export async function fetchRecipeTaste(householdId:string,recipeId:string,demo=false):Promise<RecipeTasteSummary>{
  if(demo||!supabase){
    const map=await readDemoMap(householdId);
    const mine=map[recipeId]??null;
    return {recipe_id:recipeId,my_reaction:mine,counts:summarizeRecipeTaste(mine?[mine]:[])};
  }
  const [{data:userData,error:userError},{data,error}]=await Promise.all([
    supabase.auth.getUser(),
    supabase.from('recipe_feedback').select('user_id,reaction').eq('household_id',householdId).eq('recipe_id',recipeId),
  ]);
  if(userError)throw userError;
  if(error)throw error;
  const me=userData.user?.id;
  const rows=(data??[]) as Array<{user_id:string;reaction:RecipeReaction}>;
  return {
    recipe_id:recipeId,
    my_reaction:rows.find(row=>row.user_id===me)?.reaction??null,
    counts:summarizeRecipeTaste(rows.map(row=>row.reaction)),
  };
}


export async function fetchRecipeTasteMap(householdId:string,recipeIds:string[],demo=false):Promise<Record<string,RecipeTasteSummary['counts']>>{
  const unique=[...new Set(recipeIds.filter(Boolean))];
  if(!unique.length)return {};
  if(demo||!supabase){
    const map=await readDemoMap(householdId);
    return Object.fromEntries(unique.map(recipeId=>{
      const reaction=map[recipeId];
      return [recipeId,summarizeRecipeTaste(reaction?[reaction]:[])];
    }));
  }
  const {data,error}=await supabase.from('recipe_feedback').select('recipe_id,reaction').eq('household_id',householdId).in('recipe_id',unique);
  if(error)throw error;
  const grouped:Record<string,RecipeReaction[]>={};
  for(const row of (data??[]) as Array<{recipe_id:string;reaction:RecipeReaction}>){
    (grouped[row.recipe_id]??=[]).push(row.reaction);
  }
  return Object.fromEntries(unique.map(recipeId=>[recipeId,summarizeRecipeTaste(grouped[recipeId]??[])]));
}

export async function setMyRecipeTaste(householdId:string,recipeId:string,reaction:RecipeReaction|null,demo=false):Promise<void>{
  if(demo||!supabase){
    const map=await readDemoMap(householdId);
    if(reaction)map[recipeId]=reaction;else delete map[recipeId];
    await writeStoredJson(demoKey(householdId),map);
    return;
  }
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError||!userData.user)throw userError??new Error('Not signed in');
  if(!reaction){
    const {data,error}=await supabase.from('recipe_feedback').delete().eq('household_id',householdId).eq('recipe_id',recipeId).eq('user_id',userData.user.id).select('recipe_id');
    if(error)return rethrowHouseholdMutationError(householdId,error);
    await assertHouseholdWriteIfNoRows(householdId,data);
    return;
  }
  const {error}=await supabase.from('recipe_feedback').upsert({
    household_id:householdId,
    recipe_id:recipeId,
    user_id:userData.user.id,
    reaction,
    updated_at:new Date().toISOString(),
  },{onConflict:'recipe_id,user_id'});
  if(error)return rethrowHouseholdMutationError(householdId,error);
}
