import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';
import { colors, radius } from '../theme';
import type { RecipeReaction, RecipeTasteSummary } from '../types';
import { fetchRecipeTaste, setMyRecipeTaste } from '../services/recipeTaste';
import { supabase } from '../lib/supabase';
import { beginRequest, createRequestGate, invalidateRequests, isCurrentRequest } from '../lib/requestGate';
import { classifyPremiumGateError } from '../lib/premiumGate';

const options:Array<{reaction:RecipeReaction;icon:string;key:'again'|'ok'|'skip'}>=[
  {reaction:'again',icon:'♥',key:'again'},
  {reaction:'ok',icon:'🙂',key:'ok'},
  {reaction:'skip',icon:'○',key:'skip'},
];

export function RecipeTasteCard({householdId,recipeId,demoMode=false,onFamilyRequired}:{householdId:string;recipeId:string;demoMode?:boolean;onFamilyRequired?:()=>void|Promise<void>}){
  const locale=useLocale();
  const textAlign=locale.textDirection==='rtl'?'right':'left';
  const [summary,setSummary]=useState<RecipeTasteSummary|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const loadGate=useRef(createRequestGate()).current;
  const tasteInFlight=useRef(false);

  const load=useCallback(async()=>{
    const token=beginRequest(loadGate);
    try{
      const next=await fetchRecipeTaste(householdId,recipeId,demoMode);
      if(isCurrentRequest(loadGate,token)){setSummary(next);setError('');}
    }
    catch{
      if(isCurrentRequest(loadGate,token))setError(locale.t('taste.loadError'));
    }
  },[householdId,recipeId,demoMode,locale,loadGate]);

  useEffect(()=>{void load();},[load]);
  useEffect(()=>()=>{invalidateRequests(loadGate);},[loadGate]);

  useEffect(()=>{
    if(demoMode||!supabase)return;
    const channel=supabase.channel(`recipe-taste-${householdId}-${recipeId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'recipe_feedback',filter:`recipe_id=eq.${recipeId}`},()=>{void load();})
      .subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[demoMode,householdId,recipeId,load]);

  const choose=async(reaction:RecipeReaction)=>{
    if(busy||tasteInFlight.current)return;
    tasteInFlight.current=true;
    const previous=summary;
    const nextReaction=summary?.my_reaction===reaction?null:reaction;
    setBusy(true);setError('');
    try{await setMyRecipeTaste(householdId,recipeId,nextReaction,demoMode);await load();}
    catch(e){setSummary(previous??null);if(classifyPremiumGateError(e)==='FAMILY_PLAN_REQUIRED')await onFamilyRequired?.();else setError(locale.t('taste.saveError'));}
    finally{tasteInFlight.current=false;setBusy(false);}
  };

  return <View style={styles.card}>
    <Text style={[styles.kicker,{textAlign}]}>{locale.t('taste.kicker')}</Text>
    <Text style={[styles.title,{textAlign}]}>{locale.t('taste.title')}</Text>
    <Text style={[styles.subtitle,{textAlign}]}>{locale.t('taste.subtitle')}</Text>
    {!summary?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} style={styles.loader}/>:<>
      <View style={styles.options}>
        {options.map(option=>{
          const active=summary.my_reaction===option.reaction;
          return <Pressable accessibilityRole="button" key={option.reaction} disabled={busy} accessibilityState={{disabled:busy,selected:active,busy:busy}} onPress={()=>choose(option.reaction)} style={[styles.option,active&&styles.optionActive]}>
            <Text style={[styles.optionIcon,active&&styles.optionTextActive]}>{option.icon}</Text>
            <Text style={[styles.optionText,active&&styles.optionTextActive]}>{locale.t(`taste.${option.key}` as any)}</Text>
          </Pressable>;
        })}
      </View>
      <Text style={[styles.summary,{textAlign}]}>{summary.counts.total
        ? locale.t('taste.summary',{again:summary.counts.again,ok:summary.counts.ok,skip:summary.counts.skip})
        : locale.t('taste.noOpinions')}</Text>
      <Text style={[styles.note,{textAlign}]}>{locale.t('taste.note')}</Text>
    </>}
    {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error,{textAlign}]}>{error}</Text>:null}
  </View>;
}

const styles=StyleSheet.create({
  card:{marginTop:18,padding:16,borderRadius:radius.md,backgroundColor:colors.sageCard,borderWidth:1,borderColor:colors.sageBorder},
  kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.4,color:colors.sageDark},
  title:{marginTop:5,fontSize:20,fontWeight:'800',color:colors.ink},
  subtitle:{marginTop:5,fontSize:13,lineHeight:19,color:colors.muted},
  loader:{marginVertical:16},
  options:{flexDirection:'row',gap:8,marginTop:14},
  option:{flex:1,minHeight:68,paddingHorizontal:6,paddingVertical:10,borderRadius:radius.sm,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center',gap:4},
  optionActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},
  optionIcon:{fontSize:18,color:colors.sageDark},
  optionText:{fontSize:12,fontWeight:'800',color:colors.ink,textAlign:'center'},
  optionTextActive:{color:colors.onAccent},
  summary:{marginTop:12,fontSize:12,fontWeight:'700',color:colors.ink},
  note:{marginTop:5,fontSize:11,lineHeight:16,color:colors.muted},
  error:{marginTop:8,fontSize:12,color:colors.error},
});
