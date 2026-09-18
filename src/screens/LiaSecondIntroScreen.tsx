import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '../components/PrimaryButton';
import {TableMark} from '../components/TableMark';
import {useLocale} from '../context/LocaleContext';
import {getPreferredLiaVoice,liaVoiceAvailable,speakLia,stopLiaVoice} from '../services/liaVoice';
import {colors,radius} from '../theme';

export function LiaSecondIntroScreen({onDone}:{onDone:()=>void|Promise<void>}){
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  const[voiceSpeaking,setVoiceSpeaking]=useState(false);
  const[voiceBusy,setVoiceBusy]=useState(false);
  const[voiceReady,setVoiceReady]=useState(()=>liaVoiceAvailable());
  const autoAttempted=useRef(false);
  const activeRef=useRef(true);

  const speakSecondIntro=async()=>{
    if(voiceBusy||!liaVoiceAvailable())return;
    setVoiceBusy(true);
    try{
      const preferred=await getPreferredLiaVoice(locale.languageTag);
      const accepted=await speakLia(locale.t('lia.secondIntro'),locale.languageTag,preferred?.identifier??null,{
        onStart:()=>activeRef.current&&setVoiceSpeaking(true),
        onDone:()=>activeRef.current&&setVoiceSpeaking(false),
        onStopped:()=>activeRef.current&&setVoiceSpeaking(false),
        onError:()=>activeRef.current&&setVoiceSpeaking(false),
      });
      if(activeRef.current)setVoiceReady(accepted);
    }catch{if(activeRef.current)setVoiceReady(false);}finally{if(activeRef.current)setVoiceBusy(false);}
  };

  const stopSecondIntro=async()=>{
    if(voiceBusy)return;
    setVoiceBusy(true);
    try{await stopLiaVoice();setVoiceSpeaking(false);}finally{if(activeRef.current)setVoiceBusy(false);}
  };

  useEffect(()=>{
    activeRef.current=true;
    let cancelled=false;
    AccessibilityInfo.isScreenReaderEnabled().then(enabled=>{
      if(cancelled||enabled||autoAttempted.current||!liaVoiceAvailable())return;
      autoAttempted.current=true;
      void speakSecondIntro();
    }).catch(()=>{});
    return()=>{cancelled=true;activeRef.current=false;void stopLiaVoice();};
  },[locale.languageTag]);

  const continueFlow=async()=>{
    await stopLiaVoice();
    setVoiceSpeaking(false);
    await onDone();
  };

  return <SafeAreaView style={styles.safe}><View style={styles.container}>
    <View style={styles.top}>
      <TableMark size={72}/>
      <View style={styles.badge}><Text style={styles.badgeText}>LIA</Text></View>
      <Text style={[styles.text,rtl&&styles.rtl]}>{locale.t('lia.secondIntro')}</Text>
      {voiceReady?<Pressable accessibilityRole="button" accessibilityState={{busy:voiceBusy,disabled:voiceBusy}} disabled={voiceBusy} onPress={()=>{void (voiceSpeaking?stopSecondIntro():speakSecondIntro());}} style={[styles.voiceButton,voiceSpeaking&&styles.voiceButtonActive]}><Text style={[styles.voiceButtonText,voiceSpeaking&&styles.voiceButtonTextActive]}>{locale.t(voiceSpeaking?'onboarding.stopVoice':'onboarding.listenVoice')}</Text></Pressable>:<Text style={[styles.voiceUnavailable,rtl&&styles.rtl]}>{locale.t('onboarding.voiceUnavailable')}</Text>}
    </View>
    <View style={styles.bottom}><PrimaryButton label={locale.t('lia.secondIntroCta')} onPress={()=>{void continueFlow();}} disabled={voiceBusy}/></View>
  </View></SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cream},
  container:{flex:1,padding:24,justifyContent:'space-between'},
  top:{alignItems:'center',paddingTop:28},
  badge:{marginTop:18,backgroundColor:colors.sageDark,borderRadius:999,paddingHorizontal:14,paddingVertical:7},
  badgeText:{color:colors.onAccent,fontWeight:'900',letterSpacing:1.2},
  text:{marginTop:22,maxWidth:560,color:colors.ink,fontSize:22,lineHeight:32,fontWeight:'700',textAlign:'center',backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,padding:20},
  voiceButton:{marginTop:16,minHeight:44,paddingHorizontal:18,borderRadius:999,borderWidth:1,borderColor:colors.sageBorder,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center'},
  voiceButtonActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},
  voiceButtonText:{color:colors.sageDark,fontWeight:'900',fontSize:13},
  voiceButtonTextActive:{color:colors.onAccent},
  voiceUnavailable:{color:colors.muted,fontSize:11,lineHeight:16,textAlign:'center',marginTop:12,maxWidth:420},
  bottom:{paddingBottom:8},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
