import {rankRecipesForPantry} from '../lib/cookWithPantry';
import type {LiaAgentConfirmedFact} from '../lib/liaAgentRequest';
import type {LiaAssistantObjectivePlan,LiaAssistantReadCapability} from '../lib/liaAssistantObjective';
import {fetchPantry} from './pantry';
import {fetchRecipes} from './recipes';
import {fetchMeals,readCachedMeals} from './planning';
import {fetchShopping} from './shopping';
import {listLiaMemos} from './memos';
import {fetchLightMembers,type LightMember} from './lightParticipation';
import type {MealSlot,PantryItem,Recipe,ShoppingItem} from '../types';
import type {LiaMemo} from './memos';

function isoPlusDays(iso:string,days:number):string{
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if(!match)return iso;
  const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])+days));
  return date.toISOString().slice(0,10);
}
function compact(values:string[],limit=8):string{return values.filter(Boolean).slice(0,limit).join(' · ');}
function qty(value:number|null|undefined,unit:string|null|undefined):string{
  if(value==null)return'';return` ${value}${unit?` ${unit}`:''}`;
}
function confirmed(key:string,value:string):LiaAgentConfirmedFact|null{
  const clean=value.trim().replace(/\s+/g,' ');if(!clean)return null;
  return{key,value:clean.slice(0,160),scope:'session',confirmed:true,relevant:true,sensitive:false};
}

function pantryFact(items:PantryItem[]):LiaAgentConfirmedFact|null{
  return confirmed('app.pantry',items.length?compact(items.map(item=>`${item.label}${qty(item.quantity,item.unit)}`),10):'Aucun article enregistré dans les placards.');
}
function recipesFact(items:Recipe[]):LiaAgentConfirmedFact|null{
  return confirmed('app.recipes',items.length?compact(items.map(item=>`${item.title} (${item.portions}p)`),8):'Aucune recette enregistrée.');
}
function mealsFact(items:MealSlot[]):LiaAgentConfirmedFact|null{
  return confirmed('app.meal_plan',items.length?compact(items.map(item=>`${item.meal_date} ${item.meal_type}: ${item.title}`),8):'Aucun repas planifié sur la semaine affichée.');
}
function shoppingFact(items:ShoppingItem[]):LiaAgentConfirmedFact|null{
  const open=items.filter(item=>!item.checked);
  return confirmed('app.shopping',open.length?compact(open.map(item=>`${item.label}${qty(item.quantity,item.unit)}`),10):'Aucun article restant sur la liste de courses.');
}
function memosFact(items:LiaMemo[]):LiaAgentConfirmedFact|null{
  const active=items.filter(item=>item.status==='active');
  return confirmed('app.memos',active.length?compact(active.map(item=>item.title),6):'Aucun Mémo actif.');
}
function familyFact(items:LightMember[]):LiaAgentConfirmedFact|null{
  const active=items.filter(item=>item.active);
  return confirmed('app.family_members',active.length?compact(active.map(item=>`${item.display_name}${item.phone_number?.trim()?' (joignable)':' (sans numéro)'}`),12):'Aucun membre actif enregistré pour les messages famille.');
}
function matchesFact(recipes:Recipe[],pantry:PantryItem[]):LiaAgentConfirmedFact|null{
  if(!recipes.length||!pantry.length)return null;
  const matches=rankRecipesForPantry(recipes,pantry,3);
  if(!matches.length)return null;
  return confirmed('app.pantry_recipe_matches',matches.map(match=>{
    const missing=[...match.missing,...match.insufficient].map(item=>item.name).slice(0,4);
    const suffix=missing.length?`manque: ${missing.join(', ')}`:'tout est disponible';
    return`${match.recipe.title} ${Math.round(match.coverage*100)}% (${suffix})`;
  }).join(' · '));
}

type Loaded={pantry?:PantryItem[];recipes?:Recipe[];meals?:MealSlot[];shopping?:ShoppingItem[];memos?:LiaMemo[];family?:LightMember[]};

async function loadCapability(capability:LiaAssistantReadCapability,input:{householdId:string;weekStart:string;demo:boolean}):Promise<[LiaAssistantReadCapability,unknown]>{
  switch(capability){
    case'pantry.read':return[capability,await fetchPantry(input.householdId)];
    case'recipes.read':return[capability,await fetchRecipes(input.householdId)];
    case'planning.read':return[capability,input.demo?await readCachedMeals(input.householdId,input.weekStart):await fetchMeals(input.householdId,input.weekStart,isoPlusDays(input.weekStart,6))];
    case'shopping.read':return[capability,await fetchShopping(input.householdId,input.weekStart)];
    case'memos.read':return[capability,await listLiaMemos(input.demo)];
    case'family.read':return[capability,input.demo?[]:await fetchLightMembers(input.householdId)];
  }
}

/** Read-only app context for LIA. Failed sources are omitted rather than guessed. */
export async function collectLiaAssistantAppFacts(input:{
  householdId:string;
  weekStart:string;
  demo:boolean;
  plan:LiaAssistantObjectivePlan;
}):Promise<LiaAgentConfirmedFact[]>{
  if(!input.householdId||!input.weekStart||!input.plan.reads.length)return[];
  const settled=await Promise.allSettled(input.plan.reads.map(capability=>loadCapability(capability,input)));
  const loaded:Loaded={};
  for(const result of settled){
    if(result.status!=='fulfilled')continue;
    const[capability,value]=result.value;
    if(capability==='pantry.read')loaded.pantry=value as PantryItem[];
    else if(capability==='recipes.read')loaded.recipes=value as Recipe[];
    else if(capability==='planning.read')loaded.meals=value as MealSlot[];
    else if(capability==='shopping.read')loaded.shopping=value as ShoppingItem[];
    else if(capability==='memos.read')loaded.memos=value as LiaMemo[];
    else if(capability==='family.read')loaded.family=value as LightMember[];
  }
  const facts=[
    loaded.pantry?pantryFact(loaded.pantry):null,
    loaded.recipes?recipesFact(loaded.recipes):null,
    loaded.pantry&&loaded.recipes?matchesFact(loaded.recipes,loaded.pantry):null,
    loaded.meals?mealsFact(loaded.meals):null,
    loaded.shopping?shoppingFact(loaded.shopping):null,
    loaded.memos?memosFact(loaded.memos):null,
    loaded.family?familyFact(loaded.family):null,
  ];
  return facts.filter((fact):fact is LiaAgentConfirmedFact=>Boolean(fact));
}
