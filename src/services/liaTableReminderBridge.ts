import {scheduleLiaAssistantAlarm} from './notifications';

export type LiaStructuredReminder={
  id:string;
  title:string;
  body:string;
  sensitivity:'ordinary'|'personal'|'sensitive';
  oneTimeAt:Date|null;
  confirmed:boolean;
};

export async function scheduleStructuredTableReminder(
  reminder:LiaStructuredReminder
):Promise<'scheduled'|'confirmation-required'|'permission-denied'|'invalid'>{
  return scheduleLiaAssistantAlarm({
    id:reminder.id,
    title:reminder.title,
    body:reminder.body,
    genericPrivateBody:"J'ai un rappel pour toi.",
    channelName:'LIA',
    sensitivity:reminder.sensitivity,
    confirmed:reminder.confirmed,
    oneTimeAt:reminder.oneTimeAt,
    weekly:null,
  });
}
