import { canonicalIngredientKey } from '../domain/ingredients';
import type { PantryItem, Recipe, RecipeIngredient } from '../types';

export type RecipePantryMatch={
  recipe:Recipe;
  matched:number;
  total:number;
  missing:RecipeIngredient[];
  insufficient:RecipeIngredient[];
  quantityUnknown:RecipeIngredient[];
  coverage:number;
};

function ingredientKey(ingredient:RecipeIngredient):string{
  return ingredient.ingredient_key??canonicalIngredientKey(ingredient.name);
}

function pantryMap(items:Array<Pick<PantryItem,'label'|'ingredient_key'|'quantity'|'unit'>>):Map<string,Pick<PantryItem,'label'|'ingredient_key'|'quantity'|'unit'>>{
  const available=new Map<string,Pick<PantryItem,'label'|'ingredient_key'|'quantity'|'unit'>>();
  for(const item of items){
    const key=item.ingredient_key??canonicalIngredientKey(item.label);
    if(!key)continue;
    const current=available.get(key);
    if(!current){available.set(key,item);continue;}
    if(current.quantity==null&&item.quantity!=null)available.set(key,item);
  }
  return available;
}

function normalizedUnit(value:string|null|undefined):string|null{
  const unit=String(value??'').trim().toLocaleLowerCase();
  return unit||null;
}

function quantityState(
  ingredient:RecipeIngredient,
  pantryItem:Pick<PantryItem,'quantity'|'unit'>,
  scale:number,
):'enough'|'insufficient'|'unknown'|null{
  const recipeQuantity=ingredient.quantity;
  if(recipeQuantity==null||!Number.isFinite(Number(recipeQuantity))||Number(recipeQuantity)<=0)return null;
  const required=Number(recipeQuantity)*scale;
  const available=pantryItem.quantity;
  if(available==null||!Number.isFinite(Number(available)))return 'unknown';
  const recipeUnit=normalizedUnit(ingredient.unit);
  const pantryUnit=normalizedUnit(pantryItem.unit);
  if(recipeUnit!==pantryUnit)return 'unknown';
  return Number(available)+1e-9>=required?'enough':'insufficient';
}

export function rankRecipesForPantry(
  recipes:Recipe[],
  pantry:Array<Pick<PantryItem,'label'|'ingredient_key'|'quantity'|'unit'>>,
  limit=3,
  partySize?:number|null,
):RecipePantryMatch[]{
  const available=pantryMap(pantry);
  const safePartySize=partySize!=null&&Number.isFinite(partySize)&&partySize>0?partySize:null;
  return recipes
    .map(recipe=>{
      const ingredients=recipe.ingredients??[];
      const relevant=ingredients.filter(item=>Boolean(ingredientKey(item)));
      const missing:RecipeIngredient[]=[];
      const insufficient:RecipeIngredient[]=[];
      const quantityUnknown:RecipeIngredient[]=[];
      const recipePortions=Number.isFinite(recipe.portions)&&recipe.portions>0?recipe.portions:1;
      const scale=safePartySize?safePartySize/recipePortions:1;
      let matched=0;
      for(const ingredient of relevant){
        const item=available.get(ingredientKey(ingredient));
        if(!item){missing.push(ingredient);continue;}
        matched++;
        if(!safePartySize)continue;
        const state=quantityState(ingredient,item,scale);
        if(state==='insufficient')insufficient.push(ingredient);
        else if(state==='unknown')quantityUnknown.push(ingredient);
      }
      const total=relevant.length;
      const coverage=total?matched/total:0;
      return {recipe,matched,total,missing,insufficient,quantityUnknown,coverage};
    })
    .filter(match=>match.total>0&&match.matched>0)
    .sort((a,b)=>{
      const aHard=a.missing.length+a.insufficient.length;
      const bHard=b.missing.length+b.insufficient.length;
      if(aHard!==bHard)return aHard-bHard;
      if(a.quantityUnknown.length!==b.quantityUnknown.length)return a.quantityUnknown.length-b.quantityUnknown.length;
      if(a.coverage!==b.coverage)return b.coverage-a.coverage;
      const aTime=a.recipe.prep_minutes+a.recipe.cook_minutes;
      const bTime=b.recipe.prep_minutes+b.recipe.cook_minutes;
      return aTime-bTime;
    })
    .slice(0,Math.max(1,limit));
}
