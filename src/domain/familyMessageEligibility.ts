export type FamilyMessageRelation='spouse'|'child'|'other';
export type FamilyMessageCapabilities={
  canReceiveMessage:boolean;
  canChooseMeal:boolean;
  canAnswerPresence:boolean;
  canTakeCharge:boolean;
  canWriteNote:boolean;
  ageKnown:boolean;
};

/**
 * Age rules validated for family meal messages.
 * - No phone: no external message at all.
 * - Child <16: note only; no meal choice, presence question or take-charge.
 * - Child 16: meal choice + note; presence is implicit and take-charge is not offered.
 * - Child >=17: full meal/presence/take-charge response + note.
 * - Child age unknown: fail closed for age-gated actions; LIA may ask for the age later.
 * - Non-child reachable adults keep the full response surface.
 */
export function familyMessageCapabilities(input:{relation:FamilyMessageRelation;age:number|null;phoneNumber:string|null|undefined}):FamilyMessageCapabilities{
  const hasPhone=Boolean(input.phoneNumber?.trim());
  if(!hasPhone)return{canReceiveMessage:false,canChooseMeal:false,canAnswerPresence:false,canTakeCharge:false,canWriteNote:false,ageKnown:input.age!==null};
  if(input.relation!=='child')return{canReceiveMessage:true,canChooseMeal:true,canAnswerPresence:true,canTakeCharge:true,canWriteNote:true,ageKnown:input.age!==null};
  if(input.age===null)return{canReceiveMessage:true,canChooseMeal:false,canAnswerPresence:false,canTakeCharge:false,canWriteNote:true,ageKnown:false};
  if(input.age<16)return{canReceiveMessage:true,canChooseMeal:false,canAnswerPresence:false,canTakeCharge:false,canWriteNote:true,ageKnown:true};
  if(input.age===16)return{canReceiveMessage:true,canChooseMeal:true,canAnswerPresence:false,canTakeCharge:false,canWriteNote:true,ageKnown:true};
  return{canReceiveMessage:true,canChooseMeal:true,canAnswerPresence:true,canTakeCharge:true,canWriteNote:true,ageKnown:true};
}

export type FamilyMessageGuidance='missing_age'|'presence_not_needed'|'meal_choice_not_allowed'|'take_charge_not_allowed'|'presence_suggested';
export function liaFamilyMessageGuidance(input:{relation:FamilyMessageRelation;age:number|null;phoneNumber:string|null|undefined;presenceQuestionEnabled:boolean;mealChoicesEnabled:boolean;takeChargeEnabled:boolean}):FamilyMessageGuidance[]{
  const caps=familyMessageCapabilities(input);
  if(!caps.canReceiveMessage)return[];
  const out:FamilyMessageGuidance[]=[];
  if(input.relation==='child'&&!caps.ageKnown)out.push('missing_age');
  if(input.presenceQuestionEnabled&&!caps.canAnswerPresence)out.push('presence_not_needed');
  if(input.mealChoicesEnabled&&!caps.canChooseMeal)out.push('meal_choice_not_allowed');
  if(input.takeChargeEnabled&&!caps.canTakeCharge)out.push('take_charge_not_allowed');
  if(input.relation==='child'&&input.age!==null&&input.age>=17&&!input.presenceQuestionEnabled)out.push('presence_suggested');
  return out;
}
