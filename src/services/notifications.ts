import { isStringArray, readStoredJson, removeStoredValue, writeStoredJson } from '../lib/storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationPreferences } from './appPreferences';
import {noteLiaReengagementEvent} from './liaOpenLoops';
import {getLiaQuietState,liaQuietNow,type LiaQuietState} from './liaProactivity';
import {liaOpenLoopNeedsPrivateChannel,liaOpenLoopNotificationBody,type LiaOpenLoop,type LiaReengagementDecision} from '../lib/liaOpenLoops';

const IDS_KEY='@notre-table/local-notification-ids-v1';
const LIA_NOON_IDS_KEY='@notre-table/lia-noon-notification-ids-v1';
const REMINDER_CHANNEL_ID='notre-table-reminders-v1';
const LIA_ASSISTANT_CHANNEL_ID='notre-table-lia-assistant-v1';
const LIA_ASSISTANT_ALARMS_KEY='@notre-table/lia-assistant-alarms-v1';

export type LocalReminderCopy = {
  dinnerTitle:string;
  dinnerBody:string;
  weekendTitle:string;
  weekendBody:string;
  channelName:string;
};

export type LiaNoonReminderCopy={title:string;body:string;channelName:string};
export type LiaPrivateNotificationCopy={title:string;preview:string;channelName:string};

export type LiaOpenLoopNotificationCopy={title:string;genericPreview:string;channelName:string};

export async function scheduleLiaOpenLoopNotification(
  loop:LiaOpenLoop,
  copy:LiaOpenLoopNotificationCopy,
  now=new Date(),
):Promise<'scheduled'|'permission-denied'|'private-required'|'not-future'> {
  if(liaOpenLoopNeedsPrivateChannel(loop))return 'private-required';
  const when=new Date(loop.dueAtIso);if(Number.isNaN(when.getTime())||when.getTime()<=now.getTime())return 'not-future';
  await ensureAndroidReminderChannel(copy.channelName);
  const permission=await Notifications.getPermissionsAsync();
  // LIA never turns a follow-up into a surprise OS permission prompt.
  if(!notificationPermissionAllowsScheduling(permission))return 'permission-denied';
  const trigger:any={type:Notifications.SchedulableTriggerInputTypes.DATE,date:when};
  if(Platform.OS==='android')trigger.channelId=REMINDER_CHANNEL_ID;
  await Notifications.scheduleNotificationAsync({
    content:{title:copy.title,body:liaOpenLoopNotificationBody(loop,copy.genericPreview),data:{source:'lia-open-loop',openLoopId:loop.id}},
    trigger,
  });
  return 'scheduled';
}


export async function deliverLiaOpenLoopReengagement(input:{
  loop:LiaOpenLoop;
  decision:LiaReengagementDecision;
  body:string|null;
  title:string;
  channelName:string;
}):Promise<'scheduled'|'permission-denied'|'in-app'|'none'>{
  if(input.decision.channel==='none'||!input.body)return'none';
  if(input.decision.channel==='in_app')return'in-app';
  await ensureAndroidReminderChannel(input.channelName);
  const permission=await Notifications.getPermissionsAsync();
  // Re-engagement never opens a surprise permission dialog.
  if(!notificationPermissionAllowsScheduling(permission))return'permission-denied';
  await Notifications.scheduleNotificationAsync({
    content:{title:input.title,body:input.body,data:{source:'lia-open-loop-reengagement',openLoopId:input.loop.id}},
    trigger:null,
  });
  await noteLiaReengagementEvent('sent',new Date(),input.loop.id);
  return'scheduled';
}


export function configureNotificationHandler(){
  Notifications.setNotificationHandler({
    handleNotification: async()=>({
      shouldPlaySound:false,
      shouldSetBadge:false,
      shouldShowBanner:true,
      shouldShowList:true,
    }),
  });
}


async function ensureAndroidReminderChannel(name:string){
  if(Platform.OS!=='android')return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID,{
    name,
    importance:Notifications.AndroidImportance.DEFAULT,
    sound:null,
    enableVibrate:false,
    showBadge:false,
  });
}

async function ensureAndroidLiaAssistantChannel(name:string){
  if(Platform.OS!=='android')return;
  await Notifications.setNotificationChannelAsync(LIA_ASSISTANT_CHANNEL_ID,{
    name,
    importance:Notifications.AndroidImportance.HIGH,
    sound:'default',
    enableVibrate:true,
    showBadge:false,
  });
}

type LiaAssistantAlarmStore=Record<string,string[]>;
function validAssistantAlarmStore(value:unknown):value is LiaAssistantAlarmStore{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  return Object.values(value as Record<string,unknown>).every(ids=>Array.isArray(ids)&&ids.every(id=>typeof id==='string'));
}
async function readAssistantAlarmStore(){return readStoredJson<LiaAssistantAlarmStore>(LIA_ASSISTANT_ALARMS_KEY,{},validAssistantAlarmStore);}

