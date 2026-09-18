import {liaBuildDayBrief,type LiaDayBrief,type LiaDayThread} from '../lib/liaRightHand';
import {listLiaCalendarEvents,type LiaCalendarEvent} from './liaCalendar';

function dayStart(value:Date){const d=new Date(value);d.setHours(0,0,0,0);return d;}
function dayEnd(value:Date){const d=dayStart(value);d.setDate(d.getDate()+1);return d;}
function mondayStart(value:Date){const d=dayStart(value);const weekday=d.getDay();const delta=weekday===0?-6:1-weekday;d.setDate(d.getDate()+delta);return d;}

export type LiaCalendarBriefPeriod='today'|'week'|'next';

export function calendarEventToRightHandThread(event:LiaCalendarEvent):LiaDayThread{
  return{
    id:`calendar:${event.id}`,
    eventKind:'appointment',
    label:event.title,
    timeIso:event.starts_at,
    recurring:Boolean(event.recurrence_series_id),
    sensitivity:'personal',
    completed:false,
    followUpDue:false,
    needsCurrentExternalData:false,
  };
}

export async function loadLiaCalendarBriefEvents(input:{period:LiaCalendarBriefPeriod;now?:Date;demo?:boolean}):Promise<LiaCalendarEvent[]>{
  const now=input.now??new Date();
  if(input.period==='today')return listLiaCalendarEvents({from:dayStart(now),to:dayEnd(now),limit:40,demo:input.demo});
  if(input.period==='week'){const from=mondayStart(now),to=new Date(from);to.setDate(to.getDate()+7);return listLiaCalendarEvents({from,to,limit:80,demo:input.demo});}
  return listLiaCalendarEvents({from:now,limit:1,demo:input.demo});
}

export async function buildLiaCalendarRightHandBrief(input:{now?:Date;demo?:boolean}={}):Promise<LiaDayBrief>{
  const now=input.now??new Date(),to=new Date(now);to.setDate(to.getDate()+1);
  const events=await listLiaCalendarEvents({from:now,to,limit:40,demo:input.demo});
  return liaBuildDayBrief({threads:events.map(calendarEventToRightHandThread),nowIso:now.toISOString()});
}
