import type {LiaFamilyFormDraft,LiaRelationshipStatus} from './liaFamilyForm';

export type LiaStructuredReference='relationship'|'divorce'|'partner'|'family_member'|'family_contact';
export type LiaKnowledgeSource='profile_form'|'confirmed_conversation';

export type LiaKnowledgeGuardInput={
  reference:LiaStructuredReference;
  relationshipStatus?:LiaRelationshipStatus|''|null;
  familyMemberName?:string|null;
  familyMemberNames?:string[];
  familyMemberHasPhone?:boolean;
  source:LiaKnowledgeSource;
};

/**
 * Identity/family-structure claims are never inferred from silence or model guesswork.
 * Relationship/divorce/partner references must be backed by the structured profile form.
 * Family-member/contact references likewise require an actual form-backed member.
 */
export function liaMayReferenceStructuredFact(input:LiaKnowledgeGuardInput):boolean{
  if(input.source!=='profile_form')return false;
  if(input.reference==='relationship')return Boolean(input.relationshipStatus);
  if(input.reference==='divorce')return input.relationshipStatus==='divorced';
  if(input.reference==='partner')return input.relationshipStatus==='married'||input.relationshipStatus==='partnered';
  if(input.reference==='family_member'){
    const target=input.familyMemberName?.trim().toLocaleLowerCase();
    if(!target)return false;
    return (input.familyMemberNames??[]).some(name=>name.trim().toLocaleLowerCase()===target);
  }
  if(input.reference==='family_contact')return Boolean(input.familyMemberHasPhone);
  return false;
}

export function liaProfileKnowledgeFromDraft(draft:LiaFamilyFormDraft){
  return {
    relationshipStatus:draft.relationshipStatus||null,
    familyMemberNames:draft.members.map(member=>member.firstName.trim()).filter(Boolean),
    contacts:draft.members.filter(member=>member.phone.trim()).map(member=>member.firstName.trim()).filter(Boolean),
  };
}

export function liaRelationshipStatusLanguageAllowed(status:LiaRelationshipStatus|''|null,concept:'couple'|'marriage'|'divorce'):boolean{
  if(!status)return false;
  if(concept==='divorce')return status==='divorced';
  if(concept==='marriage')return status==='married';
  return status==='married'||status==='partnered';
}
