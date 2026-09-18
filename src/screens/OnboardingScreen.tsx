import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Pressable,StyleSheet,Text,View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { TableMark } from '../components/TableMark';
import { colors, radius } from '../theme';
import { useLocale } from '../context/LocaleContext';
import {getPreferredLiaVoice,liaVoiceAvailable,speakLia,stopLiaVoice} from '../services/liaVoice';

export function OnboardingScreen({onDone}:{onDone:()=>void|Promise<void>}){
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  const rowDirection=rtl?'row-reverse':'row';
  const[voiceSpeaking,setVoiceSpeaking]=useState(false);
  const[voiceBusy,setVoiceBusy]=useState(false);
  const[voiceReady,setVoiceReady]=useState(()=>liaVoiceAvailable());
  const autoAttempted=useRef(false);
  const activeRef=useRef(true);

  const speakWelcome=async()=>{
    if(voiceBusy||!liaVoiceAvailable())return;
    setVoiceBusy(true);
    try{
      const preferred=await getPreferredLiaVoice(locale.languageTag);
      const accepted=await speakLia(locale.t('onboarding.voiceIntro'),locale.languageTag,preferred?.identifier??null,{
        onStart:()=>activeRef.current&&setVoiceSpeaking(true),
        onDone:()=>activeRef.current&&setVoiceSpeaking(false),
        onStopped:()=>activeRef.current&&setVoiceSpeaking(false),
        onError:()=>activeRef.current&&setVoiceSpeaking(false),
      });
      if(activeRef.current)setVoiceReady(accepted);
    }catch{if(activeRef.current)setVoiceReady(false);}finally{if(activeRef.current)setVoiceBusy(false);}
  };

  const stopWelcome=async()=>{if(voiceBusy)return;setVoiceBusy(true);try{await stopLiaVoice();setVoiceSpeaking(false);}finally{if(activeRef.current)setVoiceBusy(false);}};

  useEffect(()=>{
    activeRef.current=true;
    let cancelled=false;
    // LIA may introduce herself automatically after the explicit language choice, but never
    // talks over VoiceOver/TalkBack. Screen-reader users can still trigger the same text
    // through the visible control if they want it.
    AccessibilityInfo.isScreenReaderEnabled().then(enabled=>{
      if(cancelled||enabled||autoAttempted.current||!liaVoiceAvailable())return;
      autoAttempted.current=true;
      void speakWelcome();
    }).catch(()=>{});
    return()=>{cancelled=true;activeRef.current=false;void stopLiaVoice();};
  },[locale.languageTag]);

  const continueFlow=async()=>{
    await stopLiaVoice();
    setVoiceSpeaking(false);
    await onDone();
  };

  return <SafeAreaView style={styles.safe}><View style={styles.container}>
    <View style={styles.hero}>
      <View style={styles.markRow}><TableMark size={92}/></View>
      <Text style={[styles.brand,rtl&&styles.rtl]}>{locale.t('brand')}</Text>
      <View style={styles.liaBadge}><Text style={styles.liaBadgeText}>LIA</Text></View>
      <Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('onboarding.title')}</Text>
      <Text style={[styles.subtitle,rtl&&styles.rtl]}>{locale.t('onboarding.subtitle')}</Text>
      {voiceReady?<Pressable accessibilityRole="button" accessibilityState={{busy:voiceBusy,disabled:voiceBusy}} disabled={voiceBusy} onPress={()=>{void (voiceSpeaking?stopWelcome():speakWelcome());}} style={[styles.voiceButton,voiceSpeaking&&styles.voiceButtonActive]}><Text style={[styles.voiceButtonText,voiceSpeaking&&styles.voiceButtonTextActive]}>{locale.t(voiceSpeaking?'onboarding.stopVoice':'onboarding.listenVoice')}</Text></Pressable>:<Text style={[styles.voiceUnavailable,rtl&&styles.rtl]}>{locale.t('onboarding.voiceUnavailable')}</Text>}
    </View>

    <View style={styles.promiseCard}>
      {(['onboarding.promise1','onboarding.promise2','onboarding.promise3'] as const).map((key,index)=><View key={key} style={[styles.promiseRow,{flexDirection:rowDirection},index>0&&styles.promiseBorder]}>
        <View style={[styles.number,index===1&&styles.numberWarm]}><Text style={styles.numberText}>{index+1}</Text></View>
        <Text style={[styles.promiseText,rtl&&styles.rtl]}>{locale.t(key)}</Text>
      </View>)}
    </View>

    <View>
      <PrimaryButton label={locale.t('onboarding.cta')} onPress={()=>{void continueFlow();}} disabled={voiceBusy}/>
      <Text style={[styles.next,rtl&&styles.rtl]}>{locale.t('onboarding.next')}</Text>
      <Text style={[styles.note,rtl&&styles.rtl]}>{locale.t('onboarding.note')}</Text>
    </View>
  </View></SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cream},
  container:{flex:1,paddingHorizontal:24,paddingTop:28,paddingBottom:20,justifyContent:'space-between'},
  hero:{alignItems:'center',paddingTop:8},
  markRow:{marginBottom:18},
  brand:{color:colors.sageDark,fontWeight:'900',letterSpacing:2,fontSize:12,textAlign:'center'},
  liaBadge:{marginTop:16,backgroundColor:colors.sageDark,borderRadius:999,paddingHorizontal:14,paddingVertical:7},
  liaBadgeText:{color:colors.onAccent,fontWeight:'900',fontSize:13,letterSpacing:1.2},
  title:{color:colors.ink,fontSize:34,lineHeight:40,fontWeight:'900',textAlign:'center',marginTop:12,maxWidth:520},
  subtitle:{color:colors.muted,fontSize:16,lineHeight:24,textAlign:'center',marginTop:10,maxWidth:500},
  voiceButton:{marginTop:16,minHeight:44,paddingHorizontal:18,borderRadius:999,borderWidth:1,borderColor:colors.sageBorder,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center'},
  voiceButtonActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},
  voiceButtonText:{color:colors.sageDark,fontWeight:'900',fontSize:13},
  voiceButtonTextActive:{color:colors.onAccent},
  voiceUnavailable:{color:colors.muted,fontSize:11,lineHeight:16,textAlign:'center',marginTop:12,maxWidth:420},
  promiseCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:16,marginVertical:22},
  promiseRow:{minHeight:70,alignItems:'center',gap:13,paddingVertical:13},
  promiseBorder:{borderTopWidth:1,borderTopColor:colors.border},
  number:{width:34,height:34,borderRadius:17,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},
  numberWarm:{backgroundColor:colors.orangeSoft},
  numberText:{color:colors.sageDark,fontSize:13,fontWeight:'900'},
  promiseText:{flex:1,color:colors.ink,fontSize:14,lineHeight:20,fontWeight:'700'},
  next:{textAlign:'center',color:colors.ink,fontSize:12,lineHeight:17,fontWeight:'800',marginTop:12},
  note:{textAlign:'center',color:colors.muted,fontSize:11,lineHeight:16,marginTop:8},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
