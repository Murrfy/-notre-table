import React, { useEffect, useRef, useState } from 'react';
import { AppState, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { localIsoDate, startOfWeek } from '../lib/dates';
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
import { LiaOrb } from '../components/LiaOrb';
import { CommanderScreen } from './CommanderScreen';
import { MemosScreen } from './MemosScreen';
import type { LiaMemo } from '../services/memos';
import {getNotificationPreferences} from '../services/appPreferences';
import {refreshLiaNoonNudgesAfterOpen} from '../services/notifications';
import {chooseLiaEarlyReturnVariant,getLiaQuietState,liaQuietNow,noteLiaAppOpened} from '../services/liaProactivity';
import {runLiaOpenLoopReengagement} from '../services/liaReengagementRuntime';
import {LiaNavigationScreen} from './LiaNavigationScreen';
import {LiaCalendarScreen} from './LiaCalendarScreen';
import {maybeLiaCalendarForegroundNudge} from '../services/liaCalendarProactive';
import {getMyDisplayName} from '../services/profiles';
import {maybeEmitLiaProfileEnrichmentQuestion} from '../services/liaProfileEnrichment';
import {maybeEmitLiaBirthdayAwareness} from '../services/liaBirthdayAwareness';
import {liaCookingSessionActive} from '../services/liaCookingSession';
import {startLiaFamilyMealDecisionMonitor} from '../services/liaFamilyMealMonitor';
import {emitLiaAppFeatureFirstUse,type LiaAppFeature} from '../services/liaContextualGuidance';

export function MainScreen({ household, demo=false, onSignOut }:{household:Household;demo?:boolean;onSignOut:()=>void}) {
  const locale=useLocale();
  const [tab,setTab]=useState<TabKey>('planning');
  const [paywallOpen,setPaywallOpen]=useState(false);
  const [liaSurface,setLiaSurface]=useState<'commander'|'memos'|'calendar'|null>(null);
  const [liaNavigationDestination,setLiaNavigationDestination]=useState<string|null>(null);
  const [liaPantryVisionRequestId,setLiaPantryVisionRequestId]=useState(0);
  const [liaRecipeOpenRequest,setLiaRecipeOpenRequest]=useState<{requestId:number;recipeId:string;startCooking:boolean}|null>(null);
  const [liaReturnGreeting,setLiaReturnGreeting]=useState('');
  const [organizerName,setOrganizerName]=useState('');
  const lastOpenRefreshRef=useRef(0);
  const [weekStart,setWeekStart]=useState<Date>(()=>startOfWeek(new Date(),locale.firstWeekday));
  useEffect(()=>{setWeekStart(current=>startOfWeek(current,locale.firstWeekday));},[locale.firstWeekday]);
  useEffect(()=>startLiaFamilyMealDecisionMonitor({householdId:household.id,demo}),[household.id,demo]);
  useEffect(()=>{
    let active=true;
    if(demo){setOrganizerName('');return()=>{active=false;};}
    void getMyDisplayName().then(name=>{if(active)setOrganizerName(name);}).catch(()=>{if(active)setOrganizerName('');});
    return()=>{active=false;};
  },[demo,household.id]);
  useEffect(()=>{
    if(!demo&&!organizerName.trim())return;
    const feature:LiaAppFeature=tab==='planning'?'planning':tab==='recipes'?'recipes':tab==='shopping'?'shopping':'household';
    void emitLiaAppFeatureFirstUse({householdId:household.id,organizerName,feature}).catch(()=>{});
  },[demo,household.id,organizerName,tab]);
  useEffect(()=>{
    if(!demo&&!organizerName.trim())return;
    if(liaSurface!=='commander'&&liaSurface!=='memos')return;
    void emitLiaAppFeatureFirstUse({householdId:household.id,organizerName,feature:liaSurface}).catch(()=>{});
  },[demo,household.id,organizerName,liaSurface]);
  useEffect(()=>{
    const refresh=async()=>{
      const now=Date.now();if(now-lastOpenRefreshRef.current<2_000)return;lastOpenRefreshRef.current=now;
      const opened=await noteLiaAppOpened(new Date(now));
      if(opened.earlyReturn){
        const variant=chooseLiaEarlyReturnVariant(new Date(now));
        setLiaReturnGreeting(locale.t(`lia.return.${variant}` as any));
      }else if(!liaQuietNow(opened.quiet,new Date(now))){
        const reengagement=await runLiaOpenLoopReengagement({
          householdId:household.id,
          appForeground:true,
          genericPrivatePreview:'J’ai trouvé quelque chose pour toi 👀',
          title:'LIA',
          channelName:locale.t('notifications.channelName'),
          now:new Date(now),
          demo,
        }).catch(()=>null);
        if(reengagement?.delivery==='in-app'&&reengagement.body)setLiaReturnGreeting(reengagement.body);
        else{
          const calendarNudge=await maybeLiaCalendarForegroundNudge({now:new Date(now),demo,quiet:false,languageTag:locale.languageTag}).catch(()=>null);
          if(calendarNudge)setLiaReturnGreeting(calendarNudge);
        }
      }
      if(!demo){
        const prefs=await getNotificationPreferences();
        await refreshLiaNoonNudgesAfterOpen(prefs,{title:locale.t('notifications.liaNoonPushTitle'),body:locale.t('notifications.liaNoonPushBody'),channelName:locale.t('notifications.channelName')},new Date(now)).catch(()=>{});
      }
    };
    void refresh();
    const sub=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
    return()=>sub.remove();
  },[demo,household.id,locale.language]);
  useEffect(()=>{
    if(demo||liaSurface!==null||liaNavigationDestination!==null||liaReturnGreeting)return;
    let cancelled=false;
    let sessionProactivityUsed=false;
    let retryTimer:ReturnType<typeof setTimeout>|null=null;
    const attempt=async()=>{
      if(cancelled||sessionProactivityUsed)return;
      const quiet=await getLiaQuietState().catch(()=>null);
      if(cancelled||!quiet||liaQuietNow(quiet))return;
      const organizerName=await getMyDisplayName().catch(()=>'');
      if(cancelled)return;
      if(!liaCookingSessionActive()){
        const birthdaySurfaced=await maybeEmitLiaBirthdayAwareness({householdId:household.id,organizerName,demo:false}).catch(()=>false);
        if(cancelled)return;
        if(birthdaySurfaced){sessionProactivityUsed=true;return;}
      }
      const profileSurfaced=await maybeEmitLiaProfileEnrichmentQuestion({householdId:household.id,organizerName,demo:false}).catch(()=>false);
      if(profileSurfaced)sessionProactivityUsed=true;
    };
    const poll=()=>{void attempt().finally(()=>{if(!cancelled&&!sessionProactivityUsed)retryTimer=setTimeout(poll,30_000);});};
    const initialTimer=setTimeout(poll,90_000);
    return()=>{cancelled=true;clearTimeout(initialTimer);if(retryTimer)clearTimeout(retryTimer);};
  },[demo,household.id,liaSurface,liaNavigationDestination,liaReturnGreeting]);

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
  const openMemoLinkedContext=(memo:LiaMemo)=>{
    if(memo.link_kind==='restaurant'||memo.link_kind==='commander'){setLiaSurface('commander');return;}
    setLiaSurface(null);
    if(memo.link_kind==='recipe')setTab('recipes');
    else if(memo.link_kind==='meal')setTab('planning');
    else if(memo.link_kind==='shopping')setTab('shopping');
    else if(memo.link_kind==='family')setTab('household');
  };
  return <SafeAreaView style={styles.safe}><View style={styles.body}>
    {tab==='planning'&&<PlanningScreen householdId={household.id} householdName={household.name} organizerName={organizerName} defaultPartySize={household.default_party_size??4} demo={demo} weekStart={weekStart} onWeekStartChange={setWeekStart} access={access} onRefreshAccess={refreshAccess} onStartTrial={previewTrial} onOpenShopping={()=>setTab('shopping')}/>} 
    {tab==='recipes'&&<RecipesScreen householdId={household.id} householdName={household.name} demoMode={demo} weekStart={weekStart} access={access} onRefreshAccess={refreshAccess} onStartTrial={previewTrial} liaPantryVisionRequestId={liaPantryVisionRequestId} liaRecipeOpenRequest={liaRecipeOpenRequest}/>} 
    {tab==='shopping'&&<ShoppingScreen householdId={household.id} organizerName={organizerName} demo={demo} weekStart={weekStart} onWeekStartChange={setWeekStart} onFamilyRequired={requireFamily}/>} 
    {tab==='household'&&<HouseholdDashboardScreen household={household} demo={demo} access={access} onRefreshAccess={refreshAccess} onStartTrial={previewTrial} onSignOut={onSignOut}/>} 
    <LiaOrb earlyReturnMessage={liaReturnGreeting} onEarlyReturnDismiss={()=>setLiaReturnGreeting('')} onOpenCommander={()=>setLiaSurface('commander')} onOpenMemos={()=>setLiaSurface('memos')} onOpenCalendar={()=>setLiaSurface('calendar')} onPantryVisionRequested={()=>{setLiaSurface(null);setTab('recipes');setLiaPantryVisionRequestId(id=>id+1);}} onPantryRecipeRequested={(recipeId,startCooking)=>{setLiaSurface(null);setTab('recipes');setLiaRecipeOpenRequest(current=>({requestId:(current?.requestId??0)+1,recipeId,startCooking}));}} onNavigationRequested={destination=>setLiaNavigationDestination(destination)} householdId={household.id} weekStart={localIsoDate(weekStart)} demo={demo}/>
    <Modal visible={liaSurface!==null} animationType="slide" onRequestClose={()=>setLiaSurface(null)}>{liaSurface==='commander'?<CommanderScreen householdId={household.id} organizerName={organizerName} deliveryAddress={household.delivery_address??null} onClose={()=>setLiaSurface(null)}/>:liaSurface==='memos'?<MemosScreen householdId={household.id} organizerName={organizerName} demo={demo} onClose={()=>setLiaSurface(null)} onOpenLinkedContext={openMemoLinkedContext}/>:liaSurface==='calendar'?<LiaCalendarScreen demo={demo} onClose={()=>setLiaSurface(null)} onNavigate={destination=>{setLiaSurface(null);setLiaNavigationDestination(destination);}}/>:null}</Modal>
    <Modal visible={liaNavigationDestination!==null} animationType="slide" onRequestClose={()=>setLiaNavigationDestination(null)}>{liaNavigationDestination?<LiaNavigationScreen destination={liaNavigationDestination} householdId={household.id} demo={demo} onClose={()=>setLiaNavigationDestination(null)} onFamilyRequired={()=>{setLiaNavigationDestination(null);setPaywallOpen(true);}}/>:null}</Modal>
    <Modal visible={paywallOpen} animationType="slide" onRequestClose={()=>setPaywallOpen(false)}><PaywallScreen access={access} demo={demo} onClose={()=>setPaywallOpen(false)} onStartTrial={!demo&&access.plan==='free'&&previewTrial?async()=>{await previewTrial();setPaywallOpen(false);}:undefined}/></Modal>
  </View><TabBar active={tab} onChange={setTab}/></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},body:{flex:1}});
