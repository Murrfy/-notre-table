import { supabase } from '../lib/supabase';
import { Recipe, RecipeIngredient } from '../types';
import { AisleCode, DifficultyCode, normalizeAisle, normalizeDifficulty } from '../domain/catalog';
import { canonicalIngredientKey } from '../domain/ingredients';

export type RecipeDraft = {
  title: string;
  prepMinutes: number;
  cookMinutes: number;
  portions: number;
  tags: string[];
  ingredients: Array<{ name: string; quantity?: number | null; unit?: string | null; aisle?: AisleCode }>;
  steps: string[];
  sourceUrl?: string | null;
  photoUrl?: string | null;
  sourceLanguage?: string | null;
  difficulty?: DifficultyCode;
};

function normalizeRecipe(row:any):Recipe {
  const ingredients:RecipeIngredient[]=(row.recipe_ingredients??[]).map((x:any)=>({id:x.id,name:x.name,quantity:x.quantity??null,unit:x.unit??null,aisle:normalizeAisle(x.aisle),ingredient_key:x.ingredient_key??canonicalIngredientKey(x.name)}));
  const steps=Array.isArray(row.steps)?row.steps:[];
  return {id:row.id,title:row.title,prep_minutes:row.prep_minutes,cook_minutes:row.cook_minutes,portions:Number(row.portions),tags:row.tags??[],photo_url:row.photo_url??null,source_url:row.source_url??null,source_language:row.source_language??null,difficulty:normalizeDifficulty(row.difficulty),favorite:false,steps,ingredients};
}

const SELECT='id, title, prep_minutes, cook_minutes, portions, tags, photo_url, source_url, source_language, difficulty, steps, recipe_ingredients(id,name,quantity,unit,aisle,ingredient_key,sort_order)';

export async function fetchRecipes(householdId: string): Promise<Recipe[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('recipes').select(SELECT).eq('household_id', householdId).order('title');
  if (error) throw error;
  const rows=(data ?? []).map(normalizeRecipe);
  if(!rows.length)return rows;
  const {data:userData}=await supabase.auth.getUser();
  const uid=userData.user?.id;
  if(!uid)return rows;
  const {data:favs,error:favError}=await supabase.from('recipe_favorites').select('recipe_id').eq('user_id',uid).in('recipe_id',rows.map(r=>r.id));
  if(favError)throw favError;
  const favoriteIds=new Set((favs??[]).map((x:any)=>x.recipe_id));
  return rows.map(r=>({...r,favorite:favoriteIds.has(r.id)}));
}

export async function fetchRecipeDetails(recipeId:string):Promise<Recipe|null>{
  if(!supabase)return null;
  const {data,error}=await supabase.from('recipes').select(SELECT).eq('id',recipeId).maybeSingle();
  if(error)throw error;
  return data?normalizeRecipe(data):null;
}

export async function createRecipe(householdId: string, draft: RecipeDraft): Promise<string> {
  if (!supabase) throw new Error('Mode démo');
  const { data, error } = await supabase.rpc('create_recipe_with_ingredients', {
    p_household_id: householdId,
    p_title: draft.title.trim(),
    p_prep_minutes: draft.prepMinutes,
    p_cook_minutes: draft.cookMinutes,
    p_portions: draft.portions,
    p_tags: draft.tags,
    p_steps: draft.steps,
    p_ingredients: draft.ingredients.map(item=>({...item,aisle:normalizeAisle(item.aisle),normalized_key:canonicalIngredientKey(item.name)})),
    p_source_url: draft.sourceUrl ?? null,
    p_photo_url: draft.photoUrl ?? null,
    p_source_language: draft.sourceLanguage ?? null,
    p_difficulty: draft.difficulty ?? 'easy',
  });
  if (error) throw error;
  return String(data);
}

export async function addQuickRecipe(householdId: string, title: string): Promise<void> {
  await createRecipe(householdId, {title,prepMinutes:0,cookMinutes:0,portions:4,tags:[],ingredients:[],steps:[]});
}


export async function setRecipeFavorite(recipeId:string,favorite:boolean):Promise<void>{
  if(!supabase)throw new Error('Mode démo');
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  const uid=userData.user?.id;if(!uid)throw new Error('Utilisateur non connecté.');
  if(favorite){const {error}=await supabase.from('recipe_favorites').upsert({user_id:uid,recipe_id:recipeId});if(error)throw error;}
  else{const {error}=await supabase.from('recipe_favorites').delete().eq('user_id',uid).eq('recipe_id',recipeId);if(error)throw error;}
}
