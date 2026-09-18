import type {MealType} from '../types';
import {normalizeAisle,type AisleCode} from '../domain/catalog';

export type LiaAssistantApprovedAction=
  |{type:'shopping.add_item';householdId:string;weekStart:string;label:string;confirmed:boolean}
  |{type:'planning.set_meal';householdId:string;date:string;mealType:MealType;recipeId?:string|null;customTitle?:string|null;confirmed:boolean}
  |{type:'memo.create';title:string;summary:string;demo:boolean;confirmed:boolean}
  |{type:'family.prepare_message';householdId:string;recipientMemberIds:string[];body:string;confirmed:boolean}
  |{type:'pantry.add_items';householdId:string;demo:boolean;items:Array<{label:string;quantity:number|null;unit:string|null;aisle:AisleCode}>;confirmed:boolean}
  |{type:'shopping.add_items';householdId:string;weekStart:string;demo:boolean;items:Array<{label:string;aisle:AisleCode}>;confirmed:boolean};

export type LiaAssistantActionValidation=
  |{ok:true;action:LiaAssistantApprovedAction}
  |{ok:false;reason:'confirmation_required'|'invalid_payload'};

const ISO_DAY=/^\d{4}-\d{2}-\d{2}$/;
const MEAL_TYPES=new Set<MealType>(['breakfast','lunch','dinner','snack']);
function clean(value:string,max:number):string{return value.trim().replace(/\s+/g,' ').slice(0,max);}

/**
 * A model or parser may propose an action, but this boundary is the last word
 * before any Notre Table write. Missing confirmation or malformed payloads
 * fail closed and are never repaired by guessing.
 */
export function validateLiaAssistantApprovedAction(action:LiaAssistantApprovedAction):LiaAssistantActionValidation{
  if(!action.confirmed)return{ok:false,reason:'confirmation_required'};
  if(action.type==='shopping.add_item'){
    const householdId=clean(action.householdId,120),weekStart=clean(action.weekStart,10),label=clean(action.label,120);
    if(!householdId||!ISO_DAY.test(weekStart)||label.length<1)return{ok:false,reason:'invalid_payload'};
    return{ok:true,action:{...action,householdId,weekStart,label}};
  }
  if(action.type==='planning.set_meal'){
    const householdId=clean(action.householdId,120),date=clean(action.date,10);
    const recipeId=action.recipeId==null?null:clean(action.recipeId,120);
    const customTitle=action.customTitle==null?null:clean(action.customTitle,120);
    if(!householdId||!ISO_DAY.test(date)||!MEAL_TYPES.has(action.mealType)||(!recipeId&&!customTitle))return{ok:false,reason:'invalid_payload'};
    return{ok:true,action:{...action,householdId,date,recipeId,customTitle}};
  }
  if(action.type==='shopping.add_items'){
    const householdId=clean(action.householdId,120),weekStart=clean(action.weekStart,10);
    const items=action.items.slice(0,24).map(item=>({label:clean(item.label,120),aisle:normalizeAisle(item.aisle)})).filter(item=>item.label);
    if(!householdId||!ISO_DAY.test(weekStart)||!items.length||items.length!==Math.min(action.items.length,24))return{ok:false,reason:'invalid_payload'};
    return{ok:true,action:{...action,householdId,weekStart,items}};
  }
  if(action.type==='pantry.add_items'){
    const householdId=clean(action.householdId,120);
    const items=action.items.slice(0,24).map(item=>{
      const label=clean(item.label,120);
      const quantity=item.quantity==null?null:Number(item.quantity);
      const unit=item.unit==null?null:clean(item.unit,30)||null;
      const aisle=normalizeAisle(item.aisle);
      if(!label||(quantity!==null&&(!Number.isFinite(quantity)||quantity<0||quantity>100000)))return null;
      return{label,quantity,unit,aisle};
    }).filter((item):item is {label:string;quantity:number|null;unit:string|null;aisle:AisleCode}=>Boolean(item));
    if(!householdId||!items.length||items.length!==Math.min(action.items.length,24))return{ok:false,reason:'invalid_payload'};
    return{ok:true,action:{...action,householdId,items}};
  }
  if(action.type==='family.prepare_message'){
    const householdId=clean(action.householdId,120),body=clean(action.body,500);
    const recipientMemberIds=[...new Set(action.recipientMemberIds.map(value=>clean(value,120)).filter(Boolean))].slice(0,20);
    if(!householdId||!body||recipientMemberIds.length===0)return{ok:false,reason:'invalid_payload'};
    return{ok:true,action:{...action,householdId,recipientMemberIds,body}};
  }
  const title=clean(action.title,120),summary=clean(action.summary,500);
  if(!title||!summary)return{ok:false,reason:'invalid_payload'};
  return{ok:true,action:{...action,title,summary}};
}
