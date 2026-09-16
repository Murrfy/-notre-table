import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { AuthScreen } from './src/screens/AuthScreen';
import { HouseholdScreen } from './src/screens/HouseholdScreen';
import { MainScreen } from './src/screens/MainScreen';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { runtimeConfig } from './src/lib/runtimeConfig';
import { createHousehold, getMyHousehold, joinHousehold } from './src/services/households';
import { colors } from './src/theme';
import { Household } from './src/types';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { hasSeenOnboarding, markOnboardingSeen } from './src/services/appPreferences';
import { configureNotificationHandler } from './src/services/notifications';
import { LocaleProvider, useLocale } from './src/context/LocaleContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import * as Linking from 'expo-linking';
import { inviteCodeFromUrl } from './src/lib/inviteLinks';
import { TableMark } from './src/components/TableMark';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { RecoveryScreen } from './src/components/RecoveryScreen';
import { withTimeout } from './src/lib/async';
import { beginRequest, createRequestGate, invalidateRequests, isCurrentRequest } from './src/lib/requestGate';
import { consumeAuthLink } from './src/services/auth';
import { PasswordRecoveryScreen } from './src/screens/PasswordRecoveryScreen';

const AUTH_BOOT_TIMEOUT_MS=8_000;
const HOUSEHOLD_BOOT_TIMEOUT_MS=10_000;

export default function App(){
  useEffect(()=>{try{configureNotificationHandler();}catch{}},[]);
  return <SafeAreaProvider><ThemeProvider><LocaleProvider><AppErrorBoundary><AppContent/></AppErrorBoundary></LocaleProvider></ThemeProvider></SafeAreaProvider>;
}

function AppContent() {
  const locale=useLocale();
  const theme=useAppTheme();
  const statusStyle=theme.resolvedScheme==='dark'?'light':'dark';
  const [booting,setBooting]=useState(true);
  const [session,setSession]=useState<Session|null>(null);
  const [sessionFailure,setSessionFailure]=useState(false);
  const [authBootNonce,setAuthBootNonce]=useState(0);
  const [household,setHousehold]=useState<Household|null>(null);
  const [loadingHousehold,setLoadingHousehold]=useState(false);
  const [householdFailure,setHouseholdFailure]=useState(false);
  const [demo,setDemo]=useState(false);
  const [onboardingReady,setOnboardingReady]=useState(false);
  const [onboardingSeen,setOnboardingSeen]=useState(true);
  const [pendingInviteCode,setPendingInviteCode]=useState<string|null>(null);
  const [passwordRecovery,setPasswordRecovery]=useState(false);
  const [authLinkError,setAuthLinkError]=useState('');
  const authVersionRef=useRef(0);
  const activeUserIdRef=useRef<string|null>(null);
  const householdGateRef=useRef(createRequestGate());
  const exitInFlightRef=useRef(false);

  const applySession=useCallback((next:Session|null)=>{
    const previousUserId=activeUserIdRef.current;
    const nextUserId=next?.user.id??null;
    activeUserIdRef.current=nextUserId;
    setSession(next);
    if(previousUserId!==nextUserId){
      invalidateRequests(householdGateRef.current);
      setHousehold(null);
      setHouseholdFailure(false);
      setLoadingHousehold(false);
    }
    if(next)setSessionFailure(false);
  },[]);

  useEffect(()=>{hasSeenOnboarding().then(seen=>{setOnboardingSeen(seen);setOnboardingReady(true);}).catch(()=>{setOnboardingSeen(false);setOnboardingReady(true);});},[]);
  useEffect(()=>{
    let active=true;
    const handle=async(url:string|null|undefined)=>{
      if(!url||!active)return;
      const inviteCode=inviteCodeFromUrl(url);if(inviteCode)setPendingInviteCode(inviteCode);
      try{
        const result=await consumeAuthLink(url);
        if(!active||!result.handled)return;
        setAuthLinkError('');
        if(result.recovery)setPasswordRecovery(true);
      }catch{if(active)setAuthLinkError(locale.t('auth.linkError'));}
    };
    Linking.getInitialURL().then(url=>{void handle(url);}).catch(()=>{});
    const sub=Linking.addEventListener('url',event=>{void handle(event.url);});
    return()=>{active=false;sub.remove();};
  },[locale]);
  useEffect(()=>{
    let active=true;
    if(!supabase){setSessionFailure(false);setBooting(false);return;}
    const client=supabase;
    const bootVersion=++authVersionRef.current;
    setBooting(true);
    setSessionFailure(false);
    withTimeout(client.auth.getSession(),AUTH_BOOT_TIMEOUT_MS)
      .then(({data,error})=>{
        if(error)throw error;
        if(active&&authVersionRef.current===bootVersion)applySession(data.session);
      })
      .catch(()=>{
        if(active&&authVersionRef.current===bootVersion){
          applySession(null);
          setSessionFailure(true);
        }
      })
      .finally(()=>{
        if(active&&authVersionRef.current===bootVersion)setBooting(false);
      });
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,next)=>{
      if(!active)return;
      authVersionRef.current+=1;
      applySession(next);
      setBooting(false);
    });
    return ()=>{active=false;authVersionRef.current+=1;subscription.unsubscribe();};
  },[authBootNonce,applySession]);

  const sessionUserId=session?.user.id??null;
  const loadHousehold=useCallback(async()=>{
    if(!sessionUserId||demo){
      invalidateRequests(householdGateRef.current);
      setHouseholdFailure(false);
      setLoadingHousehold(false);
      return;
    }
    const token=beginRequest(householdGateRef.current);
    const userId=sessionUserId;
    setLoadingHousehold(true);
    setHouseholdFailure(false);
    try{
      const nextHousehold=await withTimeout(getMyHousehold(),HOUSEHOLD_BOOT_TIMEOUT_MS);
      if(!isCurrentRequest(householdGateRef.current,token)||activeUserIdRef.current!==userId)return;
      setHousehold(nextHousehold);
    }
    catch{
      if(isCurrentRequest(householdGateRef.current,token)&&activeUserIdRef.current===userId)setHouseholdFailure(true);
    }
    finally{
      if(isCurrentRequest(householdGateRef.current,token)&&activeUserIdRef.current===userId)setLoadingHousehold(false);
    }
  },[sessionUserId,demo]);
  useEffect(()=>{void loadHousehold();},[loadHousehold]);

  const enterDemo=()=>{
    if(!runtimeConfig.allowDemo)return;
    invalidateRequests(householdGateRef.current);
    setDemo(true);
    setHousehold(null);
    setSessionFailure(false);
    setHouseholdFailure(false);
  };
  const exit=async()=>{
    if(exitInFlightRef.current)return;
    exitInFlightRef.current=true;
    invalidateRequests(householdGateRef.current);
    setHousehold(null);
    setHouseholdFailure(false);
    try{
      if(demo){setDemo(false);return;}
      const result=await supabase?.auth.signOut({scope:'local'});
      if(result?.error)throw result.error;
    }finally{exitInFlightRef.current=false;}
  };

  if(booting||!onboardingReady) return <Splash text={locale.t('boot.preparing')}/>;
  if(!onboardingSeen) return <><StatusBar style={statusStyle}/><OnboardingScreen onDone={async()=>{await markOnboardingSeen();setOnboardingSeen(true);}}/></>;
  if(sessionFailure&&!demo) return <><StatusBar style={statusStyle}/><RecoveryScreen title={locale.t('recovery.connectionTitle')} message={locale.t('recovery.connectionText')} primaryLabel={locale.t('recovery.retry')} onPrimary={()=>setAuthBootNonce(value=>value+1)}/></>;
  if(!isSupabaseConfigured&&!demo) return <ConfigMissing onDemo={runtimeConfig.allowDemo?enterDemo:undefined}/>;
  if(!demo&&!session) return <><StatusBar style={statusStyle}/><AuthScreen onDemo={runtimeConfig.allowDemo?enterDemo:undefined} externalMessage={authLinkError||undefined}/></>;
  if(!demo&&passwordRecovery&&session) return <><StatusBar style={statusStyle}/><PasswordRecoveryScreen onDone={()=>setPasswordRecovery(false)}/></>;
  if(loadingHousehold) return <Splash text={locale.t('boot.household')}/>;
  if(householdFailure&&!demo) return <><StatusBar style={statusStyle}/><RecoveryScreen title={locale.t('recovery.householdTitle')} message={locale.t('recovery.householdText')} primaryLabel={locale.t('recovery.retry')} onPrimary={()=>{void loadHousehold();}} secondaryLabel={locale.t('recovery.signOut')} onSecondary={()=>{void exit();}}/></>;
  if(!household) return <><StatusBar style={statusStyle}/><HouseholdScreen demo={demo} initialJoinCode={pendingInviteCode??undefined} onCreate={async(name)=>{if(demo)setHousehold({id:'demo-household',name,role:'admin'});else setHousehold(await createHousehold(name));}} onJoin={async(code)=>{setHousehold(await joinHousehold(code));setPendingInviteCode(null);}}/></>;
  return <><StatusBar style={statusStyle}/><MainScreen household={household} demo={demo} onSignOut={exit}/></>;
}

