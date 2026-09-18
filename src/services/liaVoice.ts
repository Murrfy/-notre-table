import {readStoredJson,removeStoredValue,writeStoredJson} from '../lib/storage';
import {addLiaSpeechStateListener,liaNativeAudioModuleAvailable,listNativeLiaVoices,speakNativeLia,stopNativeLiaSpeech} from '../../modules/lia-sound-analysis';

const VOICE_KEY='notre-table:lia-voice-id:v1';
const LAUGHTER_APPROVED_KEY='notre-table:lia-laughter-approved:v1';
export type LiaVoiceOption={identifier:string;name:string;language:string;quality:string};
function baseLanguage(tag:string){return tag.split('-')[0]?.toLowerCase()||'en';}

export function liaVoiceAvailable():boolean{return liaNativeAudioModuleAvailable();}

export async function listLiaVoiceOptions(languageTag:string):Promise<LiaVoiceOption[]>{
  const base=baseLanguage(languageTag);
  return listNativeLiaVoices()
    .filter(voice=>baseLanguage(voice.language)===base)
    .map(voice=>({...voice}))
    .sort((a,b)=>{
      const exactA=a.language.toLowerCase()===languageTag.toLowerCase()?1:0;
      const exactB=b.language.toLowerCase()===languageTag.toLowerCase()?1:0;
      const highA=/enhanced|local/i.test(a.quality)?1:0;
      const highB=/enhanced|local/i.test(b.quality)?1:0;
      return (highB-highA)||(exactB-exactA)||a.name.localeCompare(b.name);
    });
}

export async function getPreferredLiaVoice(languageTag:string):Promise<LiaVoiceOption|null>{
  const options=await listLiaVoiceOptions(languageTag);
  if(!options.length)return null;
  const stored=await readStoredJson<string|null>(VOICE_KEY,null,(value):value is string|null=>value===null||typeof value==='string');
  return options.find(option=>option.identifier===stored)??options[0];
}

export async function setPreferredLiaVoice(identifier:string|null):Promise<void>{
  const previous=await readStoredJson<string|null>(VOICE_KEY,null,(value):value is string|null=>value===null||typeof value==='string');
  if(identifier)await writeStoredJson(VOICE_KEY,identifier); else await removeStoredValue(VOICE_KEY);
  if(previous!==identifier)await writeStoredJson(LAUGHTER_APPROVED_KEY,false);
}

export async function getLiaLaughterApproved():Promise<boolean>{
  return readStoredJson<boolean>(LAUGHTER_APPROVED_KEY,false,(value):value is boolean=>typeof value==='boolean');
}

export async function setLiaLaughterApproved(approved:boolean):Promise<void>{
  await writeStoredJson(LAUGHTER_APPROVED_KEY,approved);
}

export async function stopLiaVoice():Promise<void>{await stopNativeLiaSpeech();}

export async function speakLia(text:string,languageTag:string,voiceIdentifier?:string|null,callbacks?:{onStart?:()=>void;onDone?:()=>void;onStopped?:()=>void;onError?:()=>void}):Promise<boolean>{
  const clean=text.trim();
  if(!clean)return false;
  await stopNativeLiaSpeech();
  const utteranceId=`lia-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const subscription=addLiaSpeechStateListener(event=>{
    if(event.utteranceId!==utteranceId)return;
    if(event.state==='start')callbacks?.onStart?.();
    if(event.state==='done'){callbacks?.onDone?.();subscription?.remove();}
    if(event.state==='stopped'){callbacks?.onStopped?.();subscription?.remove();}
    if(event.state==='error'){callbacks?.onError?.();subscription?.remove();}
  });
  const accepted=await speakNativeLia(clean,languageTag,voiceIdentifier??null,utteranceId);
  if(!accepted){subscription?.remove();callbacks?.onError?.();}
  return accepted;
}

export function liaLaughterUtterance(reaction:'smile'|'chuckle'|'laugh',languageTag:string):string{
  const base=baseLanguage(languageTag);
  const table:Record<string,Record<'smile'|'chuckle'|'laugh',string>>={
    fr:{smile:'Hmm…',chuckle:'Ah ah !',laugh:'Ah ah ah !'},
    en:{smile:'Hmm…',chuckle:'Ha ha!',laugh:'Ha ha ha!'},
    es:{smile:'Mmm…',chuckle:'Ja ja!',laugh:'Ja ja ja!'},
    he:{smile:'הממ…',chuckle:'הא הא!',laugh:'הא הא הא!'},
  };
  return (table[base]??table.en)[reaction];
}
