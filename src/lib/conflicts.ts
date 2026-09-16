import { HouseholdMember, Recipe } from '../types';
import { canonicalIngredientKey } from '../domain/ingredients';
import { canonicalAllergyKeys, canonicalDietKeys, canonicalDislikedKeys } from '../domain/preferences';

export type FoodConflict={member:string;reason:string};
export function recipeConflicts(recipe:Recipe|undefined,members:HouseholdMember[]):FoodConflict[]{
  if(!recipe)return[];
  const ingredientKeys=new Set((recipe.ingredients??[]).map(i=>canonicalIngredientKey(i.name)));
  const tags=new Set((recipe.tags??[]).map(x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase()));
  const result:FoodConflict[]=[];
  const containsKey=(needle:string)=>ingredientKeys.has(needle)||Array.from(ingredientKeys).some(k=>k.includes(needle)||needle.includes(k));
  for(const member of members){
    const allergyKeys=member.allergy_keys?.length?member.allergy_keys:canonicalAllergyKeys(member.allergies);
    const dislikedKeys=member.disliked_ingredient_keys?.length?member.disliked_ingredient_keys:canonicalDislikedKeys(member.disliked_foods);
    const dietKeys=member.diet_keys?.length?member.diet_keys:canonicalDietKeys(member.diets);
    allergyKeys.forEach((key,i)=>{if(containsKey(key))result.push({member:member.display_name,reason:`allergy: ${member.allergies[i]??key}`})});
    dislikedKeys.forEach((key,i)=>{if(containsKey(key))result.push({member:member.display_name,reason:`disliked: ${member.disliked_foods[i]??key}`})});
    for(const diet of dietKeys){
      if((diet==='vegetarian'||diet==='vegan')&&!tags.has(diet)){
        const animal=['beef','chicken','pork','fish','salmon','tuna'];if(animal.some(containsKey))result.push({member:member.display_name,reason:`diet: ${diet}`});
      }
      if(diet==='no_pork'||diet==='halal'||diet==='kosher'){if(containsKey('pork'))result.push({member:member.display_name,reason:`diet: ${diet}`});}
      if(diet==='dairy_free'&&containsKey('milk'))result.push({member:member.display_name,reason:`diet: ${diet}`});
      if(diet==='gluten_free'&&(containsKey('wheat')||containsKey('gluten')))result.push({member:member.display_name,reason:`diet: ${diet}`});
    }
  }
  const seen=new Set<string>();return result.filter(x=>{const key=`${x.member}|${x.reason}`;if(seen.has(key))return false;seen.add(key);return true});
}
