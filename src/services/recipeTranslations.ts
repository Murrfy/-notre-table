import { supabase } from '../lib/supabase';
import type { Recipe, RecipeIngredient } from '../types';
import type { SupportedLanguage } from '../i18n';

export type RecipeTranslationView={
  recipeId:string;
  language:string;
  title:string;
  ingredientNames:Record<number,string>;
  steps:string[];
  sourceHash?:string|null;
};

type TranslationRow={
  recipe_id:string;
  language_code:string;
  title:string;
  ingredients:unknown;
  steps:string[]|null;
  source_hash?:string|null;
};

function sourceHash(recipe:Recipe):string{
  const source=JSON.stringify({
    title:recipe.title,
    ingredients:(recipe.ingredients??[]).map(x=>({name:x.name,quantity:x.quantity??null,unit:x.unit??null})),
    steps:recipe.steps??[],
  });
  // FNV-1a: deterministic invalidation marker, not a security hash.
  let hash=2166136261;
  for(let i=0;i<source.length;i++){
    hash^=source.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(16).padStart(8,'0');
}

function ingredientNameMap(value:unknown):Record<number,string>{
  const out:Record<number,string>={};
  if(!Array.isArray(value))return out;
  value.forEach((entry,index)=>{
    if(typeof entry==='string'&&entry.trim())out[index]=entry.trim();
    else if(entry&&typeof entry==='object'){
      const raw=entry as any;
      const at=Number.isInteger(raw.index)?Number(raw.index):index;
      if(typeof raw.name==='string'&&raw.name.trim())out[at]=raw.name.trim();
    }
  });
  return out;
}

export async function fetchRecipeTranslation(recipe:Recipe,targetLanguage:SupportedLanguage):Promise<RecipeTranslationView|null>{
  if(!supabase)return null;
  const {data,error}=await supabase
    .from('recipe_translations')
    .select('recipe_id, language_code, title, ingredients, steps, source_hash')
    .eq('recipe_id',recipe.id)
    .eq('language_code',targetLanguage)
    .maybeSingle();
  if(error)throw error;
  if(!data)return null;
  const row=data as TranslationRow;
  const currentHash=sourceHash(recipe);
  if(row.source_hash&&row.source_hash!==currentHash)return null;
  return {
    recipeId:row.recipe_id,
    language:row.language_code,
    title:row.title,
    ingredientNames:ingredientNameMap(row.ingredients),
    steps:Array.isArray(row.steps)?row.steps:[],
    sourceHash:row.source_hash??null,
  };
}

export function translatedIngredients(recipe:Recipe,translation:RecipeTranslationView|null):RecipeIngredient[]{
  if(!translation)return recipe.ingredients??[];
  return (recipe.ingredients??[]).map((ingredient,index)=>({
    ...ingredient,
    name:translation.ingredientNames[index]??ingredient.name,
  }));
}

export function recipeTranslationSourceHash(recipe:Recipe):string{
  return sourceHash(recipe);
}
