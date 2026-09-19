import {readStoredJson,writeStoredJson,isRecord} from '../lib/storage';

const KEY='@notre-table/lia-speaker-identities-v1';
const MAX=24;

export type LiaKnownSpeaker={
  trackId:string;
  subjectKind:'profile'|'light_member';
  subjectId:string;
  displayName:string;
  confirmedAtIso:string;
  lastHeardAtIso:string;
};

type Store={speakers:LiaKnownSpeaker[]};

function valid(value:unknown):value is Store{
  return isRecord(value)&&Array.isArray(value.speakers);
}

function clean(value:string){return value.trim().replace(/\s+/g,' ').slice(0,80);}

export async function rememberLiaSpeakerIdentity(input:{
  trackId:string;
  subjectKind:'profile'|'light_member';
  subjectId:string;
  displayName:string;
  now?:Date;
}):Promise<LiaKnownSpeaker>{
  const now=input.now??new Date();
  const speaker:LiaKnownSpeaker={
    trackId:input.trackId,
    subjectKind:input.subjectKind,
    subjectId:input.subjectId,
    displayName:clean(input.displayName),
    confirmedAtIso:now.toISOString(),
    lastHeardAtIso:now.toISOString(),
  };
  const store=await readStoredJson<Store>(KEY,{speakers:[]},valid);
  const speakers=[speaker,...store.speakers.filter(item=>item.trackId!==speaker.trackId&&!(item.subjectKind===speaker.subjectKind&&item.subjectId===speaker.subjectId))].slice(0,MAX);
  await writeStoredJson(KEY,{speakers});
  return speaker;
}

export async function knownLiaSpeaker(trackId:string):Promise<LiaKnownSpeaker|null>{
  const store=await readStoredJson<Store>(KEY,{speakers:[]},valid);
  return store.speakers.find(item=>item.trackId===trackId)??null;
}

export function liaSpeakerGreeting(name:string,languageTag:string):string{
  const n=clean(name);
  if(languageTag.toLowerCase().startsWith('fr'))return `Ah, salut ${n} !`;
  if(languageTag.toLowerCase().startsWith('he'))return `אה, שלום ${n}!`;
  return `Ah, hi ${n}!`;
}

export function liaIdentityAnswerName(text:string):string|null{
  const raw=clean(text).replace(/[.!?]+$/,'');
  const match=raw.match(/^(?:moi c['’]?est|c['’]?est|je suis|mon prénom c['’]?est|my name is|i['’]?m|i am)\s+(.+)$/i);
  const candidate=clean(match?.[1]??raw);
  if(!candidate||candidate.length>50||candidate.split(' ').length>4)return null;
  if(/^(oui|non|yes|no|ok|d accord|je sais pas|i don t know)$/i.test(candidate.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))return null;
  return candidate;
}
