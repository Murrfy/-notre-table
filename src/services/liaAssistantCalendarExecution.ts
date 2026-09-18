import {createLiaCalendarEvent,createLiaCalendarSeries,deleteLiaCalendarEvent,deleteLiaCalendarSeries,listLiaCalendarEvents,listLiaCalendarSeriesEvents,updateLiaCalendarEvent,type LiaCalendarEvent} from './liaCalendar';
import {cancelLiaCalendarEventReminder,syncLiaCalendarEventReminder} from './liaCalendarReminder';
import {loadLiaCalendarBriefEvents,type LiaCalendarBriefPeriod} from './liaCalendarBrief';

export type LiaCalendarExecution=
  |{status:'not_recognized';spokenReply:null}
  |{status:'needs_clarification';spokenReply:string}
  |{status:'created'|'deleted'|'updated'|'listed';spokenReply:string}
  |{status:'open_requested';spokenReply:string}
  |{status:'not_found'|'ambiguous'|'unavailable';spokenReply:string};

type ClockTime={hour:number;minute:number};
type Draft={kind:'create';title:string|null;date:Date|null;time:ClockTime|null;endTime:ClockTime|null;durationMinutes:number|null;location:string|null;reminderMinutesBefore:number|null;recurrenceMatched:boolean;recurrenceCount:number|null};
type Pending=
  |{kind:'draft';draft:Draft;languageTag:string;demo:boolean}
  |{kind:'conflict_create';draft:Draft;startsAt:Date;endsAt:Date|null;conflict:LiaCalendarEvent;languageTag:string;demo:boolean}
  |{kind:'conflict_move';event:LiaCalendarEvent;startsAt:Date;endsAt:Date|null;conflict:LiaCalendarEvent;languageTag:string;demo:boolean}
  |{kind:'conflict_series_create';draft:Draft;startsAt:Date;endsAt:Date|null;conflict:LiaCalendarEvent;languageTag:string;demo:boolean}
  |{kind:'delete_series_scope';event:LiaCalendarEvent;languageTag:string;demo:boolean};
