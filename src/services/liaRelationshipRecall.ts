import type {LiaAgentConfirmedFact} from '../lib/liaAgentRequest';
import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {listLiaRelationshipFacts,type LiaRelationshipFact} from './liaRelationshipMemory';
import {fetchLightMembers} from './lightParticipation';

const LEDGER_KEY='@notre-table/lia-private-memory-delight-v1';
const SPONTANEOUS_GAP_MS=24*60*60*1000;

type Ledger={lastDelightAtIso:string|null;lastFactId:string|null};
function validLedger(value:unknown):value is Ledger{
  return isRecord(value)&&(value.lastDelightAtIso===null||typeof value.lastDelightAtIso==='string')&&(value.lastFactId===null||typeof value.lastFactId==='string');
}
function fold(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();}
function quickParts(fact:LiaRelationshipFact):{subjectKind:'profile'|'light_member';subjectId:string;kind:'favorite_color'|'hair_color'|'perfume'|'shampoo'}|null{
  const match=/^quick:(p|m):([^:]+):(favorite_color|hair_color|perfume|shampoo)$/.exec(fact.factKey);
  if(!match)return null;
  return{subjectKind:match[1]==='p'?'profile':'light_member',subjectId:match[2],kind:match[3] as 'favorite_color'|'hair_color'|'perfume'|'shampoo'};
}
function keywordMatch(kind:'favorite_color'|'hair_color'|'perfume'|'shampoo',text:string):boolean{
  if(kind==='favorite_color')return /\b(couleur|color|couleur preferee|favorite color|deco|decoration|vetement|robe|style)\b/i.test(text);
  if(kind==='hair_color')return /\b(cheveux|hair|coiffure|hair color|couleur de cheveux)\b/i.test(text);
  if(kind==='perfume')return /\b(parfum|perfume|fragrance|odeur|sentir|smell|scent)\b/i.test(text);
  return /\b(shampoing|shampoo|cheveux|hair|soin capillaire|hair care)\b/i.test(text);
}
function label(kind:'favorite_color'|'hair_color'|'perfume'|'shampoo',languageTag:string):string{
  const fr=languageTag.toLowerCase().startsWith('fr');
  if(kind==='favorite_color')return fr?'couleur préférée':'favorite color';
  if(kind==='hair_color')return fr?'couleur de cheveux':'hair color';
  if(kind==='perfume')return fr?'parfum':'perfume';
  return fr?'shampoing':'shampoo';
}
function memoryFact(fact:LiaRelationshipFact,kind:'favorite_color'|'hair_color'|'perfume'|'shampoo',languageTag:string,key:string):LiaAgentConfirmedFact{
  const subject=fact.subjectLabel?.trim()||'utilisateur';
  return{
    key,
    value:`${subject} — ${label(kind,languageTag)} : ${fact.factValue}`.slice(0,160),
    scope:'persistent',
    confirmed:true,
    relevant:true,
    sensitive:false,
  };
}
function asksRememberedDetail(text:string):boolean{
  return /\b(souviens|rappelle|tu sais sur|tu connais sur|remember|what do you know|do you know about|te acuerdas|recuerdas)\b/i.test(text);
}

export async function collectLiaPrivateRelationshipRecall(input:{
  householdId:string;
  userText:string;
  languageTag:string;
  demo:boolean;
  allowDelight:boolean;
  now?:Date;
}):Promise<LiaAgentConfirmedFact[]>{
  if(!input.householdId)return[];
  const facts=(await listLiaRelationshipFacts(input.demo).catch(()=>[])).filter(fact=>fact.confirmed&&fact.sensitivity==='ordinary');
  const quick=facts.map(fact=>({fact,parts:quickParts(fact)})).filter((item):item is {fact:LiaRelationshipFact;parts:NonNullable<ReturnType<typeof quickParts>>}=>Boolean(item.parts));
  if(!quick.length)return[];

  let memberIds=new Set<string>();
  if(!input.demo){
    const members=await fetchLightMembers(input.householdId).catch(()=>[]);
    memberIds=new Set(members.filter(item=>item.active).map(item=>item.id));
  }
  const scoped=quick.filter(item=>item.parts.subjectKind==='profile'||input.demo||memberIds.has(item.parts.subjectId));
  if(!scoped.length)return[];

  const folded=fold(input.userText);
  const explicitMemory=asksRememberedDetail(folded);
  const relevant=scoped.filter(item=>{
    const subject=fold(item.fact.subjectLabel??'');
    const subjectMention=Boolean(subject&&folded.includes(subject));
    return keywordMatch(item.parts.kind,folded)||(explicitMemory&&subjectMention);
  }).slice(0,3);
  if(relevant.length){
    return relevant.map((item,index)=>memoryFact(item.fact,item.parts.kind,input.languageTag,`memory.private_relevant_${index+1}`));
  }

  if(!input.allowDelight)return[];
  const now=input.now??new Date();
  const ledger=await readStoredJson<Ledger>(LEDGER_KEY,{lastDelightAtIso:null,lastFactId:null},validLedger);
  const lastAt=ledger.lastDelightAtIso?Date.parse(ledger.lastDelightAtIso):0;
  if(lastAt&&now.getTime()-lastAt<SPONTANEOUS_GAP_MS)return[];
  const candidate=scoped.find(item=>item.fact.id!==ledger.lastFactId)??scoped[0];
  if(!candidate)return[];
  await writeStoredJson(LEDGER_KEY,{lastDelightAtIso:now.toISOString(),lastFactId:candidate.fact.id});
  return[memoryFact(candidate.fact,candidate.parts.kind,input.languageTag,'memory.private_delight')];
}
