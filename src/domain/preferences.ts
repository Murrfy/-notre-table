import { canonicalIngredientKey } from './ingredients';

export type DietKey='vegetarian'|'vegan'|'halal'|'kosher'|'no_pork'|'gluten_free'|'dairy_free'|'other';
const dietAliases:Record<string,DietKey>={
  'vegetarian':'vegetarian','vegetarien':'vegetarian','vegetarienne':'vegetarian','vegetariano':'vegetarian','vegetariana':'vegetarian','צמחוני':'vegetarian','צמחונית':'vegetarian',
  'vegan':'vegan','vegane':'vegan','vegano':'vegan','vegana':'vegan','טבעוני':'vegan','טבעונית':'vegan',
  'halal':'halal','חלאל':'halal',
  'kosher':'kosher','casher':'kosher','cacher':'kosher','כשר':'kosher',
  'sans porc':'no_pork','no pork':'no_pork','sin cerdo':'no_pork','ללא חזיר':'no_pork',
  'gluten free':'gluten_free','sans gluten':'gluten_free','sin gluten':'gluten_free','ללא גלוטן':'gluten_free',
  'dairy free':'dairy_free','sans lait':'dairy_free','sans lactose':'dairy_free','sin lacteos':'dairy_free','sin lácteos':'dairy_free','ללא חלב':'dairy_free',
};
function norm(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim().replace(/\s+/g,' ')}
export function canonicalDietKey(value:string):DietKey{return dietAliases[norm(value)]??'other'}
export function canonicalAllergyKeys(values:string[]):string[]{return Array.from(new Set(values.map(canonicalIngredientKey).filter(Boolean)))}
export function canonicalDislikedKeys(values:string[]):string[]{return Array.from(new Set(values.map(canonicalIngredientKey).filter(Boolean)))}
export function canonicalDietKeys(values:string[]):DietKey[]{return Array.from(new Set(values.map(canonicalDietKey)))}