let pending:Pending|null=null;
function fr(tag:string){return tag.toLowerCase().startsWith('fr');}
function fold(v:string){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
function clean(v:string){return v.replace(/^[\s,;:.-]+|[\s,;:.-]+$/g,'').replace(/\s+/g,' ').trim();}
function dayStart(d:Date){const x=new Date(d);x.setHours(0,0,0,0);return x;}
function nextWeekday(now:Date,weekday:number){const d=dayStart(now);let delta=(weekday-d.getDay()+7)%7;if(delta===0)delta=7;d.setDate(d.getDate()+delta);return d;}
const weekdays:Array<[RegExp,number]>=[[/\blundi\b/i,1],[/\bmardi\b/i,2],[/\bmercredi\b/i,3],[/\bjeudi\b/i,4],[/\bvendredi\b/i,5],[/\bsamedi\b/i,6],[/\bdimanche\b/i,0]];
const months:Record<string,number>={janvier:0,fevrier:1,février:1,mars:2,avril:3,mai:4,juin:5,juillet:6,aout:7,août:7,septembre:8,octobre:9,novembre:10,decembre:11,décembre:11};
function parseDate(text:string,now:Date):{date:Date|null;remainder:string;label:string|null}{
  let remainder=text;
  let m=remainder.match(/\bdemain\b/i);if(m){const d=dayStart(now);d.setDate(d.getDate()+1);return{date:d,remainder:clean(remainder.replace(m[0],' ')),label:'demain'};}
  m=remainder.match(/\baujourd(?:['’])?hui\b/i);if(m)return{date:dayStart(now),remainder:clean(remainder.replace(m[0],' ')),label:"aujourd’hui"};
  for(const [rx,w] of weekdays){m=remainder.match(rx);if(m){const d=nextWeekday(now,w);return{date:d,remainder:clean(remainder.replace(m[0],' ')),label:m[0].toLowerCase()};}}
  m=remainder.match(/\b(?:le\s+)?(\d{1,2})[\/.](\d{1,2})(?:[\/.](20\d{2}))?\b/);if(m){const y=Number(m[3]??now.getFullYear()),mo=Number(m[2])-1,da=Number(m[1]);const d=new Date(y,mo,da);if(d.getFullYear()===y&&d.getMonth()===mo&&d.getDate()===da)return{date:dayStart(d),remainder:clean(remainder.replace(m[0],' ')),label:m[0]};}
  m=remainder.match(/\b(?:le\s+)?(\d{1,2})\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)(?:\s+(20\d{2}))?\b/i);if(m){const key=m[2].toLowerCase();const mo=months[key]??months[fold(key)];const y=Number(m[3]??now.getFullYear()),da=Number(m[1]);if(mo!==undefined){let d=new Date(y,mo,da);if(!m[3]&&d.getTime()<dayStart(now).getTime())d=new Date(y+1,mo,da);return{date:dayStart(d),remainder:clean(remainder.replace(m[0],' ')),label:m[0]};}}
  return{date:null,remainder,label:null};
}
function parseTimeRange(text:string):{start:ClockTime|null;end:ClockTime|null;remainder:string}{
  const m=text.match(/\b(?:de\s+)?(\d{1,2})\s*h\s*(\d{1,2})?\s+(?:a|à)\s+(\d{1,2})\s*h\s*(\d{1,2})?\b/i);
  if(!m)return{start:null,end:null,remainder:text};
  const sh=Number(m[1]),sm=Number(m[2]??0),eh=Number(m[3]),em=Number(m[4]??0);
  if(sh>=24||eh>=24||sm>=60||em>=60)return{start:null,end:null,remainder:text};
  return{start:{hour:sh,minute:sm},end:{hour:eh,minute:em},remainder:clean(text.replace(m[0],' '))};
}
function parseDuration(text:string):{minutes:number|null;remainder:string}{
  const m=text.match(/\b(?:pendant|pour\s+une\s+duree\s+de|pour\s+une\s+durée\s+de)\s+(?:(\d{1,3})|une?|un)\s*(minutes?|mins?|min|heures?|hrs?|h)\b/i);
  if(!m)return{minutes:null,remainder:text};
  const amount=m[1]?Number(m[1]):1,unit=fold(m[2]);const minutes=(unit.startsWith('h')||unit.startsWith('heure'))?amount*60:amount;
  if(minutes<=0||minutes>24*60)return{minutes:null,remainder:text};
  return{minutes,remainder:clean(text.replace(m[0],' '))};
}
function parseTime(text:string):{time:{hour:number;minute:number}|null;remainder:string}{
  let m=text.match(/\b(?:a|à|vers)?\s*(\d{1,2})\s*h\s*(\d{1,2})?\b/i);if(m){const h=Number(m[1]),min=Number(m[2]??0);if(h<24&&min<60)return{time:{hour:h,minute:min},remainder:clean(text.replace(m[0],' '))};}
  m=text.match(/\b(?:a|à|vers)\s*(\d{1,2}):(\d{2})\b/i);if(m){const h=Number(m[1]),min=Number(m[2]);if(h<24&&min<60)return{time:{hour:h,minute:min},remainder:clean(text.replace(m[0],' '))};}
  return{time:null,remainder:text};
}
function parseReminderOffset(text:string):{minutes:number|null;remainder:string;matched:boolean}{
  let m=text.match(/\b(?:et\s+)?(?:rappelle[- ]moi|avec\s+(?:un\s+)?rappel|rappel(?:le)?[- ]?moi|mets\s+(?:un\s+)?rappel)?\s*(?:la\s+veille|un\s+jour\s+avant)\b/i);
  if(m)return{minutes:1440,remainder:clean(text.replace(m[0],' ')),matched:true};
  m=text.match(/\b(?:et\s+)?(?:rappelle[- ]moi|avec\s+(?:un\s+)?rappel|rappel(?:le)?[- ]?moi|mets\s+(?:un\s+)?rappel)?\s*(?:(\d{1,3})|une?|un)\s*(minutes?|mins?|min|heures?|hrs?|h)\s+avant\b/i);
  if(!m)return{minutes:null,remainder:text,matched:false};
  const amount=m[1]?Number(m[1]):1,unit=fold(m[2]);const minutes=(unit.startsWith('h')||unit.startsWith('heure'))?amount*60:amount;
  if(minutes<0||minutes>10080)return{minutes:null,remainder:text,matched:false};
  return{minutes,remainder:clean(text.replace(m[0],' ')),matched:true};
}
function compose(date:Date,time:ClockTime){const d=new Date(date);d.setHours(time.hour,time.minute,0,0);return d;}
function draftEnd(draft:Draft,startsAt:Date){if(draft.endTime){const end=compose(draft.date!,draft.endTime);if(end.getTime()<=startsAt.getTime())end.setDate(end.getDate()+1);return end;}if(draft.durationMinutes)return new Date(startsAt.getTime()+draft.durationMinutes*60_000);return null;}
function dateLabel(date:Date,tag:string){return date.toLocaleDateString(tag,{weekday:'long',day:'numeric',month:'long'});}
function timeLabel(date:Date,tag:string){return date.toLocaleTimeString(tag,{hour:'2-digit',minute:'2-digit'});}
function reminderLabel(minutes:number,tag:string){if(fr(tag)){if(minutes===1440)return'la veille';if(minutes%60===0){const h=minutes/60;return`${h} heure${h>1?'s':''} avant`;}return`${minutes} minute${minutes>1?'s':''} avant`;}if(minutes===1440)return'the day before';if(minutes%60===0){const h=minutes/60;return`${h} hour${h>1?'s':''} before`;}return`${minutes} minute${minutes>1?'s':''} before`;}
function parseRecurrenceCount(text:string):{count:number|null;remainder:string}{
  let m=text.match(/\b(?:pendant|pour)\s+(\d{1,2})\s+semaines?\b/i);if(m){const count=Number(m[1]);return{count:count>=1&&count<=24?count:null,remainder:clean(text.replace(m[0],' '))};}
  m=text.match(/^\s*(\d{1,2})\s+semaines?\s*$/i);if(m){const count=Number(m[1]);return{count:count>=1&&count<=24?count:null,remainder:''};}
  m=text.match(/\b(\d{1,2})\s+fois\b/i);if(m){const count=Number(m[1]);return{count:count>=1&&count<=24?count:null,remainder:clean(text.replace(m[0],' '))};}
  m=text.match(/\b(?:for)\s+(\d{1,2})\s+weeks?\b/i);if(m){const count=Number(m[1]);return{count:count>=1&&count<=24?count:null,remainder:clean(text.replace(m[0],' '))};}
  m=text.match(/\b(\d{1,2})\s+times?\b/i);if(m){const count=Number(m[1]);return{count:count>=1&&count<=24?count:null,remainder:clean(text.replace(m[0],' '))};}
  return{count:null,remainder:text};
}
function parseRecurrence(text:string,now:Date):{matched:boolean;date:Date|null;count:number|null;remainder:string}{
  const patterns:Array<[RegExp,number]>=[[/\b(?:tous?\s+les?|chaque)\s+lundi(?:s)?\b/i,1],[/\b(?:tous?\s+les?|chaque)\s+mardi(?:s)?\b/i,2],[/\b(?:tous?\s+les?|chaque)\s+mercredi(?:s)?\b/i,3],[/\b(?:tous?\s+les?|chaque)\s+jeudi(?:s)?\b/i,4],[/\b(?:tous?\s+les?|chaque)\s+vendredi(?:s)?\b/i,5],[/\b(?:tous?\s+les?|chaque)\s+samedi(?:s)?\b/i,6],[/\b(?:tous?\s+les?|chaque)\s+dimanche(?:s)?\b/i,0],[/\bevery\s+monday\b/i,1],[/\bevery\s+tuesday\b/i,2],[/\bevery\s+wednesday\b/i,3],[/\bevery\s+thursday\b/i,4],[/\bevery\s+friday\b/i,5],[/\bevery\s+saturday\b/i,6],[/\bevery\s+sunday\b/i,0]];
  for(const [rx,w] of patterns){const m=text.match(rx);if(m){const counted=parseRecurrenceCount(clean(text.replace(m[0],' ')));return{matched:true,date:nextWeekday(now,w),count:counted.count,remainder:counted.remainder};}}
  return{matched:false,date:null,count:null,remainder:text};
}
function parseCreate(text:string,now:Date):Draft|null{
  const s=fold(text);if(!/\b(calendrier|agenda|rendez vous|rdv|calendar|appointment)\b/.test(s))return null;
  if(!/\b(ajoute|mets|programme|planifie|prevois|note|add|schedule|put)\b/.test(s))return null;
  const reminder=parseReminderOffset(text);const recurrence=parseRecurrence(reminder.remainder,now);let work=clean(recurrence.remainder.replace(/\b(?:dans|sur|à|a)\s+(?:mon|le|l['’])?\s*(?:calendrier|agenda)\b/ig,' '));
  work=clean(work.replace(/^(?:ajoute|mets|programme|planifie|planifies|prévois|prevois|note|add|schedule|put)\s+/i,''));
  work=clean(work.replace(/\b(?:un\s+)?(?:rendez[- ]?vous|rdv|appointment)\b/ig,' '));
  const pd=recurrence.matched?{date:recurrence.date,remainder:work,label:null}:parseDate(work,now);const range=parseTimeRange(pd.remainder);const duration=parseDuration(range.remainder);const pt=range.start?{time:range.start,remainder:duration.remainder}:parseTime(duration.remainder);work=pt.remainder;
  let location:string|null=null;const lm=work.match(/\b(?:chez|au|à|a)\s+([^,]+)$/i);if(lm&&lm.index!==undefined&&lm.index>0){location=clean(lm[1]);work=clean(work.slice(0,lm.index));}
  work=clean(work.replace(/\b(?:pour|le)\b\s*$/i,''));
  return{kind:'create',title:work||null,date:pd.date,time:pt.time,endTime:range.end,durationMinutes:duration.minutes,location,reminderMinutesBefore:reminder.minutes,recurrenceMatched:recurrence.matched,recurrenceCount:recurrence.count};
}
function missing(d:Draft){if(!d.title)return'title';if(!d.date)return'date';if(!d.time)return'time';if(d.recurrenceMatched&&!d.recurrenceCount)return'recurrence';return null;}
function clarification(d:Draft,tag:string){const f=fr(tag),m=missing(d);if(m==='title')return f?'Qu’est-ce que je mets dans ton calendrier ?':'What should I put in your calendar?';if(m==='date')return f?'Quel jour ?':'Which day?';if(m==='time')return f?'À quelle heure ?':'What time?';return f?'Pendant combien de semaines, ou combien de fois ?':'For how many weeks, or how many times?';}
function parseBriefPeriod(text:string):LiaCalendarBriefPeriod|null{const s=fold(text);if(/(?:prochain rendez vous|next appointment)/.test(s))return'next';if(/(?:cette semaine|ma semaine|point sur (?:ma )?semaine|this week)/.test(s))return'week';if(/(?:ma journee|ma journée|point sur (?:ma )?(?:journee|journée)|aujourd hui|today)/.test(s)&&/(point|prevu|programme|calendrier|agenda|qu est ce que|j ai quoi)/.test(s))return'today';return null;}
function periodBriefReply(rows:LiaCalendarEvent[],period:LiaCalendarBriefPeriod,tag:string,now:Date){const f=fr(tag);if(rows.length===0){if(period==='next')return f?'Tu n’as aucun rendez-vous à venir.':'You have no upcoming appointment.';if(period==='week')return f?'Ta semaine est libre pour le moment.':'Your week is clear for now.';return f?'Tu n’as rien de prévu aujourd’hui.':'You have nothing scheduled today.';}if(period==='next'){const row=rows[0],at=new Date(row.starts_at);return f?`Ton prochain rendez-vous est ${row.title}, ${dateLabel(at,tag)} à ${timeLabel(at,tag)}.`:`Your next appointment is ${row.title}, ${dateLabel(at,tag)} at ${timeLabel(at,tag)}.`;}const visible=period==='week'?rows.filter(row=>new Date(row.starts_at).getTime()>=now.getTime()):rows;const shown=visible.slice(0,6).map(row=>{const at=new Date(row.starts_at);return period==='week'?`${dateLabel(at,tag)} ${timeLabel(at,tag)} — ${row.title}`:`${timeLabel(at,tag)} — ${row.title}`;});const more=visible.length>6?(f?` et ${visible.length-6} autre${visible.length-6>1?'s':''}`:` and ${visible.length-6} more`):'';if(shown.length===0)return period==='week'?(f?'Tu n’as plus rien de prévu cette semaine.':'You have nothing else scheduled this week.'):(f?'Tu n’as plus rien de prévu aujourd’hui.':'You have nothing else scheduled today.');return period==='week'?(f?`Cette semaine : ${shown.join(', ')}${more}.`:`This week: ${shown.join(', ')}${more}.`):(f?`Aujourd’hui : ${shown.join(', ')}${more}.`:`Today: ${shown.join(', ')}${more}.`);}
function parseListDay(text:string,now:Date):Date|null{const s=fold(text);if(!/(qu est ce que j ai|j ai quoi|qu est ce qui est prevu|agenda|calendrier|programme).*(aujourd|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)|^(?:mon\s+)?(?:agenda|calendrier)\s+(?:aujourd|demain)/.test(s))return null;return parseDate(text,now).date;}
function openRequest(text:string){return /^(?:ouvre|montre|affiche)\s+(?:moi\s+)?(?:mon|le)?\s*(?:calendrier|agenda)\b/i.test(text.trim());}
function deletion(text:string,now:Date){const m=text.match(/^(?:supprime|efface|annule)\s+(?:mon\s+)?(?:rendez[- ]?vous|rdv|événement|evenement)?\s*(.+)$/i);if(!m)return null;let rest=clean(m[1]);const explicitSeries=/\b(?:toute\s+la\s+serie|toute\s+la\s+série|la\s+serie|la\s+série|tous\s+les\s+rendez[- ]?vous)\b/i.test(rest);rest=clean(rest.replace(/\b(?:toute\s+la\s+serie|toute\s+la\s+série|la\s+serie|la\s+série|tous\s+les\s+rendez[- ]?vous)\b/ig,' '));const pd=parseDate(rest,now);rest=pd.remainder;rest=clean(rest.replace(/\b(?:dans|de)\s+(?:mon\s+)?(?:calendrier|agenda)\b/ig,' '));return{fragment:rest||null,date:pd.date,scope:explicitSeries?'series' as const:'unspecified' as const};}
function move(text:string,now:Date){const m=text.match(/^(?:deplace|déplace|repousse|avance)\s+(?:mon\s+)?(?:rendez[- ]?vous|rdv|événement|evenement)?\s*(.+?)\s+(?:a|à|pour)\s+(.+)$/i);if(!m)return null;const target=parseDate(m[2],now);const pt=parseTime(target.remainder);return{fragment:clean(m[1]),date:target.date,time:pt.time};}
function reminderMutation(text:string):{fragment:string|null;minutes:number|null;remove:boolean}|null{
  let m=text.match(/^(?:enleve|enlève|retire|supprime|annule)\s+(?:le\s+)?rappel\s+(?:de|du|pour)\s+(?:mon\s+)?(?:rendez[- ]?vous|rdv|événement|evenement)?\s*(.+)$/i);
  if(m)return{fragment:clean(m[1])||null,minutes:null,remove:true};
  const offset=parseReminderOffset(text);if(!offset.matched||offset.minutes===null)return null;
  let rest=clean(offset.remainder.replace(/^(?:change|modifie|mets|ajoute|programme)\s+(?:le|un)?\s*rappel\s*/i,'').replace(/^(?:pour|de|du)\s+/i,'').replace(/^(?:mon\s+)?(?:rendez[- ]?vous|rdv|événement|evenement)\s*/i,''));
  // "rappelle-moi 30 minutes avant mon rendez-vous dentiste" leaves the event after the offset.
  if(!rest){const after=text.match(/\bavant\s+(?:mon\s+)?(?:rendez[- ]?vous|rdv|événement|evenement)?\s*(.+)$/i);rest=clean(after?.[1]??'');}
  rest=clean(rest.replace(/^(?:mon\s+)?(?:rendez[- ]?vous|rdv|événement|evenement)\s*/i,''));
  return{fragment:rest||null,minutes:offset.minutes,remove:false};
}
function sameDayRange(d:Date){const from=dayStart(d),to=new Date(from);to.setDate(to.getDate()+1);return{from,to};}
function matchEvent(rows:LiaCalendarEvent[],fragment:string|null){if(!fragment)return rows;const f=fold(fragment);return rows.filter(r=>fold(r.title).includes(f)||f.includes(fold(r.title)));}
function listReply(rows:LiaCalendarEvent[],date:Date,tag:string){const f=fr(tag),day=dateLabel(date,tag);if(rows.length===0)return f?`Tu n’as rien de prévu ${day}.`:`You have nothing scheduled ${day}.`;const shown=rows.slice(0,4).map(r=>`${timeLabel(new Date(r.starts_at),tag)} — ${r.title}`);const more=rows.length>4?(f?` et ${rows.length-4} autre${rows.length-4>1?'s':''}`:` and ${rows.length-4} more`):'';return f?`${day}, tu as ${shown.join(', ')}${more}.`:`${day}, you have ${shown.join(', ')}${more}.`;}
function yes(text:string){return /^(?:oui|ouais|ok|d'accord|d accord|vas[- ]?y|fais[- ]?le|confirme|yes|yeah|okay|go ahead)\b/i.test(text.trim());}
function no(text:string){return /^(?:non|non merci|annule|laisse|pas maintenant|no|cancel|never mind)\b/i.test(text.trim());}
function eventConflictsAt(row:LiaCalendarEvent,startsAt:Date,endsAt:Date|null){
  const rowStart=new Date(row.starts_at).getTime(),candidateStart=startsAt.getTime();if(Number.isNaN(rowStart))return false;
  const rowEnd=row.ends_at?new Date(row.ends_at).getTime():null,candidateEnd=endsAt?.getTime()??null;
  if(rowEnd!==null&&!Number.isNaN(rowEnd)&&candidateEnd!==null)return candidateStart<rowEnd&&candidateEnd>rowStart;
  if(rowEnd!==null&&!Number.isNaN(rowEnd))return candidateStart>=rowStart&&candidateStart<rowEnd;
  if(candidateEnd!==null)return rowStart>=candidateStart&&rowStart<candidateEnd;
  return Math.abs(candidateStart-rowStart)<60_000;
}
async function findConflict(startsAt:Date,endsAt:Date|null,demo:boolean,ignoreId?:string){
  const {from,to}=sameDayRange(startsAt);const rows=await listLiaCalendarEvents({from,to,limit:100,demo});
  return rows.find(row=>row.id!==ignoreId&&eventConflictsAt(row,startsAt,endsAt))??null;
}
function conflictReply(conflict:LiaCalendarEvent,startsAt:Date,tag:string){return fr(tag)?`Tu as déjà ${conflict.title} à ${timeLabel(new Date(conflict.starts_at),tag)}. Je mets quand même ce rendez-vous à ${timeLabel(startsAt,tag)} ?`:`You already have ${conflict.title} at ${timeLabel(new Date(conflict.starts_at),tag)}. Should I add this appointment at ${timeLabel(startsAt,tag)} anyway?`;}

export function liaCalendarClarificationPending(){return pending!==null;}
export function clearLiaCalendarClarification(){pending=null;}

async function createSeriesFromDraft(draft:Draft,startsAt:Date,endsAt:Date|null,tag:string,demo:boolean,now=new Date()):Promise<LiaCalendarExecution>{
  const count=draft.recurrenceCount!;const created=await createLiaCalendarSeries({title:draft.title!,startsAt,endsAt,count,stepDays:7,location:draft.location,reminderMinutesBefore:draft.reminderMinutesBefore,demo});pending=null;
  let reminderNote='';if(draft.reminderMinutesBefore!==null){let denied=false,scheduled=0;for(const event of created){const sync=await syncLiaCalendarEventReminder(event,now);if(sync==='permission-denied')denied=true;else if(sync==='scheduled')scheduled++;}if(denied)reminderNote=fr(tag)?' Les rendez-vous sont enregistrés, mais les notifications sont désactivées.':' The appointments are saved, but notifications are disabled.';else if(scheduled>0)reminderNote=fr(tag)?` Les rappels sont programmés ${reminderLabel(draft.reminderMinutesBefore,tag)}.`:` The reminders are scheduled ${reminderLabel(draft.reminderMinutesBefore,tag)}.`;}
  return{status:'created',spokenReply:(fr(tag)?`C’est fait, j’ai ajouté ${draft.title} chaque semaine à ${timeLabel(startsAt,tag)} pour ${count} fois.`:`Done. I added ${draft.title} every week at ${timeLabel(startsAt,tag)} for ${count} occurrences.`)+reminderNote};
}
async function findSeriesConflict(startsAt:Date,endsAt:Date|null,count:number,demo:boolean){const last=new Date(startsAt);last.setDate(last.getDate()+(count-1)*7);const from=dayStart(startsAt),to=new Date(dayStart(last));to.setDate(to.getDate()+1);const rows=await listLiaCalendarEvents({from,to,limit:200,demo});for(let index=0;index<count;index++){const start=new Date(startsAt);start.setDate(start.getDate()+index*7);const end=endsAt?new Date(endsAt):null;if(end)end.setDate(end.getDate()+index*7);const conflict=rows.find(row=>eventConflictsAt(row,start,end));if(conflict)return{conflict,start};}return null;}
async function createFromDraft(draft:Draft,tag:string,demo:boolean):Promise<LiaCalendarExecution>{
  if(missing(draft)){pending={kind:'draft',draft,languageTag:tag,demo};return{status:'needs_clarification',spokenReply:clarification(draft,tag)};}
  const startsAt=compose(draft.date!,draft.time!);if(startsAt.getTime()<Date.now()-60_000)return{status:'unavailable',spokenReply:fr(tag)?'Cette heure est déjà passée. Donne-moi une heure à venir.':'That time has already passed. Give me a future time.'};
  const endsAt=draftEnd(draft,startsAt);if(draft.recurrenceMatched&&draft.recurrenceCount&&draft.recurrenceCount>1){const seriesConflict=await findSeriesConflict(startsAt,endsAt,draft.recurrenceCount,demo);if(seriesConflict){pending={kind:'conflict_series_create',draft,startsAt,endsAt,conflict:seriesConflict.conflict,languageTag:tag,demo};return{status:'needs_clarification',spokenReply:fr(tag)?`Il y a déjà ${seriesConflict.conflict.title} ${dateLabel(seriesConflict.start,tag)} à ${timeLabel(new Date(seriesConflict.conflict.starts_at),tag)}. Je crée quand même toute la série ?`:`You already have ${seriesConflict.conflict.title} on ${dateLabel(seriesConflict.start,tag)} at ${timeLabel(new Date(seriesConflict.conflict.starts_at),tag)}. Should I create the whole series anyway?`};}return createSeriesFromDraft(draft,startsAt,endsAt,tag,demo);}const conflict=await findConflict(startsAt,endsAt,demo);if(conflict){pending={kind:'conflict_create',draft,startsAt,endsAt,conflict,languageTag:tag,demo};return{status:'needs_clarification',spokenReply:conflictReply(conflict,startsAt,tag)};}
  const event=await createLiaCalendarEvent({title:draft.title!,startsAt,endsAt,location:draft.location,reminderMinutesBefore:draft.reminderMinutesBefore,demo});pending=null;
  let reminderNote='';
  if(event.reminder_minutes_before!==null){const synced=await syncLiaCalendarEventReminder(event);if(synced==='scheduled')reminderNote=fr(tag)?` Je te le rappellerai ${reminderLabel(event.reminder_minutes_before,tag)}.`:` I’ll remind you ${reminderLabel(event.reminder_minutes_before,tag)}.`;else if(synced==='permission-denied')reminderNote=fr(tag)?' Le rendez-vous est enregistré, mais les notifications sont désactivées, donc je ne peux pas te prévenir.':' The appointment is saved, but notifications are disabled, so I cannot alert you.';else reminderNote=fr(tag)?' Le rendez-vous est enregistré, mais ce rappel est trop tard pour être programmé.':' The appointment is saved, but that reminder is too late to schedule.';}
  const endNote=endsAt?(fr(tag)?` jusqu’à ${timeLabel(endsAt,tag)}`:` until ${timeLabel(endsAt,tag)}`):'';return{status:'created',spokenReply:(fr(tag)?`C’est fait, j’ai mis ${draft.title} ${dateLabel(startsAt,tag)} à ${timeLabel(startsAt,tag)}${endNote} dans ton calendrier.`:`Done. I added ${draft.title} on ${dateLabel(startsAt,tag)} at ${timeLabel(startsAt,tag)}${endNote}.`)+reminderNote};
}

async function deleteFutureSeries(event:LiaCalendarEvent,tag:string,demo:boolean,now:Date):Promise<LiaCalendarExecution>{
  if(!event.recurrence_series_id)return{status:'not_found',spokenReply:fr(tag)?'Ce rendez-vous ne fait pas partie d’une série.':'This appointment is not part of a series.'};
  const rows=await listLiaCalendarSeriesEvents(event.recurrence_series_id,{from:now,demo});for(const row of rows)await cancelLiaCalendarEventReminder(row.id);const removed=await deleteLiaCalendarSeries(event.recurrence_series_id,demo,now);pending=null;return{status:'deleted',spokenReply:fr(tag)?`C’est fait, j’ai supprimé ${removed} rendez-vous à venir de la série ${event.title}.`:`Done. I deleted ${removed} upcoming appointments from the ${event.title} series.`};
}
function sameSeries(rows:LiaCalendarEvent[]){const ids=[...new Set(rows.map(row=>row.recurrence_series_id).filter((id):id is string=>Boolean(id)))];return ids.length===1&&rows.every(row=>row.recurrence_series_id===ids[0])?ids[0]:null;}
export async function prepareLiaCalendarFromSpeech(text:string,tag:string,demo=false,now=new Date()):Promise<LiaCalendarExecution>{
  if(openRequest(text))return{status:'open_requested',spokenReply:fr(tag)?'Je t’ouvre ton calendrier.':'I’m opening your calendar.'};
  const briefPeriod=parseBriefPeriod(text);if(briefPeriod){try{return{status:'listed',spokenReply:periodBriefReply(await loadLiaCalendarBriefEvents({period:briefPeriod,now,demo}),briefPeriod,tag,now)};}catch{return{status:'unavailable',spokenReply:fr(tag)?'Je n’arrive pas à lire ton calendrier pour le moment.':'I cannot read your calendar right now.'};}}
  const listDay=parseListDay(text,now);if(listDay){const {from,to}=sameDayRange(listDay);try{return{status:'listed',spokenReply:listReply(await listLiaCalendarEvents({from,to,limit:20,demo}),listDay,tag)};}catch{return{status:'unavailable',spokenReply:fr(tag)?'Je n’arrive pas à lire ton calendrier pour le moment.':'I cannot read your calendar right now.'};}}
  const rm=reminderMutation(text);if(rm&&/\b(rappel|rappelle|rendez|rdv|evenement|événement)\b/i.test(text)){try{const rows=matchEvent(await listLiaCalendarEvents({from:new Date(now.getTime()-60_000),to:new Date(now.getTime()+180*86_400_000),limit:100,demo}),rm.fragment);if(rows.length===0)return{status:'not_found',spokenReply:fr(tag)?'Je ne trouve pas ce rendez-vous.':'I cannot find that event.'};if(rows.length>1)return{status:'ambiguous',spokenReply:fr(tag)?`J’en trouve ${rows.length}. Dis-moi lequel.`:`I found ${rows.length}. Tell me which one.`};const updated=await updateLiaCalendarEvent(rows[0].id,{reminderMinutesBefore:rm.remove?null:rm.minutes},demo);const sync=await syncLiaCalendarEventReminder(updated,now);if(rm.remove)return{status:'updated',spokenReply:fr(tag)?`C’est fait, j’ai retiré le rappel de ${updated.title}.`:`Done. I removed the reminder for ${updated.title}.`};if(sync==='scheduled')return{status:'updated',spokenReply:fr(tag)?`C’est fait, je te rappellerai ${updated.title} ${reminderLabel(updated.reminder_minutes_before!,tag)}.`:`Done. I’ll remind you about ${updated.title} ${reminderLabel(updated.reminder_minutes_before!,tag)}.`};if(sync==='permission-denied')return{status:'updated',spokenReply:fr(tag)?`J’ai enregistré le rappel de ${updated.title}, mais les notifications sont désactivées.`:`I saved the reminder for ${updated.title}, but notifications are disabled.`};return{status:'updated',spokenReply:fr(tag)?`J’ai enregistré le rappel, mais il est trop tard pour le programmer avant ${updated.title}.`:`I saved the reminder, but it is too late to schedule before ${updated.title}.`};}catch{return{status:'unavailable',spokenReply:fr(tag)?'Je n’arrive pas à modifier ce rappel pour le moment.':'I cannot change that reminder right now.'};}}
  const del=deletion(text,now);if(del&&/\b(calendrier|agenda|rendez|rdv|evenement|événement|serie|série)\b/i.test(text)){try{const from=del.date?dayStart(del.date):new Date(),to=del.date?new Date(dayStart(del.date).getTime()+86_400_000):new Date(Date.now()+180*86_400_000);const rows=matchEvent(await listLiaCalendarEvents({from,to,limit:100,demo}),del.fragment);if(rows.length===0)return{status:'not_found',spokenReply:fr(tag)?'Je ne trouve pas ce rendez-vous dans ton calendrier.':'I cannot find that event in your calendar.'};if(del.scope==='series'){const seriesId=sameSeries(rows);if(!seriesId)return{status:'ambiguous',spokenReply:fr(tag)?'Je trouve plusieurs séries possibles. Dis-moi laquelle.':'I found several possible series. Tell me which one.'};return await deleteFutureSeries(rows[0],tag,demo,now);}if(rows.length>1){const seriesId=sameSeries(rows);if(seriesId){pending={kind:'delete_series_scope',event:rows[0],languageTag:tag,demo};return{status:'needs_clarification',spokenReply:fr(tag)?`Je vois que ${rows[0].title} est une série. Tu veux supprimer seulement le prochain rendez-vous ou toute la série ?`:`I can see ${rows[0].title} is a series. Do you want to delete only the next appointment or the whole series?`};}return{status:'ambiguous',spokenReply:fr(tag)?`J’en trouve ${rows.length}. Dis-moi lequel tu veux supprimer.`:`I found ${rows.length}. Tell me which one to delete.`};}await cancelLiaCalendarEventReminder(rows[0].id);await deleteLiaCalendarEvent(rows[0].id,demo);return{status:'deleted',spokenReply:fr(tag)?`C’est fait, j’ai supprimé ${rows[0].title}.`:`Done. I deleted ${rows[0].title}.`};}catch{return{status:'unavailable',spokenReply:fr(tag)?'Je n’arrive pas à modifier ton calendrier pour le moment.':'I cannot change your calendar right now.'};}}
  const mv=move(text,now);if(mv&&/\b(calendrier|agenda|rendez|rdv|evenement|événement)\b/i.test(text)){if(!mv.date||!mv.time)return{status:'needs_clarification',spokenReply:fr(tag)?'Tu veux le déplacer à quel jour et quelle heure ?':'Which day and time should I move it to?'};try{const rows=matchEvent(await listLiaCalendarEvents({from:new Date(),to:new Date(Date.now()+180*86_400_000),limit:100,demo}),mv.fragment);if(rows.length===0)return{status:'not_found',spokenReply:fr(tag)?'Je ne trouve pas ce rendez-vous.':'I cannot find that event.'};if(rows.length>1)return{status:'ambiguous',spokenReply:fr(tag)?`J’en trouve ${rows.length}. Dis-moi lequel tu veux déplacer.`:`I found ${rows.length}. Tell me which one to move.`};const startsAt=compose(mv.date,mv.time);const previousStart=new Date(rows[0].starts_at),previousEnd=rows[0].ends_at?new Date(rows[0].ends_at):null;const endsAt=previousEnd&&!Number.isNaN(previousEnd.getTime())?new Date(startsAt.getTime()+(previousEnd.getTime()-previousStart.getTime())):null;const conflict=await findConflict(startsAt,endsAt,demo,rows[0].id);if(conflict){pending={kind:'conflict_move',event:rows[0],startsAt,endsAt,conflict,languageTag:tag,demo};return{status:'needs_clarification',spokenReply:conflictReply(conflict,startsAt,tag)};}const updated=await updateLiaCalendarEvent(rows[0].id,{startsAt,endsAt},demo);const reminderSync=await syncLiaCalendarEventReminder(updated,now);const note=updated.reminder_minutes_before!==null&&reminderSync==='permission-denied'?(fr(tag)?' Le rendez-vous est déplacé, mais les notifications sont désactivées.':' The appointment moved, but notifications are disabled.') :'';return{status:'updated',spokenReply:(fr(tag)?`C’est fait, ${rows[0].title} est déplacé ${dateLabel(startsAt,tag)} à ${timeLabel(startsAt,tag)}.`:`Done. ${rows[0].title} is moved to ${dateLabel(startsAt,tag)} at ${timeLabel(startsAt,tag)}.`)+note};}catch{return{status:'unavailable',spokenReply:fr(tag)?'Je n’arrive pas à modifier ton calendrier pour le moment.':'I cannot change your calendar right now.'};}}
  const draft=parseCreate(text,now);if(draft){try{return await createFromDraft(draft,tag,demo);}catch{return{status:'unavailable',spokenReply:fr(tag)?'Je n’arrive pas à mettre ce rendez-vous dans ton calendrier pour le moment.':'I cannot add that event to your calendar right now.'};}}
  return{status:'not_recognized',spokenReply:null};
}

export async function continueLiaCalendarClarification(text:string,now=new Date()):Promise<LiaCalendarExecution>{
  if(!pending)return{status:'not_recognized',spokenReply:null};const current=pending;
  if(current.kind==='delete_series_scope'){
    const value=fold(text);if(/\b(?:toute|serie|série|tous)\b/.test(value)){try{return await deleteFutureSeries(current.event,current.languageTag,current.demo,now);}catch{pending=null;return{status:'unavailable',spokenReply:fr(current.languageTag)?'Je n’arrive pas à supprimer cette série pour le moment.':'I cannot delete that series right now.'};}}
    if(/\b(?:prochain|celui ci|celui-ci|seulement|un seul|juste)\b/.test(value)){try{await cancelLiaCalendarEventReminder(current.event.id);await deleteLiaCalendarEvent(current.event.id,current.demo);pending=null;return{status:'deleted',spokenReply:fr(current.languageTag)?`C’est fait, j’ai supprimé seulement le prochain ${current.event.title}.`:`Done. I deleted only the next ${current.event.title}.`};}catch{pending=null;return{status:'unavailable',spokenReply:fr(current.languageTag)?'Je n’arrive pas à supprimer ce rendez-vous pour le moment.':'I cannot delete that appointment right now.'};}}
    return{status:'needs_clarification',spokenReply:fr(current.languageTag)?'Le prochain rendez-vous ou toute la série ?':'The next appointment or the whole series?'};
  }
  if(current.kind==='conflict_series_create'){
    if(no(text)){pending=null;return{status:'updated',spokenReply:fr(current.languageTag)?'D’accord, je ne crée pas la série.':'Okay, I will not create the series.'};}
    if(!yes(text))return{status:'needs_clarification',spokenReply:fr(current.languageTag)?'Tu veux que je crée quand même toute la série ?':'Should I create the whole series anyway?'};
    try{return await createSeriesFromDraft(current.draft,current.startsAt,current.endsAt,current.languageTag,current.demo,now);}catch{pending=null;return{status:'unavailable',spokenReply:fr(current.languageTag)?'Je n’arrive pas à créer cette série pour le moment.':'I cannot create that series right now.'};}
  }
  if(current.kind==='conflict_create'){
    if(no(text)){pending=null;return{status:'updated',spokenReply:fr(current.languageTag)?'D’accord, je ne l’ajoute pas.':'Okay, I will not add it.'};}
    if(!yes(text))return{status:'needs_clarification',spokenReply:fr(current.languageTag)?'Tu veux que je le mette quand même ?':'Should I add it anyway?'};
    try{const event=await createLiaCalendarEvent({title:current.draft.title!,startsAt:current.startsAt,endsAt:current.endsAt,location:current.draft.location,reminderMinutesBefore:current.draft.reminderMinutesBefore,demo:current.demo});pending=null;let reminderNote='';if(event.reminder_minutes_before!==null){const synced=await syncLiaCalendarEventReminder(event,now);if(synced==='scheduled')reminderNote=fr(current.languageTag)?` Je te le rappellerai ${reminderLabel(event.reminder_minutes_before,current.languageTag)}.`:` I’ll remind you ${reminderLabel(event.reminder_minutes_before,current.languageTag)}.`;}return{status:'created',spokenReply:(fr(current.languageTag)?`D’accord, je l’ai mis quand même à ${timeLabel(current.startsAt,current.languageTag)}.`:`Okay, I added it anyway at ${timeLabel(current.startsAt,current.languageTag)}.`)+reminderNote};}catch{pending=null;return{status:'unavailable',spokenReply:fr(current.languageTag)?'Je n’arrive pas à ajouter ce rendez-vous pour le moment.':'I cannot add that appointment right now.'};}
  }
  if(current.kind==='conflict_move'){
    if(no(text)){pending=null;return{status:'updated',spokenReply:fr(current.languageTag)?'D’accord, je ne le déplace pas.':'Okay, I will not move it.'};}
    if(!yes(text))return{status:'needs_clarification',spokenReply:fr(current.languageTag)?'Tu veux que je le déplace quand même ?':'Should I move it anyway?'};
    try{const updated=await updateLiaCalendarEvent(current.event.id,{startsAt:current.startsAt,endsAt:current.endsAt},current.demo);const reminderSync=await syncLiaCalendarEventReminder(updated,now);pending=null;const note=updated.reminder_minutes_before!==null&&reminderSync==='permission-denied'?(fr(current.languageTag)?' Le rendez-vous est déplacé, mais les notifications sont désactivées.':' The appointment moved, but notifications are disabled.') :'';return{status:'updated',spokenReply:(fr(current.languageTag)?`D’accord, ${updated.title} est déplacé à ${timeLabel(current.startsAt,current.languageTag)} malgré le conflit.`:`Okay, ${updated.title} is moved to ${timeLabel(current.startsAt,current.languageTag)} despite the conflict.`)+note};}catch{pending=null;return{status:'unavailable',spokenReply:fr(current.languageTag)?'Je n’arrive pas à déplacer ce rendez-vous pour le moment.':'I cannot move that appointment right now.'};}
  }
  const d={...current.draft};let rest=text;
  if(d.recurrenceMatched&&!d.recurrenceCount){const rc=parseRecurrenceCount(rest);if(rc.count){d.recurrenceCount=rc.count;rest=rc.remainder;}}
  const reminder=parseReminderOffset(rest);if(reminder.matched){d.reminderMinutesBefore=reminder.minutes;rest=reminder.remainder;}
  if(!d.date){const pd=parseDate(rest,now);if(pd.date){d.date=pd.date;rest=pd.remainder;}}
  const range=parseTimeRange(rest);if(range.start){if(!d.time)d.time=range.start;d.endTime=range.end;rest=range.remainder;}
  const duration=parseDuration(rest);if(duration.minutes!==null){d.durationMinutes=duration.minutes;rest=duration.remainder;}
  if(!d.time){const pt=parseTime(rest);if(pt.time){d.time=pt.time;rest=pt.remainder;}}
  if(!d.title&&clean(rest))d.title=clean(rest);
  pending={...current,draft:d};try{return await createFromDraft(d,current.languageTag,current.demo);}catch{return{status:'unavailable',spokenReply:fr(current.languageTag)?'Je n’arrive pas à mettre ce rendez-vous dans ton calendrier pour le moment.':'I cannot add that event to your calendar right now.'};}
}
