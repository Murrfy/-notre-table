import {isArray,isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {formatLiaTimerRemaining,parseLiaTimerCommand} from '../lib/liaAssistantTimer';
import {cancelLiaAssistantAlarm,scheduleLiaAssistantAlarm} from './notifications';

const KEY='@notre-table/lia-assistant-timers-v1';
export type LiaAssistantTimer={id:string;label:string|null;createdAtIso:string;endsAtIso:string;durationSeconds:number};
export type LiaTimerExecution=
  |{status:'started'|'remaining'|'cancelled';spokenReply:string}
  |{status:'needs_clarification'|'none_active'|'unavailable'|'invalid';spokenReply:string};

type Pending={kind:'start'|'remaining'|'cancel';languageTag:string};
let pending:Pending|null=null;

function validTimer(value:unknown):value is LiaAssistantTimer{return isRecord(value)&&typeof value.id==='string'&&(value.label===null||typeof value.label==='string')&&typeof value.createdAtIso==='string'&&typeof value.endsAtIso==='string'&&typeof value.durationSeconds==='number';}
function validTimers(value:unknown):value is LiaAssistantTimer[]{return isArray(value)&&value.every(validTimer);}
async function readTimers(){return readStoredJson<LiaAssistantTimer[]>(KEY,[],validTimers);}
async function writeTimers(rows:LiaAssistantTimer[]){await writeStoredJson(KEY,rows);}
function fr(languageTag:string){return languageTag.toLowerCase().startsWith('fr');}
function idFor(now:Date){return`lia-timer-${now.getTime()}-${Math.random().toString(36).slice(2,8)}`;}
function timerName(timer:LiaAssistantTimer,languageTag:string){return timer.label?` « ${timer.label} »`:fr(languageTag)?'':' timer';}
function active(rows:LiaAssistantTimer[],now:Date){return rows.filter(row=>new Date(row.endsAtIso).getTime()>now.getTime());}
async function persistActive(now:Date){const rows=await readTimers();const keep=active(rows,now);if(keep.length!==rows.length)await writeTimers(keep);return keep;}
function chooseByLabel(rows:LiaAssistantTimer[],label:string|null):LiaAssistantTimer|null{
  if(!label)return rows.length===1?rows[0]:null;
  const target=label.toLowerCase();return rows.find(row=>row.label?.toLowerCase()===target)??null;
}

export function liaTimerClarificationPending(){return pending!==null;}
export function clearLiaTimerClarification(){pending=null;}
export async function listActiveLiaAssistantTimers(now=new Date()){return persistActive(now);}

export async function consumeRecentlyExpiredLiaTimers(now=new Date(),maxAgeMs=15_000):Promise<LiaAssistantTimer[]>{
  const rows=await readTimers(),cutoff=now.getTime()-maxAgeMs,expired:LiaAssistantTimer[]=[],keep:LiaAssistantTimer[]=[];
  for(const row of rows){const end=new Date(row.endsAtIso).getTime();if(end<=now.getTime()){if(end>=cutoff)expired.push(row);}else keep.push(row);}
  if(keep.length!==rows.length)await writeTimers(keep);return expired;
}

async function startTimer(durationSeconds:number,label:string|null,languageTag:string,now:Date):Promise<LiaTimerExecution>{
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0||durationSeconds>86400)return{status:'invalid',spokenReply:fr(languageTag)?'Je peux lancer un minuteur jusqu’à 24 heures.':'I can set a timer for up to 24 hours.'};
  const timer:LiaAssistantTimer={id:idFor(now),label,createdAtIso:now.toISOString(),endsAtIso:new Date(now.getTime()+durationSeconds*1000).toISOString(),durationSeconds};
  const scheduled=await scheduleLiaAssistantAlarm({id:timer.id,title:'LIA',body:label?`Minuteur ${label} terminé.`:'Minuteur terminé.',genericPrivateBody:'Un minuteur est terminé.',channelName:'LIA',sensitivity:'ordinary',confirmed:true,oneTimeAt:new Date(timer.endsAtIso),weekly:null},now);
  if(scheduled!=='scheduled')return{status:'unavailable',spokenReply:scheduled==='permission-denied'?(fr(languageTag)?'J’ai besoin des notifications pour te prévenir à la fin du minuteur.':'I need notification permission to alert you when the timer ends.'):(fr(languageTag)?'Je n’ai pas pu lancer ce minuteur.':'I could not start that timer.')};
  const rows=await persistActive(now);await writeTimers([...rows,timer]);pending=null;
  const duration=formatLiaTimerRemaining(durationSeconds,languageTag);
  return{status:'started',spokenReply:fr(languageTag)?`C’est parti${label?` pour ${label}`:''} : ${duration}.`:`Timer started${label?` for ${label}`:''}: ${duration}.`};
}