export type LiaAssistantAlarmInput={
  id:string;
  title:string;
  body:string;
  genericPrivateBody:string;
  channelName:string;
  sensitivity:'ordinary'|'personal'|'sensitive';
  confirmed:boolean;
  oneTimeAt?:Date|null;
  weekly?:{weekdays:number[];hour:number;minute:number}|null;
};

async function requestLiaAssistantAlarmPermission(){
  if(Platform.OS!=='ios')return Notifications.requestPermissionsAsync();
  return Notifications.requestPermissionsAsync({ios:{allowAlert:true,allowBadge:false,allowSound:true}});
}

export async function cancelLiaAssistantAlarm(idValue:string):Promise<void>{
  const key=idValue.trim();if(!key)return;
  const stored=await readAssistantAlarmStore();
  await Promise.all((stored[key]??[]).map(id=>Notifications.cancelScheduledNotificationAsync(id).catch(()=>{})));
  delete stored[key];await writeStoredJson(LIA_ASSISTANT_ALARMS_KEY,stored);
}

export async function scheduleLiaAssistantAlarm(input:LiaAssistantAlarmInput,now=new Date()):Promise<'scheduled'|'confirmation-required'|'permission-denied'|'invalid'> {
  const key=input.id.trim();if(!key||!input.confirmed)return input.confirmed?'invalid':'confirmation-required';
  const hasOne=Boolean(input.oneTimeAt),hasWeekly=Boolean(input.weekly);
  if(hasOne===hasWeekly)return 'invalid';
  if(input.oneTimeAt&&(Number.isNaN(input.oneTimeAt.getTime())||input.oneTimeAt.getTime()<=now.getTime()))return 'invalid';
  if(input.weekly){
    const {weekdays,hour,minute}=input.weekly;
    if(!weekdays.length||weekdays.some(day=>!Number.isInteger(day)||day<1||day>7)||!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)return 'invalid';
  }
  await ensureAndroidLiaAssistantChannel(input.channelName);
  let permission=await Notifications.getPermissionsAsync();
  // This prompt is allowed only after the organizer explicitly accepted the alarm.
  if(!notificationPermissionAllowsScheduling(permission))permission=await requestLiaAssistantAlarmPermission();
  if(!notificationPermissionAllowsScheduling(permission))return 'permission-denied';
  await cancelLiaAssistantAlarm(key);
  const body=input.sensitivity==='ordinary'?input.body:input.genericPrivateBody;
  const ids:string[]=[];
  if(input.oneTimeAt){
    const trigger:any={type:Notifications.SchedulableTriggerInputTypes.DATE,date:input.oneTimeAt};
    if(Platform.OS==='android')trigger.channelId=LIA_ASSISTANT_CHANNEL_ID;
    ids.push(await Notifications.scheduleNotificationAsync({content:{title:input.title,body,data:{source:'lia-assistant-alarm',alarmId:key}},trigger}));
  }else if(input.weekly){
    for(const weekday of [...new Set(input.weekly.weekdays)].sort((a,b)=>a-b)){
      ids.push(await Notifications.scheduleNotificationAsync({
        content:{title:input.title,body,data:{source:'lia-assistant-alarm',alarmId:key}},
        trigger:{type:Notifications.SchedulableTriggerInputTypes.WEEKLY,weekday,hour:input.weekly.hour,minute:input.weekly.minute,...(Platform.OS==='android'?{channelId:LIA_ASSISTANT_CHANNEL_ID}:{})},
      }));
    }
  }
  const stored=await readAssistantAlarmStore();stored[key]=ids;await writeStoredJson(LIA_ASSISTANT_ALARMS_KEY,stored);
  return ids.length?'scheduled':'invalid';
}

function parseTime(value:string){
  const [hour,minute]=value.split(':').map(Number);
  return {hour,minute};
}

function notificationPermissionAllowsScheduling(permission:Notifications.NotificationPermissionsStatus){
  if(Platform.OS!=='ios')return permission.granted;
  const status=permission.ios?.status;
  return status===Notifications.IosAuthorizationStatus.AUTHORIZED||
    status===Notifications.IosAuthorizationStatus.PROVISIONAL||
    status===Notifications.IosAuthorizationStatus.EPHEMERAL;
}

export async function scheduleLiaPrivateNotification(
  messageId:string,
  copy:LiaPrivateNotificationCopy,
):Promise<'scheduled'|'permission-denied'> {
  const safeId=messageId.trim();
  if(!safeId)throw new Error('PRIVATE_MESSAGE_ID_REQUIRED');
  await ensureAndroidReminderChannel(copy.channelName);
  const permission=await Notifications.getPermissionsAsync();
  // A private LIA message never opens a surprise permission prompt. Existing
  // notification settings decide whether the discreet nudge can be shown.
  if(!notificationPermissionAllowsScheduling(permission))return 'permission-denied';
  await Notifications.scheduleNotificationAsync({
    content:{title:copy.title,body:copy.preview,data:{screen:'lia-private',messageId:safeId,source:'lia-private'}},
    trigger:null,
  });
  return 'scheduled';
}

