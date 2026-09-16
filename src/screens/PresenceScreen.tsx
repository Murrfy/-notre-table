import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { localIsoDate } from '../lib/dates';
import { fetchMemberAbsences, setMemberMealAway } from '../services/availability';
import { isMemberAwayForMeal } from '../lib/presence';
import type { HouseholdMember, MealType, MemberAbsence } from '../types';
import { colors, radius } from '../theme';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n';
import { supabase } from '../lib/supabase';
import { MealGlyph } from '../components/MealGlyph';
import { MEAL_ORDER } from '../domain/meals';
import { beginRequest, createRequestGate, invalidateRequests, isCurrentRequest } from '../lib/requestGate';
import { classifyPremiumGateError } from '../lib/premiumGate';

const mealTypes:Array<{key:MealType;labelKey:TranslationKey}>=MEAL_ORDER.map(key=>({key,labelKey:`meal.${key}` as TranslationKey}));

export function PresenceScreen({householdId,members,demo=false,onClose,onFamilyRequired}:{householdId:string;members:HouseholdMember[];demo?:boolean;onClose:()=>void;onFamilyRequired?:()=>void|Promise<void>}){
  const locale=useLocale(); const rtl=locale.textDirection==='rtl';
  const today=new Date(); const todayDate=localIsoDate(today);
  const [absences,setAbsences]=useState<MemberAbsence[]>([]); const [loading,setLoading]=useState(true); const [busyKey,setBusyKey]=useState(''); const [error,setError]=useState('');
  const loadGate=useRef(createRequestGate()).current;
  const toggleInFlightRef=useRef(false);
  const load=useCallback(async()=>{
    const token=beginRequest(loadGate);
    setLoading(true);setError('');
    try{
      const next=await fetchMemberAbsences(householdId,todayDate,todayDate,demo);
      if(isCurrentRequest(loadGate,token))setAbsences(next);
    }catch{
      if(isCurrentRequest(loadGate,token))setError(locale.t('presence.loadError'));
    }finally{
      if(isCurrentRequest(loadGate,token))setLoading(false);
    }
  },[householdId,todayDate,demo,locale,loadGate]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>()=>{invalidateRequests(loadGate);},[loadGate]);
  useEffect(()=>{if(demo||!supabase)return;const channel=supabase.channel(`presence-${householdId}-${todayDate}`).on('postgres_changes',{event:'*',schema:'public',table:'member_absences',filter:`household_id=eq.${householdId}`},()=>{void load();}).subscribe();return()=>{void supabase.removeChannel(channel);};},[demo,householdId,todayDate,load]);
  const isAway=(userId:string,mealType:MealType)=>isMemberAwayForMeal(absences,userId,todayDate,mealType);
  const toggle=async(userId:string,mealType:MealType)=>{const key=`${userId}:${todayDate}:${mealType}`;if(busyKey||toggleInFlightRef.current)return;toggleInFlightRef.current=true;setBusyKey(key);setError('');try{await setMemberMealAway(householdId,userId,todayDate,mealType,!isAway(userId,mealType),demo);await load();}catch(e){if(classifyPremiumGateError(e)==='FAMILY_PLAN_REQUIRED')await onFamilyRequired?.();else setError(locale.t('presence.saveError'));}finally{toggleInFlightRef.current=false;setBusyKey('');}};
  const absenceCount=absences.length;
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View style={{flex:1}}><Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('presence.kicker')}</Text><Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('presence.title')}</Text><Text style={[styles.subtitle,rtl&&styles.rtl]}>{locale.t('presence.subtitle')}</Text></View><Text accessibilityRole="button" onPress={onClose} style={styles.close}>{locale.t('common.close')}</Text></View>
    <View style={styles.todayCard}><Text style={[styles.todayLabel,rtl&&styles.rtl]}>{locale.t('planning.today')}</Text><Text style={[styles.todayDate,rtl&&styles.rtl]}>{locale.formatDate(today,{weekday:'long',day:'numeric',month:'long'})}</Text><Text style={[styles.todayState,rtl&&styles.rtl]}>{absenceCount?locale.t('presence.mealAbsenceCount',{count:absenceCount}):locale.t('presence.everyoneHere')}</Text></View>
    {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error,rtl&&styles.rtl]}>{error}</Text>:null}
    {loading?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} style={{marginTop:28}}/>:<View style={styles.memberCard}>{members.map((member,index)=><View key={member.user_id} style={[styles.memberBlock,index>0&&styles.memberRowBorder]}><Text style={[styles.memberName,rtl&&styles.rtl]}>{member.display_name}</Text><View style={[styles.mealRow,rtl&&styles.mealRowRtl]}>{mealTypes.map(meal=>{const away=isAway(member.user_id,meal.key);const key=`${member.user_id}:${todayDate}:${meal.key}`;return <Pressable accessibilityRole="button" disabled={busyKey===key} accessibilityState={{disabled:busyKey===key,selected:!away,busy:busyKey===key}} key={meal.key} onPress={()=>toggle(member.user_id,meal.key)} style={[styles.mealChip,away&&styles.mealChipAway,busyKey===key&&{opacity:.45}]}><MealGlyph type={meal.key} size={30}/><Text style={[styles.mealLabel,away&&styles.mealLabelAway]}>{locale.t(meal.labelKey)}</Text><Text style={[styles.mealMark,away&&styles.mealMarkAway]}>{away?'○':'✓'}</Text></Pressable>})}</View></View>)}</View>}
    <View style={styles.legend}><Text style={[styles.legendText,rtl&&styles.rtl]}>{locale.t('presence.legend')}</Text></View>
    <View style={styles.privacy}><Text style={[styles.privacyText,rtl&&styles.rtl]}>{locale.t('presence.privacy')}</Text></View>
  </ScrollView>;
}

