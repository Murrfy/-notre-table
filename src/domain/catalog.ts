export type DifficultyCode='easy'|'medium'|'hard';
export type AisleCode='produce'|'fresh'|'meat_fish'|'pantry'|'frozen'|'drinks'|'other';
export type UnitCode='piece'|'pack'|'ball'|'can'|'box'|'g'|'kg'|'ml'|'l'|'tsp'|'tbsp'|'cup'|'oz'|'lb';

export const aisleOrder:AisleCode[]=['produce','fresh','meat_fish','pantry','frozen','drinks','other'];

const aisleAliases:Record<string,AisleCode>={
  'fruits & légumes':'produce','fruits et légumes':'produce','fruit & vegetables':'produce','fruits and vegetables':'produce','frutas y verduras':'produce','פירות וירקות':'produce',
  'produits frais':'fresh','fresh food':'fresh','frescos':'fresh','מוצרים טריים':'fresh',
  'viandes & poissons':'meat_fish','viandes et poissons':'meat_fish','meat & fish':'meat_fish','carne y pescado':'meat_fish','בשר ודגים':'meat_fish',
  'épicerie':'pantry','pantry':'pantry','despensa':'pantry','מזווה':'pantry',
  'surgelés':'frozen','frozen':'frozen','congelados':'frozen','קפואים':'frozen',
  'boissons':'drinks','drinks':'drinks','bebidas':'drinks','משקאות':'drinks',
  'autres':'other','other':'other','otros':'other','אחר':'other',
};

export function normalizeAisle(value?:string|null):AisleCode{
  if(!value)return'other';
  if((aisleOrder as string[]).includes(value))return value as AisleCode;
  return aisleAliases[value.trim().toLocaleLowerCase()]??'other';
}

export function normalizeDifficulty(value?:string|null):DifficultyCode{
  const v=(value??'').trim().toLocaleLowerCase();
  if(v==='medium'||v==='moyen'||v==='media'||v==='בינוני')return'medium';
  if(v==='hard'||v==='difficile'||v==='difícil'||v==='קשה')return'hard';
  return'easy';
}

const unitAliases:Record<string,UnitCode>={
  'piece':'piece','pieces':'piece','pièce':'piece','pièces':'piece','unidad':'piece','unidades':'piece','יחידה':'piece','יחידות':'piece',
  'pack':'pack','package':'pack','paquet':'pack','paquets':'pack','paquete':'pack','חבילה':'pack',
  'ball':'ball','boule':'ball','boules':'ball','bola':'ball','כדור':'ball',
  'can':'can','boîte':'can','boîtes':'can','lata':'can','פחית':'can',
  'box':'box','caja':'box','קופסה':'box',
  'g':'g','gram':'g','grams':'g','gramme':'g','grammes':'g','גרם':'g',
  'kg':'kg','kilogram':'kg','kilograms':'kg','ק״ג':'kg','קג':'kg',
  'ml':'ml','מ״ל':'ml','מל':'ml','l':'l','liter':'l','litre':'l','litres':'l','ל׳':'l',
  'tsp':'tsp','teaspoon':'tsp','c. à café':'tsp','cdta':'tsp','כפית':'tsp',
  'tbsp':'tbsp','tablespoon':'tbsp','c. à soupe':'tbsp','cda':'tbsp','כף':'tbsp',
  'cup':'cup','cups':'cup','tasse':'cup','tasses':'cup','taza':'cup','כוס':'cup',
  'oz':'oz','lb':'lb',
};
export function normalizeUnit(value?:string|null):UnitCode|string|null{
  if(!value)return null;const v=value.trim().toLocaleLowerCase();return unitAliases[v]??value.trim();
}
