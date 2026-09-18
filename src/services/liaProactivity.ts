import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';

const QUIET_KEY='@notre-table/lia-quiet-v1';
const LAST_OPEN_KEY='@notre-table/lia-last-open-v1';

type LiaQuietStored={mode:'active'|'until'|'indefinite';untilIso:string|null;startedAtIso:string|null};
export type LiaQuietState=LiaQuietStored;
export type LiaOpenResult={earlyReturn:boolean;quiet:LiaQuietState};

const activeState:LiaQuietState={mode:'active',untilIso:null,startedAtIso:null};

function validState(value:unknown):value is LiaQuietStored{
  if(!isRecord(value))return false;
  return (value.mode==='active'||value.mode==='until'||value.mode==='indefinite')&&
    (value.untilIso===null||typeof value.untilIso==='string')&&
    (value.startedAtIso===null||typeof value.startedAtIso==='string');
}

export async function getLiaQuietState(now=new Date()):Promise<LiaQuietState>{
  const stored=await readStoredJson<LiaQuietStored>(QUIET_KEY,activeState,validState);
  if(stored.mode==='until'&&stored.untilIso&&new Date(stored.untilIso).getTime()<=now.getTime()){
    await writeStoredJson(QUIET_KEY,activeState);
    return activeState;
  }
  return stored;
}

export async function setLiaQuietUntil(until:Date,now=new Date()):Promise<LiaQuietState>{
  const state:LiaQuietState={mode:'until',untilIso:until.toISOString(),startedAtIso:now.toISOString()};
  await writeStoredJson(QUIET_KEY,state);return state;
}
export async function pauseLiaToday(now=new Date()):Promise<LiaQuietState>{
  const end=new Date(now);end.setHours(23,59,59,999);return setLiaQuietUntil(end,now);
}
export async function pauseLiaForDays(days:number,now=new Date()):Promise<LiaQuietState>{
  const safe=Math.max(1,Math.min(365,Math.floor(days)));const until=new Date(now);until.setDate(until.getDate()+safe);return setLiaQuietUntil(until,now);
}
export async function pauseLiaIndefinitely(now=new Date()):Promise<LiaQuietState>{
  const state:LiaQuietState={mode:'indefinite',untilIso:null,startedAtIso:now.toISOString()};await writeStoredJson(QUIET_KEY,state);return state;
}
export async function resumeLiaProactivity():Promise<void>{await writeStoredJson(QUIET_KEY,activeState);}
export function liaQuietNow(state:LiaQuietState,now=new Date()){return state.mode==='indefinite'||(state.mode==='until'&&Boolean(state.untilIso)&&new Date(state.untilIso!).getTime()>now.getTime());}

export async function noteLiaAppOpened(now=new Date()):Promise<LiaOpenResult>{
  const quiet=await getLiaQuietState(now);
  const earlyReturn=quiet.mode==='until'&&Boolean(quiet.untilIso)&&liaQuietNow(quiet,now);
  await writeStoredJson(LAST_OPEN_KEY,{openedAtIso:now.toISOString()});
  return {earlyReturn,quiet};
}

export async function getLastLiaOpen():Promise<Date|null>{
  const stored=await readStoredJson<Record<string,unknown>>(LAST_OPEN_KEY,{},isRecord);
  if(typeof stored.openedAtIso!=='string')return null;const value=new Date(stored.openedAtIso);return Number.isNaN(value.getTime())?null:value;
}

export function chooseLiaEarlyReturnVariant(now=new Date()):'housekeeperConfidante'|'armsOrEars'|'shortPause'{
  const index=(now.getDate()+now.getMonth())%3;return index===0?'housekeeperConfidante':index===1?'armsOrEars':'shortPause';
}

export function parseLiaPauseIntent(text:string,now=new Date()):{kind:'none'|'today'|'days'|'indefinite';days?:number}{
  const normalized=text.trim().toLowerCase();
  if(!normalized)return {kind:'none'};
  if(/(jusqu.?à nouvel ordre|ne me dérange plus|ne me derange plus|stop les notifications|pause indéfinie|pause indefinie)/i.test(normalized))return {kind:'indefinite'};
  if(/(aujourd.?hui|pour la journée|pour la journee)/i.test(normalized))return {kind:'today'};
  const match=normalized.match(/(?:pendant|pour)?\s*(\d{1,3})\s*(?:jour|jours|j)/i);
  if(match){const days=Math.max(1,Math.min(365,Number(match[1])));return {kind:'days',days};}
  const tomorrow=/demain/i.test(normalized);if(tomorrow)return {kind:'days',days:1};
  void now;return {kind:'none'};
}