async function requestReminderPermission(){
  if(Platform.OS!=='ios')return Notifications.requestPermissionsAsync();
  return Notifications.requestPermissionsAsync({
    ios:{
      allowAlert:true,
      allowBadge:false,
      allowSound:false,
    },
  });
}

async function clearOurScheduledNotifications(){
  try{
    const ids=await readStoredJson<string[]>(IDS_KEY,[],isStringArray);
    await Promise.all(ids.map(id=>Notifications.cancelScheduledNotificationAsync(id).catch(()=>{})));
  }finally{
    await removeStoredValue(IDS_KEY);
  }
}

export async function syncLocalReminderNotifications(
  prefs:NotificationPreferences,
  copy:LocalReminderCopy,
):Promise<'scheduled'|'permission-denied'|'none'> {
  await clearOurScheduledNotifications();
  if(!prefs.dinnerReminder&&!prefs.weekendReminder)return 'none';
  await ensureAndroidReminderChannel(copy.channelName);
  let permission=await Notifications.getPermissionsAsync();
  if(!notificationPermissionAllowsScheduling(permission))permission=await requestReminderPermission();
  if(!notificationPermissionAllowsScheduling(permission))return 'permission-denied';
  const ids:string[]=[];
  if(prefs.dinnerReminder){
    const {hour,minute}=parseTime(prefs.dinnerReminderTime);
    ids.push(await Notifications.scheduleNotificationAsync({
      content:{title:copy.dinnerTitle,body:copy.dinnerBody,data:{screen:'planning'}},
      trigger:{type:Notifications.SchedulableTriggerInputTypes.DAILY,hour,minute,...(Platform.OS==='android'?{channelId:REMINDER_CHANNEL_ID}:{})},
    }));
  }
  if(prefs.weekendReminder){
    const {hour,minute}=parseTime(prefs.weekendReminderTime);
    ids.push(await Notifications.scheduleNotificationAsync({
      content:{title:copy.weekendTitle,body:copy.weekendBody,data:{screen:'shopping'}},
      trigger:{type:Notifications.SchedulableTriggerInputTypes.WEEKLY,weekday:prefs.weekendReminderWeekday,hour,minute,...(Platform.OS==='android'?{channelId:REMINDER_CHANNEL_ID}:{})},
    }));
  }
  await writeStoredJson(IDS_KEY,ids);
  return ids.length?'scheduled':'none';
}


async function clearLiaNoonNotifications(){
  try{
    const ids=await readStoredJson<string[]>(LIA_NOON_IDS_KEY,[],isStringArray);
    await Promise.all(ids.map(id=>Notifications.cancelScheduledNotificationAsync(id).catch(()=>{})));
  }finally{await removeStoredValue(LIA_NOON_IDS_KEY);}
}

function noonOnDate(base:Date,daysAhead:number){
  const value=new Date(base);value.setHours(12,0,0,0);value.setDate(value.getDate()+daysAhead);return value;
}

export async function syncLiaNoonNudges(
  enabled:boolean,
  copy:LiaNoonReminderCopy,
  options:{requestPermission?:boolean;quietState?:LiaQuietState;now?:Date;daysToSchedule?:number}={},
):Promise<'scheduled'|'permission-denied'|'paused'|'none'> {
  await clearLiaNoonNotifications();
  if(!enabled)return 'none';
  const now=options.now??new Date();
  const quiet=options.quietState??await getLiaQuietState(now);
  if(quiet.mode==='indefinite')return 'paused';
  await ensureAndroidReminderChannel(copy.channelName);
  let permission=await Notifications.getPermissionsAsync();
  if(!notificationPermissionAllowsScheduling(permission)&&options.requestPermission)permission=await requestReminderPermission();
  if(!notificationPermissionAllowsScheduling(permission))return 'permission-denied';
  const horizon=Math.max(1,Math.min(30,options.daysToSchedule??14));
  const ids:string[]=[];
  // Because this function is refreshed whenever the app opens, today's noon is always skipped:
  // opening Notre Table is itself proof that LIA does not need to nudge today.
  for(let day=1;day<=horizon;day++){
    const when=noonOnDate(now,day);
    if(quiet.mode==='until'&&quiet.untilIso&&when.getTime()<=new Date(quiet.untilIso).getTime())continue;
    const trigger:any={type:Notifications.SchedulableTriggerInputTypes.DATE,date:when};
    if(Platform.OS==='android')trigger.channelId=REMINDER_CHANNEL_ID;
    ids.push(await Notifications.scheduleNotificationAsync({content:{title:copy.title,body:copy.body,data:{screen:'planning',source:'lia-noon'}},trigger}));
  }
  await writeStoredJson(LIA_NOON_IDS_KEY,ids);
  return ids.length?'scheduled':'paused';
}

export async function refreshLiaNoonNudgesAfterOpen(prefs:NotificationPreferences,copy:LiaNoonReminderCopy,now=new Date()){
  const quiet=await getLiaQuietState(now);
  return syncLiaNoonNudges(prefs.liaNoonReminder,copy,{requestPermission:false,quietState:quiet,now});
}
