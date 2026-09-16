import { isStringArray, readStoredJson, removeStoredValue, writeStoredJson } from '../lib/storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationPreferences } from './appPreferences';

const IDS_KEY='@notre-table/local-notification-ids-v1';
const REMINDER_CHANNEL_ID='notre-table-reminders-v1';

export type LocalReminderCopy = {
  dinnerTitle:string;
  dinnerBody:string;
  weekendTitle:string;
  weekendBody:string;
  channelName:string;
};

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