async function remainingTimer(label:string|null,languageTag:string,now:Date):Promise<LiaTimerExecution>{
  const rows=await persistActive(now);if(!rows.length)return{status:'none_active',spokenReply:fr(languageTag)?'Tu n’as aucun minuteur en cours.':'You have no active timer.'};
  const timer=chooseByLabel(rows,label);if(!timer){pending={kind:'remaining',languageTag};return{status:'needs_clarification',spokenReply:fr(languageTag)?`Tu as ${rows.length} minuteurs en cours. Lequel ?`:`You have ${rows.length} active timers. Which one?`};}
  const remaining=Math.max(0,(new Date(timer.endsAtIso).getTime()-now.getTime())/1000);
  return{status:'remaining',spokenReply:fr(languageTag)?`Il reste ${formatLiaTimerRemaining(remaining,languageTag)}${timer.label?` sur ${timer.label}`:''}.`:`${formatLiaTimerRemaining(remaining,languageTag)} remaining${timer.label?` on ${timer.label}`:''}.`};
}

async function cancelTimer(label:string|null,languageTag:string,now:Date):Promise<LiaTimerExecution>{
  const rows=await persistActive(now);if(!rows.length)return{status:'none_active',spokenReply:fr(languageTag)?'Tu n’as aucun minuteur en cours.':'You have no active timer.'};
  const timer=chooseByLabel(rows,label);if(!timer){pending={kind:'cancel',languageTag};return{status:'needs_clarification',spokenReply:fr(languageTag)?`Tu as ${rows.length} minuteurs en cours. Lequel j’arrête ?`:`You have ${rows.length} active timers. Which one should I stop?`};}
  await cancelLiaAssistantAlarm(timer.id);await writeTimers(rows.filter(row=>row.id!==timer.id));pending=null;
  return{status:'cancelled',spokenReply:fr(languageTag)?`C’est fait, j’ai arrêté le minuteur${timer.label?` ${timer.label}`:''}.`:`Done. I stopped the timer${timer.label?` ${timer.label}`:''}.`};
}

export async function executeLiaTimerFromSpeech(text:string,languageTag:string,now=new Date()):Promise<LiaTimerExecution|null>{
  const command=parseLiaTimerCommand(text);if(!command)return null;
  if(command.kind==='start'){
    if(!command.durationSeconds){pending={kind:'start',languageTag};return{status:'needs_clarification',spokenReply:fr(languageTag)?'Pour combien de temps ?':'For how long?'};}
    return startTimer(command.durationSeconds,command.label,languageTag,now);
  }
  if(command.kind==='remaining')return remainingTimer(command.label,languageTag,now);
  return cancelTimer(command.label,languageTag,now);
}

export async function continueLiaTimerClarification(text:string,languageTag:string,now=new Date()):Promise<LiaTimerExecution|null>{
  const current=pending;if(!current)return executeLiaTimerFromSpeech(text,languageTag,now);
  const parsed=parseLiaTimerCommand(current.kind==='start'?`mets un minuteur ${text}`:`${current.kind==='cancel'?'arrête':'combien reste sur'} le minuteur appelé ${text}`);
  if(current.kind==='start'){
    if(!parsed?.durationSeconds)return{status:'needs_clarification',spokenReply:fr(current.languageTag)?'Dis-moi simplement la durée du minuteur.':'Just tell me the timer duration.'};
    return startTimer(parsed.durationSeconds,parsed.label,current.languageTag,now);
  }
  const rows=await persistActive(now);const label=text.trim().replace(/[.!?]+$/,'');const timer=chooseByLabel(rows,label);
  if(!timer)return{status:'needs_clarification',spokenReply:fr(current.languageTag)?'Je n’ai pas trouvé ce minuteur. Redis-moi son nom.':'I could not find that timer. Tell me its name again.'};
  pending=null;
  return current.kind==='cancel'?cancelTimer(timer.label,current.languageTag,now):remainingTimer(timer.label,current.languageTag,now);
}
