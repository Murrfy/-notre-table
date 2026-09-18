import type {LiaFamilyFormDraft,LiaRelationshipStatus} from './liaFamilyForm';

export type LiaProfilePatch=
  |{kind:'relationship_status';value:LiaRelationshipStatus}
  |{kind:'organizer_age';value:string}
  |{kind:'organizer_phone';value:string}
  |{kind:'member_age';memberIndex:number;memberName:string;value:string}
  |{kind:'member_phone';memberIndex:number;memberName:string;value:string};

export type LiaProfileFillProposal={
  transcript:string;
  patches:LiaProfilePatch[];
};

const digits=(value:string)=>value.replace(/[^0-9+]/g,'');
const lower=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function statusFromTranscript(raw:string):LiaRelationshipStatus|null{
  const t=lower(raw);
  if(/\b(celibataire|single|soltero|soltera|רווק|רווקה)\b/.test(t))return 'single';
  if(/\b(divorce|divorcee|divorciado|divorciada|divorced|גרוש|גרושה)\b/.test(t))return 'divorced';
  if(/\b(marie|mariee|married|casado|casada|נשוי|נשואה)\b/.test(t))return 'married';
  if(/\b(en couple|in a relationship|con pareja|בזוגיות)\b/.test(t))return 'partnered';
  return null;
}

function organizerAgeFromTranscript(raw:string):string|null{
  const t=lower(raw);
  const match=t.match(/\b(?:j['’ ]?ai|i am|tengo|אני בן|אני בת)\s+(\d{1,3})(?:\s*(?:ans|years?|anos|años))?\b/);
  if(!match)return null;
  const n=Number(match[1]);return n>=0&&n<=120?String(n):null;
}

function candidatePhones(raw:string):string[]{
  const matches=raw.match(/(?:\+?\d[\d\s().-]{5,}\d)/g)??[];
  return matches.map(value=>digits(value)).filter(value=>value.replace(/\D/g,'').length>=6&&value.replace(/\D/g,'').length<=18);
}

function namedAge(raw:string,name:string):string|null{
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`${escaped}[^\\d]{0,18}(\\d{1,3})(?:\\s*(?:ans|years?|anos|años))?`,'iu');
  const match=raw.match(re);if(!match)return null;const n=Number(match[1]);return n>=0&&n<=120?String(n):null;
}

function namedPhone(raw:string,name:string):string|null{
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`${escaped}[^+\\d]{0,25}((?:\\+?\\d[\\d\\s().-]{5,}\\d))`,'iu');
  const match=raw.match(re);if(!match)return null;const value=digits(match[1]);const count=value.replace(/\D/g,'').length;return count>=6&&count<=18?value:null;
}

/**
 * Converts a local speech transcript into a PROPOSAL only. It never mutates or saves
 * the family form. The organizer must explicitly confirm before applyLiaProfileProposal.
 */
export function liaProfileProposalFromTranscript(transcript:string,draft:LiaFamilyFormDraft):LiaProfileFillProposal{
  const patches:LiaProfilePatch[]=[];
  const status=statusFromTranscript(transcript);if(status&&status!==draft.relationshipStatus)patches.push({kind:'relationship_status',value:status});
  const organizerAge=organizerAgeFromTranscript(transcript);if(organizerAge&&organizerAge!==draft.age)patches.push({kind:'organizer_age',value:organizerAge});
  draft.members.forEach((member,memberIndex)=>{
    const memberName=member.firstName.trim();if(!memberName)return;
    const age=namedAge(transcript,memberName);if(age&&age!==member.age)patches.push({kind:'member_age',memberIndex,memberName,value:age});
    const phone=namedPhone(transcript,memberName);if(phone&&phone!==digits(member.phone))patches.push({kind:'member_phone',memberIndex,memberName,value:phone});
  });
  const phones=candidatePhones(transcript);
  if(phones.length===1&&!patches.some(p=>p.kind==='member_phone')&&!draft.phone.trim()){
    const t=lower(transcript);
    if(/\b(mon numero|mon telephone|my number|my phone|mi numero|mi telefono|הטלפון שלי|המספר שלי)\b/.test(t))patches.push({kind:'organizer_phone',value:phones[0]});
  }
  return {transcript:transcript.trim(),patches};
}

export function applyLiaProfileProposal(draft:LiaFamilyFormDraft,proposal:LiaProfileFillProposal,confirmed:boolean):LiaFamilyFormDraft{
  if(!confirmed)return draft;
  let next:LiaFamilyFormDraft={...draft,members:draft.members.map(member=>({...member}))};
  for(const patch of proposal.patches){
    if(patch.kind==='relationship_status')next.relationshipStatus=patch.value;
    else if(patch.kind==='organizer_age')next.age=patch.value;
    else if(patch.kind==='organizer_phone')next.phone=patch.value;
    else if(patch.kind==='member_age'&&next.members[patch.memberIndex])next.members[patch.memberIndex].age=patch.value;
    else if(patch.kind==='member_phone'&&next.members[patch.memberIndex])next.members[patch.memberIndex].phone=patch.value;
  }
  return next;
}

export function liaProfileProposalNeedsConfirmation(proposal:LiaProfileFillProposal):boolean{return proposal.patches.length>0;}
