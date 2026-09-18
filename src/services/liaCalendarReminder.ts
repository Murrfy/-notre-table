import {cancelLiaAssistantAlarm,scheduleLiaAssistantAlarm} from './notifications';
import type {LiaCalendarEvent} from './liaCalendar';

export type LiaCalendarReminderSync='none'|'scheduled'|'permission-denied'|'invalid';
export function liaCalendarReminderAlarmId(eventId:string){return`lia-calendar-${eventId.trim()}`;}
export function liaCalendarReminderAt(event:LiaCalendarEvent):Date|null{
  if(event.reminder_minutes_before===null)return null;
  const start=new Date(event.starts_at);if(Number.isNaN(start.getTime()))return null;
  return new Date(start.getTime()-event.reminder_minutes_before*60_000);
}
export function liaCalendarReminderBody(event:LiaCalendarEvent){return`Rendez-vous : ${event.title}`;}

export async function cancelLiaCalendarEventReminder(eventId:string){await cancelLiaAssistantAlarm(liaCalendarReminderAlarmId(eventId));}

export async function syncLiaCalendarEventReminder(event:LiaCalendarEvent,now=new Date()):Promise<LiaCalendarReminderSync>{
  const id=liaCalendarReminderAlarmId(event.id);
  await cancelLiaAssistantAlarm(id);
  const when=liaCalendarReminderAt(event);if(!when)return'none';if(when.getTime()<=now.getTime())return'invalid';
  const result=await scheduleLiaAssistantAlarm({
    id,title:'LIA',body:liaCalendarReminderBody(event),genericPrivateBody:'Tu as bientôt un rendez-vous.',channelName:'LIA',sensitivity:'ordinary',confirmed:true,oneTimeAt:when,weekly:null,
  },now);
  if(result==='scheduled')return'scheduled';if(result==='permission-denied')return'permission-denied';return'invalid';
}
