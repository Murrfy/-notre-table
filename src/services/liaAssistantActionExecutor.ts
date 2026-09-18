import {validateLiaAssistantApprovedAction,type LiaAssistantApprovedAction} from '../lib/liaAssistantActionPolicy';
import {addRecipeIngredientsToCachedShopping,addShoppingItem} from './shopping';
import {setMealSlot} from './planning';
import {createLiaMemo} from './memos';
import {fetchLightMembers} from './lightParticipation';
import {familyMessageCapabilities} from '../domain/familyMessageEligibility';
import {sanitizeLiaPhoneNumber} from '../lib/liaPhoneContactResolver';
import {composeLiaDeviceMessage,liaDeviceMessageComposerAvailable} from '../../modules/lia-device-contacts';
import {addCachedPantryItem,addPantryItem} from './pantry';

export type LiaAssistantActionExecution=
  |{status:'confirmation_required'}
  |{status:'invalid_payload'}
  |{status:'completed';actionType:LiaAssistantApprovedAction['type'];resultId?:string;resultCount?:number}
  |{status:'prepared';actionType:'family.prepare_message';recipientCount:number}
  |{status:'unavailable';actionType:'family.prepare_message'}
  |{status:'partial';actionType:'pantry.add_items'|'shopping.add_items';resultCount:number;failedCount:number}
  |{status:'failed'};

/**
 * The guarded execution bridge for assistant-originated actions. It receives a
 * fully structured action and still refuses to mutate anything until the
 * confirmation bit has survived the policy boundary.
 */
export async function executeLiaAssistantApprovedAction(action:LiaAssistantApprovedAction):Promise<LiaAssistantActionExecution>{
  const checked=validateLiaAssistantApprovedAction(action);
  if(!checked.ok)return{status:checked.reason};
  try{
    if(checked.action.type==='shopping.add_item'){
      await addShoppingItem(checked.action.householdId,checked.action.weekStart,checked.action.label);
      return{status:'completed',actionType:checked.action.type};
    }
    if(checked.action.type==='planning.set_meal'){
      const resultId=await setMealSlot({
        householdId:checked.action.householdId,
        date:checked.action.date,
        mealType:checked.action.mealType,
        recipeId:checked.action.recipeId??null,
        customTitle:checked.action.customTitle??null,
      });
      return{status:'completed',actionType:checked.action.type,resultId};
    }
    if(checked.action.type==='shopping.add_items'){
      if(checked.action.demo){
        const resultCount=await addRecipeIngredientsToCachedShopping(checked.action.householdId,checked.action.weekStart,checked.action.items.map(item=>({name:item.label,aisle:item.aisle})));
        return{status:'completed',actionType:checked.action.type,resultCount};
      }
      let resultCount=0,failedCount=0;
      for(const item of checked.action.items){
        try{await addShoppingItem(checked.action.householdId,checked.action.weekStart,item.label,item.aisle);resultCount++;}
        catch{failedCount++;}
      }
      if(resultCount&&failedCount)return{status:'partial',actionType:checked.action.type,resultCount,failedCount};
      if(resultCount)return{status:'completed',actionType:checked.action.type,resultCount};
      return{status:'failed'};
    }
    if(checked.action.type==='pantry.add_items'){
      let resultCount=0,failedCount=0;
      for(const item of checked.action.items){
        try{
          const args={householdId:checked.action.householdId,label:item.label,quantity:item.quantity,unit:item.unit,aisle:item.aisle};
          if(checked.action.demo)await addCachedPantryItem(args);else await addPantryItem(args);
          resultCount++;
        }catch{failedCount++;}
      }
      if(resultCount&&failedCount)return{status:'partial',actionType:checked.action.type,resultCount,failedCount};
      if(resultCount)return{status:'completed',actionType:checked.action.type,resultCount};
      return{status:'failed'};
    }
    if(checked.action.type==='family.prepare_message'){
      if(!liaDeviceMessageComposerAvailable())return{status:'unavailable',actionType:checked.action.type};
      const members=await fetchLightMembers(checked.action.householdId);
      const byId=new Map(members.map(member=>[member.id,member] as const));
      const selected=checked.action.recipientMemberIds.map(id=>byId.get(id));
      if(selected.some(member=>!member))return{status:'invalid_payload'};
      const recipients=selected.map(member=>{
        if(!member||!member.active)return null;
        const caps=familyMessageCapabilities({relation:member.relation,age:member.age,phoneNumber:member.phone_number});
        if(!caps.canReceiveMessage)return null;
        return sanitizeLiaPhoneNumber(member.phone_number);
      });
      if(recipients.some(phone=>!phone))return{status:'invalid_payload'};
      const phones=[...new Set(recipients.filter((phone):phone is string=>Boolean(phone)))];
      if(phones.length!==checked.action.recipientMemberIds.length)return{status:'invalid_payload'};
      const opened=await composeLiaDeviceMessage({recipients:phones,body:checked.action.body});
      return opened?{status:'prepared',actionType:checked.action.type,recipientCount:phones.length}:{status:'failed'};
    }
    const memo=await createLiaMemo({title:checked.action.title,summary:checked.action.summary},checked.action.demo);
    return{status:'completed',actionType:checked.action.type,resultId:memo.id};
  }catch{return{status:'failed'};}
}
