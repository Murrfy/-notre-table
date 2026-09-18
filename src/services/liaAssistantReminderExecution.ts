import {parseLiaReminderRequest,type LiaParsedReminder,type LiaReminderSeed} from '../lib/liaReminderRequest';
import {scheduleLiaAssistantAlarm} from './notifications';

export type LiaReminderExecution=
  |{status:'scheduled';spokenReply:string}
  |{status:'needs_clarification';spokenReply:string}
  |{status:'permission_denied';spokenReply:string}
  |{status:'invalid';spokenReply:string};

type PendingReminder=LiaReminderSeed&{languageTag:string};
let pendingReminder:PendingReminder|null=null;

function reminderId(target:Date,body:string):string{
  const slug=body.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,36)||'rappel';
  return`lia-reminder-${target.getTime()}-${slug}`;
}
function clarificationReply(parsed:LiaParsedReminder,languageTag:string):string{
  const fr=languageTag.toLowerCase().startsWith('fr');
  if(!parsed.body)return fr?'Qu’est-ce que tu veux que je te rappelle ?':'What do you want me to remind you about?';
  if(parsed.day)return fr?'À quelle heure je te le rappelle ?':'What time should I remind you?';
  return fr?'Quand veux-tu que je te le rappelle ?':'When should I remind you?';
}
function scheduledReply(body:string,displayWhen:string,languageTag:string):string{
  return languageTag.toLowerCase().startsWith('fr')?`C’est fait, je te le rappellerai ${displayWhen} : ${body}.`:`Done. I’ll remind you ${displayWhen}: ${body}.`;
}

async function executeParsed(parsed:LiaParsedReminder,languageTag:string,now:Date):Promise<LiaReminderExecution>{
  if(!parsed.body||!parsed.target){pendingReminder={body:parsed.body,day:parsed.day,displayDay:parsed.displayDay,languageTag};return{status:'needs_clarification',spokenReply:clarificationReply(parsed,languageTag)};}
  if(parsed.target.getTime()<=now.getTime()){pendingReminder={body:parsed.body,day:parsed.day,displayDay:parsed.displayDay,languageTag};return{status:'needs_clarification',spokenReply:languageTag.toLowerCase().startsWith('fr')?'Cette heure est déjà passée. À quelle heure je te le rappelle ?':'That time has already passed. What time should I remind you?'};}
  const result=await scheduleLiaAssistantAlarm({
    id:reminderId(parsed.target,parsed.body),title:'LIA',body:parsed.body,genericPrivateBody:"J’ai un rappel pour toi.",channelName:'LIA',sensitivity:'ordinary',confirmed:true,oneTimeAt:parsed.target,weekly:null,
  },now);
  if(result==='scheduled'){pendingReminder=null;return{status:'scheduled',spokenReply:scheduledReply(parsed.body,parsed.displayWhen??'au moment demandé',languageTag)};}
  if(result==='permission-denied'){pendingReminder=null;return{status:'permission_denied',spokenReply:languageTag.toLowerCase().startsWith('fr')?'Je n’ai pas l’autorisation d’envoyer les rappels. Active les notifications et redemande-moi.':'I don’t have permission to send reminders. Enable notifications and ask me again.'};}
  return{status:'invalid',spokenReply:languageTag.toLowerCase().startsWith('fr')?'Je n’ai pas pu programmer ce rappel. Redis-moi quand et quoi te rappeler.':'I couldn’t schedule that reminder. Tell me when and what to remind you about.'};
}

export function liaReminderClarificationPending():boolean{return pendingReminder!==null;}
export function clearLiaReminderClarification():void{pendingReminder=null;}
export async function prepareLiaReminderFromSpeech(text:string,languageTag:string,now=new Date()):Promise<LiaReminderExecution>{
  pendingReminder=null;return executeParsed(parseLiaReminderRequest(text,now),languageTag,now);
}
export async function continueLiaReminderClarification(text:string,languageTag:string,now=new Date()):Promise<LiaReminderExecution>{
  const seed=pendingReminder;if(!seed)return prepareLiaReminderFromSpeech(text,languageTag,now);
  return executeParsed(parseLiaReminderRequest(text,now,seed),languageTag||seed.languageTag,now);
}
