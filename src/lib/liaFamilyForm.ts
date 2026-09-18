export type LiaSalutation='mr'|'mrs'|'other';
export type LiaFamilyRelation='spouse'|'child'|'other';
export type LiaRelationshipStatus='single'|'married'|'divorced'|'partnered';

export type LiaFamilyPersonDraft={
  relation:LiaFamilyRelation;
  relationLabel?:string;
  salutation?:LiaSalutation;
  firstName:string;
  age:string;
  phone:string;
};

export type LiaFamilyFormDraft={
  salutation:LiaSalutation;
  firstName:string;
  age:string;
  phone:string;
  relationshipStatus:LiaRelationshipStatus|'';
  members:LiaFamilyPersonDraft[];
};

export type LiaFamilyFormIssue={
  scope:'organizer'|'member';
  index?:number;
  field:'firstName'|'age'|'phone'|'relationLabel';
  code:'name_missing'|'age_invalid'|'phone_invalid'|'duplicate_phone'|'relation_missing';
};

/**
 * Missing relational context never blocks setup. LIA may come back to these
 * gently later, or offer to fill them from an explicitly confirmed dictation.
 */
export type LiaFamilySoftGap='relationship_status'|'organizer_age'|'organizer_phone'|'child_age'|'family_phone';

function normalizedDigits(value:string){return value.replace(/[^0-9]/g,'');}
function ageNumber(value:string){const trimmed=value.trim();if(!/^\d{1,3}$/.test(trimmed))return null;const n=Number(trimmed);return Number.isInteger(n)&&n>=0&&n<=120?n:null;}
function validName(value:string){return value.trim().length>=2&&value.trim().length<=60;}
function validPhone(value:string){const digits=normalizedDigits(value);return digits.length>=6&&digits.length<=18;}

export function validateLiaFamilyForm(draft:LiaFamilyFormDraft):LiaFamilyFormIssue[]{
  const issues:LiaFamilyFormIssue[]=[];
  const usedPhones=new Map<string,{scope:'organizer'|'member';index?:number}>();
  if(!validName(draft.firstName))issues.push({scope:'organizer',field:'firstName',code:'name_missing'});
  if(draft.age.trim()&&ageNumber(draft.age)===null)issues.push({scope:'organizer',field:'age',code:'age_invalid'});
  if(draft.phone.trim()){
    if(!validPhone(draft.phone))issues.push({scope:'organizer',field:'phone',code:'phone_invalid'});
    else usedPhones.set(normalizedDigits(draft.phone),{scope:'organizer'});
  }
  draft.members.forEach((member,index)=>{
    if(!validName(member.firstName))issues.push({scope:'member',index,field:'firstName',code:'name_missing'});
    if(member.age.trim()&&ageNumber(member.age)===null)issues.push({scope:'member',index,field:'age',code:'age_invalid'});
    if(member.phone.trim()&&!validPhone(member.phone))issues.push({scope:'member',index,field:'phone',code:'phone_invalid'});
    else if(member.phone.trim()){
      const normalized=normalizedDigits(member.phone);
      if(usedPhones.has(normalized))issues.push({scope:'member',index,field:'phone',code:'duplicate_phone'});
      else usedPhones.set(normalized,{scope:'member',index});
    }
    if(member.relation==='other'&&!member.relationLabel?.trim())issues.push({scope:'member',index,field:'relationLabel',code:'relation_missing'});
  });
  return issues;
}

/** Optional context LIA may gently ask for later. These gaps never block setup. */
export function liaFamilyFormSoftGaps(draft:LiaFamilyFormDraft):LiaFamilySoftGap[]{
  const gaps:LiaFamilySoftGap[]=[];
  if(!draft.relationshipStatus)gaps.push('relationship_status');
  if(!draft.age.trim())gaps.push('organizer_age');
  if(!draft.phone.trim())gaps.push('organizer_phone');
  if(draft.members.some(member=>member.relation==='child'&&!member.age.trim()))gaps.push('child_age');
  if(draft.members.some(member=>!member.phone.trim()))gaps.push('family_phone');
  return gaps;
}

export function liaFamilyFormPayload(draft:LiaFamilyFormDraft){
  return {
    salutation:draft.salutation,
    displayName:draft.firstName.trim(),
    age:draft.age.trim()?Number(draft.age):null,
    phoneNumber:draft.phone.trim()||null,
    relationshipStatus:draft.relationshipStatus||null,
    defaultPartySize:Math.max(1,Math.min(20,1+draft.members.length)),
    members:draft.members.map(member=>({
      relation:member.relation,
      relationLabel:member.relation==='other'?member.relationLabel?.trim()||null:null,
      salutation:member.relation==='child'?null:member.salutation??null,
      displayName:member.firstName.trim(),
      age:member.age.trim()?Number(member.age):null,
      phoneNumber:member.phone.trim()||null,
    })),
  };
}

/** Structured household facts belong in a form. LIA only speaks when the user needs
 * help or when validation finds a concrete omission/inconsistency. */
export function liaShouldAskInsteadOfOpenForm(input:{structuredFieldsKnown:boolean;ambiguityBlocksProgress:boolean}){
  return !input.structuredFieldsKnown&&input.ambiguityBlocksProgress;
}