function Splash({text}:{text:string}){const locale=useLocale();return <SafeAreaView style={styles.safe}><View style={styles.center}><TableMark size={72}/><Text style={[styles.brand,locale.textDirection==='rtl'&&styles.rtl]}>{locale.t('brand')}</Text><ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} size="small"/><Text style={[styles.text,locale.textDirection==='rtl'&&styles.rtl]}>{text}</Text></View></SafeAreaView>}
function ConfigMissing({onDemo}:{onDemo?:()=>void}){const locale=useLocale();return <SafeAreaView style={styles.safe}><View style={styles.center}><TableMark size={72}/><Text style={styles.brand}>{locale.t('brand')}</Text><Text style={[styles.missingTitle,locale.textDirection==='rtl'&&styles.rtl]}>{locale.t(onDemo?'config.ready':'config.productionTitle')}</Text><Text style={[styles.text,locale.textDirection==='rtl'&&styles.rtl]}>{locale.t(onDemo?'config.missing':'config.productionMissing')}</Text>{onDemo?<Text accessibilityRole="button" onPress={onDemo} style={styles.demo}>{locale.t('config.demo')}</Text>:null}</View></SafeAreaView>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},center:{flex:1,alignItems:'center',justifyContent:'center',padding:30,gap:18},brand:{color:colors.sageDark,fontSize:14,fontWeight:'900',letterSpacing:2},text:{color:colors.muted,textAlign:'center',fontSize:14,lineHeight:21},missingTitle:{color:colors.ink,fontSize:28,fontWeight:'800'},demo:{color:colors.onAccent,backgroundColor:colors.sageDark,paddingHorizontal:22,paddingVertical:14,borderRadius:16,fontWeight:'800',overflow:'hidden'},rtl:{textAlign:'right',writingDirection:'rtl'}});
