import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { defaultNotificationPreferences, getNotificationPreferences, NotificationPreferences, saveNotificationPreferences } from '../services/appPreferences';
import { syncLocalReminderNotifications } from '../services/notifications';
import { colors, radius } from '../theme';
import { useLocale } from '../context/LocaleContext';
import { formatTimeInput } from '../lib/structuredInput';

export function NotificationSettingsScreen({ onClose }:{onClose:()=>void}) {
  const locale=useLocale(); const rtl=locale.textDirection==='rtl';
  const days=useMemo(()=>[
    {label:locale.t('weekday.thu'),value:5},
    {label:locale.t('weekday.fri'),value:6},
    {label:locale.t('weekday.sat'),value:7},
  ],[locale.language]);
  const [prefs,setPrefs]=useState<NotificationPreferences>(defaultNotificationPreferences);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState('');
  const [status,setStatus]=useState('');
  const [saving,setSaving]=useState(false);
  const saveInFlight=useRef(false);
  useEffect(()=>{getNotificationPreferences().then(setPrefs);},[]);
  const toggle=(key:keyof NotificationPreferences)=>(value:boolean)=>{setSaved(false);setStatus('');setPrefs(p=>({...p,[key]:value}));};
  const validTime=(v:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  const save=async()=>{
    setError('');setStatus('');
    if(!validTime(prefs.dinnerReminderTime)||!validTime(prefs.weekendReminderTime)){setError(locale.t('notifications.invalidTime'));return;}
    if(saveInFlight.current)return;
    saveInFlight.current=true;setSaving(true);
    try{
      await saveNotificationPreferences(prefs);
      const result=await syncLocalReminderNotifications(prefs,{dinnerTitle:locale.t('notifications.dinnerPushTitle'),dinnerBody:locale.t('notifications.dinnerPushBody'),weekendTitle:locale.t('notifications.weekendPushTitle'),weekendBody:locale.t('notifications.weekendPushBody'),channelName:locale.t('notifications.channelName')});
      if(result==='permission-denied')setStatus(locale.t('notifications.denied'));
      else if(result==='scheduled')setStatus(locale.t('notifications.scheduled'));
      else setStatus(locale.t('notifications.disabled'));
      setSaved(true);
    }catch{
      setSaved(false);setStatus('');setError(locale.t('notifications.scheduleError'));
    }finally{
      saveInFlight.current=false;setSaving(false);
    }
  };
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View style={{flex:1}}><Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('notifications.kicker')}</Text><Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('notifications.title')}</Text></View><Text accessibilityRole="button" onPress={onClose} style={styles.close}>{locale.t('common.close')}</Text></View>
    <View style={styles.card}>
      <Row title={locale.t('notifications.planningTitle')} subtitle={locale.t('notifications.remoteUnavailable')} value={false} onChange={()=>{}} disabled rtl={rtl}/>
      <Row title={locale.t('notifications.shoppingTitle')} subtitle={locale.t('notifications.remoteUnavailable')} value={false} onChange={()=>{}} disabled rtl={rtl}/>
      <Row title={locale.t('notifications.dinnerTitle')} subtitle={locale.t('notifications.dinnerText')} value={prefs.dinnerReminder} onChange={toggle('dinnerReminder')} rtl={rtl}/>
      {prefs.dinnerReminder&&<TimeRow label={locale.t('notifications.dinnerTime')} value={prefs.dinnerReminderTime} onChange={v=>{setSaved(false);setPrefs(p=>({...p,dinnerReminderTime:v.slice(0,5)}));}} rtl={rtl}/>} 
      <Row title={locale.t('notifications.weekendTitle')} subtitle={locale.t('notifications.weekendText')} value={prefs.weekendReminder} onChange={toggle('weekendReminder')} rtl={rtl}/>
      {prefs.weekendReminder&&<><View style={styles.dayRow}><Text style={[styles.timeLabel,rtl&&styles.rtl]}>{locale.t('notifications.day')}</Text><View style={styles.dayButtons}>{days.map(d=><Pressable accessibilityRole="button" accessibilityState={{selected:prefs.weekendReminderWeekday===d.value}} key={d.value} onPress={()=>setPrefs(p=>({...p,weekendReminderWeekday:d.value}))} style={[styles.dayButton,prefs.weekendReminderWeekday===d.value&&styles.dayButtonActive]}><Text style={[styles.dayButtonText,prefs.weekendReminderWeekday===d.value&&styles.dayButtonTextActive]}>{d.label}</Text></Pressable>)}</View></View><TimeRow label={locale.t('notifications.time')} value={prefs.weekendReminderTime} onChange={v=>{setSaved(false);setPrefs(p=>({...p,weekendReminderTime:v.slice(0,5)}));}} rtl={rtl}/></>}
    </View>
    <View style={styles.info}><Text style={[styles.infoTitle,rtl&&styles.rtl]}>{locale.t('notifications.localTitle')}</Text><Text style={[styles.infoText,rtl&&styles.rtl]}>{locale.t('notifications.localText')}</Text></View>
    {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error,rtl&&styles.rtl]}>{error}</Text>:null}{status?<Text accessibilityLiveRegion="polite" style={[styles.status,rtl&&styles.rtl]}>{status}</Text>:null}
    <Pressable accessibilityRole="button" accessibilityState={{disabled:saving,busy:saving}} disabled={saving} onPress={save} style={styles.save}><Text style={styles.saveText}>{locale.t(saving?'notifications.saving':saved?'notifications.saved':'notifications.save')}</Text></Pressable>
  </ScrollView>;
}
function Row({title,subtitle,value,onChange,disabled=false,rtl=false}:{title:string;subtitle:string;value:boolean;onChange:(v:boolean)=>void;disabled?:boolean;rtl?:boolean}){return <View style={[styles.row,disabled&&styles.rowDisabled]}><View style={{flex:1,paddingRight:14}}><Text style={[styles.rowTitle,rtl&&styles.rtl]}>{title}</Text><Text style={[styles.rowText,rtl&&styles.rtl]}>{subtitle}</Text></View><Switch accessibilityLabel={title} accessibilityHint={subtitle} value={value} onValueChange={onChange} disabled={disabled}/></View>}
function TimeRow({label,value,onChange,rtl=false}:{label:string;value:string;onChange:(v:string)=>void;rtl?:boolean}){return <View style={styles.timeRow}><Text style={[styles.timeLabel,rtl&&styles.rtl]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={v=>onChange(formatTimeInput(v))} placeholder="17:00" keyboardType="number-pad" maxLength={5} style={styles.timeInput}/></View>}
const styles=StyleSheet.create({content:{padding:22,paddingTop:56,paddingBottom:48,backgroundColor:colors.cream,minHeight:'100%'},header:{flexDirection:'row',justifyContent:'space-between',gap:16,alignItems:'flex-start'},kicker:{color:colors.orange,fontWeight:'900',fontSize:11,letterSpacing:1.2},title:{color:colors.ink,fontSize:27,lineHeight:33,fontWeight:'900',marginTop:8,maxWidth:290},close:{color:colors.sageDark,fontWeight:'800',paddingTop:3},card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:16,marginTop:24},row:{minHeight:78,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:colors.border},rowDisabled:{opacity:.55},rowTitle:{color:colors.ink,fontSize:14,fontWeight:'800'},rowText:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:4},timeRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14,borderBottomWidth:1,borderBottomColor:colors.border},timeLabel:{color:colors.ink,fontWeight:'700',fontSize:13},timeInput:{width:82,minHeight:42,borderWidth:1,borderColor:colors.border,borderRadius:12,textAlign:'center',color:colors.ink,backgroundColor:colors.input,fontWeight:'800'},dayRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14,borderBottomWidth:1,borderBottomColor:colors.border},dayButtons:{flexDirection:'row',gap:6},dayButton:{paddingHorizontal:12,paddingVertical:8,borderRadius:10,backgroundColor:colors.neutralSoft},dayButtonActive:{backgroundColor:colors.sageDark},dayButtonText:{color:colors.muted,fontWeight:'800',fontSize:12},dayButtonTextActive:{color:colors.onAccent},info:{backgroundColor:colors.sageSoft,padding:16,borderRadius:radius.md,marginTop:18},infoTitle:{color:colors.ink,fontWeight:'800',fontSize:13},infoText:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:5},error:{color:colors.error,fontWeight:'700',fontSize:12,marginTop:14},status:{color:colors.sageDark,fontWeight:'700',fontSize:12,marginTop:14,lineHeight:18},save:{minHeight:54,backgroundColor:colors.sageDark,borderRadius:16,alignItems:'center',justifyContent:'center',marginTop:20},saveText:{color:colors.onAccent,fontWeight:'900',fontSize:15},rtl:{textAlign:'right',writingDirection:'rtl'}});