const styles=StyleSheet.create({
  content:{padding:22,paddingTop:60,paddingBottom:50,backgroundColor:colors.cream,minHeight:'100%'},header:{flexDirection:'row',gap:12,alignItems:'flex-start'},kicker:{color:colors.orange,fontSize:11,fontWeight:'900',letterSpacing:1.1},title:{color:colors.ink,fontSize:29,fontWeight:'900',marginTop:5},subtitle:{color:colors.muted,fontSize:13,lineHeight:20,marginTop:7},close:{color:colors.sageDark,fontWeight:'800',paddingTop:6},todayCard:{backgroundColor:colors.sageSoft,borderRadius:radius.md,padding:16,marginTop:20},todayLabel:{color:colors.sageDark,fontSize:10,fontWeight:'900',letterSpacing:1,textTransform:'uppercase'},todayDate:{color:colors.ink,fontSize:18,fontWeight:'900',marginTop:4,textTransform:'capitalize'},todayState:{color:colors.orange,fontSize:11,fontWeight:'900',marginTop:8},error:{color:colors.error,fontSize:12,fontWeight:'700',marginTop:12},memberCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,overflow:'hidden',marginTop:14},memberBlock:{paddingHorizontal:13,paddingVertical:13},memberRowBorder:{borderTopWidth:1,borderTopColor:colors.border},memberName:{color:colors.ink,fontSize:14,fontWeight:'900',marginBottom:9},mealRow:{flexDirection:'row',gap:6},mealRowRtl:{flexDirection:'row-reverse'},mealChip:{flex:1,minHeight:62,borderRadius:12,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center',paddingHorizontal:4,paddingVertical:6},mealChipAway:{backgroundColor:colors.neutralSoft,borderWidth:1,borderColor:colors.border},mealLabel:{color:colors.sageDark,fontSize:8,fontWeight:'900',textAlign:'center',marginTop:2},mealLabelAway:{color:colors.muted},mealMark:{color:colors.sageDark,fontSize:12,fontWeight:'900',marginTop:2},mealMarkAway:{color:colors.muted},legend:{marginTop:11,paddingHorizontal:3},legendText:{color:colors.muted,fontSize:10,lineHeight:15},privacy:{marginTop:18,borderTopWidth:1,borderTopColor:colors.border,paddingTop:14},privacyText:{color:colors.muted,fontSize:10,lineHeight:15},rtl:{textAlign:'right',writingDirection:'rtl'}
});
