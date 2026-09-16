import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { startOfWeek } from '../lib/dates';
import { useLocale } from '../context/LocaleContext';
import { colors } from '../theme';
import { Household, TabKey } from '../types';
import { AccessState, loadAccessState, startLocalTrialPreview } from '../services/subscription';
import { runtimeConfig } from '../lib/runtimeConfig';
import { beginRequest, createRequestGate, invalidateRequests, isCurrentRequest } from '../lib/requestGate';
import { HouseholdDashboardScreen } from './HouseholdDashboardScreen';
import { PlanningScreen } from './PlanningScreen';
import { RecipesScreen } from './RecipesScreen';
import { ShoppingScreen } from './ShoppingScreen';
import { PaywallScreen } from './PaywallScreen';

export function MainScreen({ household, demo=false, onSignOut }:{household:Household;demo?:boolean;onSignOut:()=>void}) {
  const locale=useLocale();
  const [tab,setTab]=useState<TabKey>('planning');
  const [paywallOpen,setPaywallOpen]=useState(false);
  const [weekStart,setWeekStart]=useState<Date>(()=>startOfWeek(new Date(),locale.firstWeekday));
  useEffect(()=>{setWeekStart(current=>startOfWeek(current,locale.firstWeekday));},[locale.firstWeekday]);
  const [access,setAccess]=useState<AccessState>(()=>runtimeConfig.environment==='preview'?{plan:'family',source:'beta-preview'}:{plan:demo?'trial':'free',source:'local-preview'});
  const accessGate=useRef(createRequestGate()).current;
  const refreshAccess=async()=>{
    const token=beginRequest(accessGate);
    const next=await loadAccessState(demo,household.id);
    if(isCurrentRequest(accessGate,token))setAccess(next);
    return next;
  };
  useEffect(()=>{
    refreshAccess().catch(()=>{});
    return ()=>invalidateRequests(accessGate);
  },[demo,household.id,accessGate]);
  const startTrial=async()=>{if(demo||runtimeConfig.environment==='production')return;setAccess(await startLocalTrialPreview());};
  const previewTrial=runtimeConfig.environment==='production'?undefined:startTrial;
  const requireFamily=async()=>{try{await refreshAccess();}catch{}setPaywallOpen(true);};
  return <SafeAreaView style={styles.safe}><View style={styles.body}>
    {tab==='planning'&&<PlanningScreen householdId={household.id} householdName={household.name} demo={demo} weekStart={weekStart} onWeekStartChange={setWeekStart} access={access} onRefreshAccess={refreshAccess} onStartTrial={previewTrial} onOpenShopping={()=>setTab('shopping')}/>} 
    {tab==='recipes'&&<RecipesScreen householdId={household.id} demoMode={demo} weekStart={weekStart} access={access} onRefreshAccess={refreshAccess} onStartTrial={previewTrial}/>} 
    {tab==='shopping'&&<ShoppingScreen householdId={household.id} demo={demo} weekStart={weekStart} onWeekStartChange={setWeekStart} onFamilyRequired={requireFamily}/>} 
    {tab==='household'&&<HouseholdDashboardScreen household={household} demo={demo} access={access} onRefreshAccess={refreshAccess} onStartTrial={previewTrial} onSignOut={onSignOut}/>} 
    <Modal visible={paywallOpen} animationType="slide" onRequestClose={()=>setPaywallOpen(false)}><PaywallScreen access={access} demo={demo} onClose={()=>setPaywallOpen(false)} onStartTrial={!demo&&access.plan==='free'&&previewTrial?async()=>{await previewTrial();setPaywallOpen(false);}:undefined}/></Modal>
  </View><TabBar active={tab} onChange={setTab}/></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},body:{flex:1}});
