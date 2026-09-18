import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Modal,Platform,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {activateKeepAwakeAsync,deactivateKeepAwake} from 'expo-keep-awake';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useLocale} from '../context/LocaleContext';
import {colors} from '../theme';
import type {LiaSocialLevel,LiaSurfaceMode} from '../lib/lia';
import {DEFAULT_LIA_NAMING_CONTEXT,liaDirectAddressNames} from '../lib/liaIdentity';
import {liaChooseLaughterReaction} from '../lib/liaSocialPresence';
import {liaAudioHumanSpeechActive,liaAudioLooksLikeGroupLaughter,nextLiaAudioRuntimeState,type LiaAudioRuntimeState} from '../lib/liaAudioRuntime';
import {addLiaListeningEventListener,getLiaListeningCapability,isHumanSpeechClassification,isLaughterClassification,isMusicClassification,startLiaListening,stopLiaListening} from '../services/liaListening';
import {getLiaLaughterApproved,getPreferredLiaVoice,liaLaughterUtterance,listLiaVoiceOptions,setLiaLaughterApproved,setPreferredLiaVoice,speakLia,stopLiaVoice,type LiaVoiceOption} from '../services/liaVoice';
import type {LiaTableConversationRuntime} from '../services/liaTableConversationRuntime';
import {startLiaTableLiveCoordinator} from '../services/liaTableLiveCoordinator';
import {detectLiaDirectAddress} from '../services/liaDirectAddress';
import {getLiaNamingPreferences} from '../services/liaNamingPreferences';
import {handleLiaNamingTurn} from '../services/liaNamingRuntime';
import {liaTableConversationAvailable} from '../services/liaTableConversationCapability';
import {generateLiaTableResponse} from '../services/liaTableResponseRuntime';
import {liaAgentFailureReply} from '../lib/liaAgentFailureReply';
import {maySpeakGeneratedTableResponse} from '../services/liaTableSpeakGate';
import {executeLiaAssistantVoiceRequest} from '../services/liaAssistantVoiceExecution';
import {clearLiaReminderClarification,liaReminderClarificationPending} from '../services/liaAssistantReminderExecution';
import {clearLiaDirectAppActionClarification,liaDirectAppActionClarificationPending,liaShoppingShortageFollowupActive} from '../services/liaAssistantDirectActionExecution';
import {clearLiaMessageClarification,liaMessageClarificationPending} from '../services/liaMessageActionAdapter';
import {liaPhonePronunciationRetryReply} from '../lib/liaAssistantVoice';
import {clearLiaPhoneCallClarification,liaPhoneCallClarificationPending} from '../services/liaPhoneCallCoordinator';
import {clearLiaMusicClarification,liaMusicClarificationPending} from '../services/liaMusicActionAdapter';
import {clearLiaTimerClarification,consumeRecentlyExpiredLiaTimers,liaTimerClarificationPending} from '../services/liaAssistantTimerExecution';
import {addLiaAmbientMusicRecognitionListener,startLiaAmbientMusicRecognition,stopLiaAmbientMusicRecognition} from '../services/liaMusicRecognition';
import {createLiaMusicPresenceState,liaMaySpeakDuringMusic,noteLiaMusicAudioEvidence,noteLiaMusicMatch} from '../lib/liaMusicPresence';
import {clearLiaExternalHandoff,liaExternalHandoffActive} from '../services/liaAssistantContinuity';
import {addLiaAudioDiagnosticListener,getLiaAudioDiagnosticSnapshot,shareLiaAudioDiagnosticReport,type LiaAudioDiagnosticSnapshot} from '../services/liaNativeAudioDiagnostics';
import {startLiaForegroundAssistantListening,stopLiaForegroundAssistantListening} from '../services/liaForegroundAssistantListening';
import {clearLiaNavigationClarification,liaNavigationClarificationPending} from '../services/liaAssistantNavigationExecution';
import {liaPersonalPresenceReply} from '../lib/liaPersonalPresence';
import {liaNavigationLiveSessionActive} from '../services/liaNavigationLiveSession';
import {clearLiaCalendarClarification,liaCalendarClarificationPending} from '../services/liaAssistantCalendarExecution';
import {liaCookingSessionClarificationPending,liaCookingSessionFollowupActive} from '../services/liaCookingSession';
import {addLiaContextualGuidanceListener,liaContextualGuidanceFallback,liaContextualGuidancePrompt} from '../services/liaContextualGuidance';

export function LiaOrb({earlyReturnMessage='',onEarlyReturnDismiss,onOpenCommander,onOpenMemos,onOpenCalendar,onPantryVisionRequested,onPantryRecipeRequested,onNavigationRequested,commanderContextLabel='',onCommanderCommand,householdId,weekStart,demo=false,primaryAssistant=true}:{earlyReturnMessage?:string;onEarlyReturnDismiss?:()=>void;onOpenCommander?:()=>void;onOpenMemos?:()=>void;onOpenCalendar?:()=>void;onPantryVisionRequested?:()=>void;onPantryRecipeRequested?:(recipeId:string,startCooking:boolean)=>void;onNavigationRequested?:(destination:string)=>void;commanderContextLabel?:string;onCommanderCommand?:(command:string)=>boolean;householdId?:string;weekStart?:string;demo?:boolean;primaryAssistant?:boolean}={}){
  const locale=useLocale();
  const insets=useSafeAreaInsets();
  const rtl=locale.textDirection==='rtl';
  const[open,setOpen]=useState(false);
  const[returnVisible,setReturnVisible]=useState(Boolean(earlyReturnMessage));
  const[enabled,setEnabled]=useState(true);
  const[mode,setMode]=useState<LiaSurfaceMode>('idle');
  const[social,setSocial]=useState<LiaSocialLevel>('present');
  const[listening,setListening]=useState(false);
  const[listeningBusy,setListeningBusy]=useState(false);
  const[listeningError,setListeningError]=useState(false);
  const[appActive,setAppActive]=useState(AppState.currentState==='active');
  const[manualListeningPaused,setManualListeningPaused]=useState(false);
  const[voiceOptions,setVoiceOptions]=useState<LiaVoiceOption[]>([]);
  const[currentVoice,setCurrentVoice]=useState<LiaVoiceOption|null>(null);
  const[voiceBusy,setVoiceBusy]=useState(false);
  const[voiceSpeaking,setVoiceSpeaking]=useState(false);
  const[voiceLab,setVoiceLab]=useState(false);
  const[audioDiagnostic,setAudioDiagnostic]=useState<LiaAudioDiagnosticSnapshot|null>(null);
  const[diagnosticExportBusy,setDiagnosticExportBusy]=useState(false);
  const[diagnosticExportError,setDiagnosticExportError]=useState(false);
  const[commanderCommand,setCommanderCommand]=useState('');
  const[commanderCommandStatus,setCommanderCommandStatus]=useState<'idle'|'done'|'unknown'>('idle');
  const[auditionIndex,setAuditionIndex]=useState(0);
  const[laughterApproved,setLaughterApprovedState]=useState(false);
  const capability=useMemo(()=>getLiaListeningCapability(),[open]);
  const audioStateRef=useRef<LiaAudioRuntimeState>({recentLaughterAtMs:[],lastHumanSpeechAtMs:null});
  const pendingReactionRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const latestLaughterConfidenceRef=useRef(0);
  const lastReactionAtRef=useRef(0);
  const reactionHistoryRef=useRef<number[]>([]);
  const tableConversationRuntimeRef=useRef<LiaTableConversationRuntime|null>(null);
  const tableResponseGenerationRef=useRef(0);
  const phoneNameRetryRef=useRef(0);
  const musicPresenceRef=useRef(createLiaMusicPresenceState());
  const[naming,setNaming]=useState(DEFAULT_LIA_NAMING_CONTEXT);
  const directNames=useMemo(()=>liaDirectAddressNames(naming.liaNickname),[naming.liaNickname]);

  const handleForegroundAssistantTranscript=useCallback((rawText:string)=>{
    const text=rawText.trim();
    if(!text||!enabled||!primaryAssistant)return;
    const clarificationPending=phoneNameRetryRef.current>0||liaPhoneCallClarificationPending()||liaMessageClarificationPending()||liaReminderClarificationPending()||liaTimerClarificationPending()||liaDirectAppActionClarificationPending()||liaShoppingShortageFollowupActive()||liaMusicClarificationPending()||liaNavigationClarificationPending()||liaCalendarClarificationPending()||liaCookingSessionClarificationPending()||liaCookingSessionFollowupActive();
    const directlyAddressed=detectLiaDirectAddress(text,directNames).addressed;
    if(!clarificationPending&&!directlyAddressed)return;

    const generation=++tableResponseGenerationRef.current;
    const speakReply=async(reply:string,sensitive=false)=>{
      if(generation!==tableResponseGenerationRef.current||!reply.trim()||!enabled)return;
      if(!liaMaySpeakDuringMusic({musicActive:musicPresenceRef.current.musicActive,directlyAddressed:true,userExplicitlyRequestedComment:true}))return;
      await speakLia(reply,locale.languageTag,currentVoice?.identifier,{
        onStart:()=>setVoiceSpeaking(true),
        onDone:()=>setVoiceSpeaking(false),
        onStopped:()=>setVoiceSpeaking(false),
        onError:()=>setVoiceSpeaking(false),
      });
    };

    void (async()=>{
      const namingTurn=await handleLiaNamingTurn({text,languageTag:locale.languageTag,preferences:naming});
      if(generation!==tableResponseGenerationRef.current)return;
      if(namingTurn.handled){
        if(namingTurn.preferences!==naming)setNaming(namingTurn.preferences);
        if(namingTurn.reply)await speakReply(namingTurn.reply);
        return;
      }

      const assistant=await executeLiaAssistantVoiceRequest({
        text,
        languageTag:locale.languageTag,
        awaitingPhoneName:phoneNameRetryRef.current>0,
        awaitingPhoneClarification:liaPhoneCallClarificationPending(),
        awaitingMessageClarification:liaMessageClarificationPending(),
        directNames,
        householdId,
        weekStart,
        demo,
      });
      if(generation!==tableResponseGenerationRef.current)return;

      if(assistant.status==='phone'){
        if(assistant.result.status==='no_match'||assistant.result.status==='invalid_target'){
          phoneNameRetryRef.current+=1;
          await speakReply(liaPhonePronunciationRetryReply(phoneNameRetryRef.current,locale.languageTag));
          return;
        }
        phoneNameRetryRef.current=0;
        if(assistant.spokenReply)await speakReply(assistant.spokenReply);
        return;
      }
      if(assistant.status==='message_unavailable'){
        await speakReply(locale.languageTag.startsWith('fr')?'Je peux préparer le message, mais le service de messagerie n’est pas disponible sur cet appareil.':'I can prepare the message, but messaging is not available on this device.');
        return;
      }
      if(assistant.status==='navigation_requested'){
        onNavigationRequested?.(assistant.destination);
        await speakReply(assistant.spokenReply);
        return;
      }
      if(assistant.status==='calendar_open_requested'){onOpenCalendar?.();await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='pantry_vision_requested'){onPantryVisionRequested?.();await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='pantry_vision_context'){await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='pantry_stock_saved'||assistant.status==='pantry_stock_partial'||assistant.status==='pantry_stock_unavailable'||assistant.status==='pantry_stock_failed'){await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='pantry_shopping_added'||assistant.status==='pantry_shopping_partial'||assistant.status==='pantry_shopping_needs_clarification'||assistant.status==='pantry_shopping_nothing_missing'||assistant.status==='pantry_shopping_unavailable'||assistant.status==='pantry_shopping_failed'){await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='pantry_planning_completed'||assistant.status==='pantry_planning_needs_recipe'||assistant.status==='pantry_planning_needs_clarification'||assistant.status==='pantry_planning_unavailable'||assistant.status==='pantry_planning_failed'){await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='pantry_recipe_open_requested'){onPantryRecipeRequested?.(assistant.recipeId,assistant.startCooking);await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='pantry_recipe_open_needs_recipe'||assistant.status==='pantry_recipe_open_unavailable'){await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='cooking_approximation_requested'){
        const approximation=assistant.request;
        const target=approximation.targetServings?String(approximation.targetServings):null;
        const ingredientSummary=(approximation.ingredients??[]).map(item=>`${item.name}: ${item.quantity??'quantité inconnue'}${item.unit?` ${item.unit}`:''}`).join('; ');
        const listScope=approximation.scope==='ingredient_list';
        const requestText=locale.languageTag.startsWith('fr')
          ?listScope
            ?`L’utilisateur a explicitement accepté une approximation pour adapter toute la liste d’ingrédients de « ${approximation.recipeTitle} »${target?` à ${target} personnes`:''}. Données réelles de la recette : ${ingredientSummary||'aucune quantité exploitable'}. N’approxime que les quantités manquantes ou ce qui dépend du nombre de portions absent. Garde les quantités calculables comme exactes, indique clairement chaque valeur approximative et l’hypothèse utilisée. N’invente rien si tu n’as pas de base culinaire raisonnable.`
            :`L’utilisateur a explicitement accepté une approximation culinaire pour ${approximation.ingredientName}${target?` pour ${target} personnes`:''} dans la recette « ${approximation.recipeTitle} ». Donne une estimation prudente, dis clairement que c’est approximatif et indique l’hypothèse utilisée. Ne présente jamais cette estimation comme une quantité écrite dans la recette. Si tu n’as pas de base raisonnable pour estimer, dis-le au lieu d’inventer.`
          :listScope
            ?`The user explicitly approved an approximation to scale the full ingredient list for “${approximation.recipeTitle}”${target?` to ${target} people`:''}. Real recipe data: ${ingredientSummary||'no usable quantities'}. Approximate only missing quantities or values blocked by a missing base serving count. Keep calculable quantities exact, clearly label every approximation and state the assumption. Do not invent values without a reasonable culinary basis.`
            :`The user explicitly accepted a cooking approximation for ${approximation.ingredientName}${target?` for ${target} people`:''} in the recipe “${approximation.recipeTitle}”. Give a cautious estimate, clearly say it is approximate, and state the assumption used. Never present the estimate as a quantity written in the recipe. If there is no reasonable basis to estimate, say so instead of inventing one.`;
        const confirmedFacts=[
          {key:'cooking_recipe_title',value:approximation.recipeTitle,scope:'session' as const,confirmed:true,relevant:true,sensitive:false},
          {key:listScope?'cooking_ingredient_list':'cooking_ingredient',value:listScope?(ingredientSummary||approximation.ingredientName):approximation.ingredientName,scope:'session' as const,confirmed:true,relevant:true,sensitive:false},
          {key:'cooking_approximation_permission',value:'explicit_yes',scope:'session' as const,confirmed:true,relevant:true,sensitive:false},
          ...(approximation.targetServings!==null?[{key:'cooking_target_servings',value:String(approximation.targetServings),scope:'session' as const,confirmed:true,relevant:true,sensitive:false}]:[]),
          ...(approximation.baseServings!==null?[{key:'cooking_base_servings',value:String(approximation.baseServings),scope:'session' as const,confirmed:true,relevant:true,sensitive:false}]:[]),
          ...(approximation.recordedQuantity!==null?[{key:'cooking_recorded_quantity',value:String(approximation.recordedQuantity),scope:'session' as const,confirmed:true,relevant:true,sensitive:false}]:[]),
          ...(approximation.recordedUnit?[{key:'cooking_recorded_unit',value:approximation.recordedUnit,scope:'session' as const,confirmed:true,relevant:true,sensitive:false}]:[]),
          {key:'cooking_missing_reason',value:approximation.reason,scope:'session' as const,confirmed:true,relevant:true,sensitive:false},
        ];
        const result=await generateLiaTableResponse({
          turn:{text:requestText,speakerTrackId:'foreground',memberId:null,identityConfidence:0,speechConfidence:1,mayUseMemberName:false},
          context:{mode:'cooking',languageTag:locale.languageTag,topicKey:listScope?'cooking_list_approximation':'cooking_approximation',memberId:null,mayUseMemberName:false,naming,householdId,weekStart,demo,confirmedFacts},
        });
        if(generation!==tableResponseGenerationRef.current)return;
        if(result.status==='ready'){await speakReply(result.text,result.sensitive);return;}
        await speakReply(locale.languageTag.startsWith('fr')?'Je n’ai pas assez de base fiable pour te donner même une approximation correcte.':'I don’t have enough reliable basis to give you even a sound approximation.');
        return;
      }
      if(assistant.status==='cooking_command'){if(assistant.spokenReply)await speakReply(assistant.spokenReply);return;}
      if(assistant.status==='navigation_needs_clarification'){await speakReply(assistant.spokenReply);return;}
      if(assistant.status!=='defer_to_response'&&assistant.status!=='not_assistant_request'){
        if('spokenReply'in assistant&&assistant.spokenReply)await speakReply(assistant.spokenReply);
        return;
      }

      const personalReply=liaPersonalPresenceReply(text,locale.languageTag);
      if(personalReply){await speakReply(personalReply);return;}

      const result=await generateLiaTableResponse({
        turn:{text,speakerTrackId:'foreground',memberId:null,identityConfidence:0,speechConfidence:1,mayUseMemberName:false},
        context:{
          mode:mode==='cooking'?'cooking':'table',
          languageTag:locale.languageTag,
          topicKey:null,
          memberId:null,
          mayUseMemberName:false,
          naming,
          householdId,
          weekStart,
          demo,
          confirmedFacts:musicPresenceRef.current.track?[
            {key:'ambient_music_track',value:`${musicPresenceRef.current.track.title} — ${musicPresenceRef.current.track.artist}`,scope:'session',confirmed:true,relevant:true,sensitive:false},
            {key:'ambient_music_state',value:musicPresenceRef.current.musicActive?'playing':'ended',scope:'session',confirmed:true,relevant:true,sensitive:false},
          ]:[],
        },
      });
      if(generation!==tableResponseGenerationRef.current)return;
      if(result.status==='ready'){await speakReply(result.text,result.sensitive);return;}
      const fallback=liaAgentFailureReply(result.status,locale.languageTag);
      if(fallback)await speakReply(fallback);
    })();
  },[enabled,primaryAssistant,directNames,locale.languageTag,currentVoice?.identifier,naming,householdId,weekStart,demo,mode,onNavigationRequested,onOpenCalendar,onPantryVisionRequested,onPantryRecipeRequested]);

  useEffect(()=>{
    const keepAwake=enabled&&(open||listening);
    if(keepAwake){void activateKeepAwakeAsync('notre-table-lia-active');}
    else void deactivateKeepAwake('notre-table-lia-active');
    return()=>{void deactivateKeepAwake('notre-table-lia-active');};
  },[enabled,open,listening]);

  const modeLabel=locale.t(mode==='cooking'?'lia.modeCooking':mode==='table'?'lia.modeTable':'lia.modeIdle');
  const socialLabel=locale.t(social==='discreet'?'lia.socialDiscreet':social==='host'?'lia.socialHost':'lia.socialPresent');
  useEffect(()=>{if(!earlyReturnMessage){setReturnVisible(false);return;}setReturnVisible(true);const timer=setTimeout(()=>setReturnVisible(false),9_000);return()=>clearTimeout(timer);},[earlyReturnMessage]);

  useEffect(()=>{
    let active=true;
    void getLiaNamingPreferences().then(value=>{if(active)setNaming(value);});
    return()=>{active=false;};
  },[]);

  useEffect(()=>{
    if(!primaryAssistant)return;
    return addLiaContextualGuidanceListener(event=>{
      if(!enabled||!appActive)return;
      if(event.kind==='family_choice_changed'&&event.desire!=='home')return;
      const generation=++tableResponseGenerationRef.current;
      const fallback=liaContextualGuidanceFallback(event,locale.languageTag);
      const prompt=liaContextualGuidancePrompt(event,locale.languageTag);
      void (async()=>{
        const result=await generateLiaTableResponse({
          turn:{text:prompt,speakerTrackId:'foreground',memberId:null,identityConfidence:0,speechConfidence:1,mayUseMemberName:false},
          context:{mode:'table',languageTag:locale.languageTag,topicKey:'contextual_app_guidance',memberId:null,mayUseMemberName:false,naming,householdId:event.householdId,weekStart,demo,confirmedFacts:[]},
        });
        if(generation!==tableResponseGenerationRef.current||!enabled||!appActive)return;
        const reply=result.status==='ready'?result.text:fallback;
        if(!reply.trim())return;
        if(!liaMaySpeakDuringMusic({musicActive:musicPresenceRef.current.musicActive,directlyAddressed:false,userExplicitlyRequestedComment:false}))return;
        await speakLia(reply,locale.languageTag,currentVoice?.identifier,{
          onStart:()=>setVoiceSpeaking(true),
          onDone:()=>setVoiceSpeaking(false),
          onStopped:()=>setVoiceSpeaking(false),
          onError:()=>setVoiceSpeaking(false),
        });
      })();
    });
  },[primaryAssistant,enabled,appActive,locale.languageTag,currentVoice?.identifier,naming,weekStart,demo]);

  useEffect(()=>{
    if(Platform.OS!=='ios')return;
    setAudioDiagnostic(getLiaAudioDiagnosticSnapshot());
    const subscription=addLiaAudioDiagnosticListener(setAudioDiagnostic);
    return()=>subscription.remove();
  },[]);

  useEffect(()=>{
    let cancelled=false;
    setVoiceBusy(true);
    Promise.all([listLiaVoiceOptions(locale.languageTag),getPreferredLiaVoice(locale.languageTag),getLiaLaughterApproved()])
      .then(([options,preferred,approved])=>{if(!cancelled){setVoiceOptions(options.slice(0,3));setCurrentVoice(preferred);setLaughterApprovedState(approved);setAuditionIndex(0);}})
      .finally(()=>{if(!cancelled)setVoiceBusy(false);});
    return()=>{cancelled=true;};
  },[locale.languageTag]);

  useEffect(()=>{
    if(!primaryAssistant)return;
    let cancelled=false;
    const fullConversationOwnsSpeech=open&&mode!=='idle'&&liaTableConversationAvailable();
    const shouldListen=enabled&&appActive&&!manualListeningPaused&&!fullConversationOwnsSpeech;
    if(!shouldListen){
      void stopLiaForegroundAssistantListening();
      if((!enabled||manualListeningPaused)&&listening){setListening(false);void stopLiaListening();}
      return()=>{cancelled=true;};
    }

    setListeningBusy(true);
    setListeningError(false);
    void (async()=>{
      try{
        const ambientStarted=listening||await startLiaListening();
        if(cancelled)return;
        setListening(ambientStarted);
        if(!ambientStarted){setListeningError(true);return;}
        const foregroundStarted=await startLiaForegroundAssistantListening(locale.languageTag,{onFinal:handleForegroundAssistantTranscript});
        if(cancelled){await stopLiaForegroundAssistantListening();return;}
        if(!foregroundStarted&&Platform.OS==='ios')setListeningError(true);
      }catch{
        if(!cancelled){setListening(false);setListeningError(true);}
      }finally{if(!cancelled)setListeningBusy(false);}
    })();
    return()=>{cancelled=true;};
  },[primaryAssistant,enabled,appActive,manualListeningPaused,open,mode,locale.languageTag,handleForegroundAssistantTranscript,listening]);

  useEffect(()=>{
    if(!listening)return;
    const subscription=addLiaAmbientMusicRecognitionListener(event=>{
      musicPresenceRef.current=noteLiaMusicMatch(musicPresenceRef.current,{title:event.title,artist:event.artist,identifier:event.identifier,matchedAtMs:event.matchedAtMs});
    });
    void startLiaAmbientMusicRecognition();
    return()=>{subscription?.remove();void stopLiaAmbientMusicRecognition();};
  },[listening]);

  useEffect(()=>{
    if(!enabled||!open||!listening)return;
    let active=true;
    const poll=async()=>{
      const expired=await consumeRecentlyExpiredLiaTimers(new Date());
      if(!active||!expired.length)return;
      const label=expired[0]?.label;
      const reply=locale.languageTag.startsWith('fr')?`Le minuteur${label?` ${label}`:''} est terminé.`:`The timer${label?` ${label}`:''} is finished.`;
      if(!voiceSpeaking&&!liaAudioHumanSpeechActive(audioStateRef.current,Date.now())){
        await speakLia(reply,locale.languageTag,currentVoice?.identifier,{onStart:()=>setVoiceSpeaking(true),onDone:()=>setVoiceSpeaking(false),onStopped:()=>setVoiceSpeaking(false),onError:()=>setVoiceSpeaking(false)});
      }
    };
    void poll();const id=setInterval(()=>{void poll();},1000);
    return()=>{active=false;clearInterval(id);};
  },[enabled,open,listening,locale.languageTag,currentVoice?.identifier,voiceSpeaking]);

  useEffect(()=>{
    if(!listening)return;
    const subscription=addLiaListeningEventListener(event=>{
      const now=Date.now();
      const laughter=isLaughterClassification(event.label);
      const speech=isHumanSpeechClassification(event.label);
      const music=isMusicClassification(event.label);
      musicPresenceRef.current=noteLiaMusicAudioEvidence(musicPresenceRef.current,music&&event.confidence>=.55,now);
      audioStateRef.current=nextLiaAudioRuntimeState(audioStateRef.current,{label:event.label,confidence:event.confidence,atMs:now},laughter?'laughter':speech?'speech':'other');

      if(speech&&event.confidence>=.55){
        if(pendingReactionRef.current){clearTimeout(pendingReactionRef.current);pendingReactionRef.current=null;}
        if(voiceSpeaking)void stopLiaVoice();
        return;
      }
      if(liaNavigationLiveSessionActive()||musicPresenceRef.current.musicActive||!laughter||event.confidence<.78)return;
      latestLaughterConfidenceRef.current=event.confidence;
      if(pendingReactionRef.current)clearTimeout(pendingReactionRef.current);
      pendingReactionRef.current=setTimeout(()=>{
        pendingReactionRef.current=null;
        const at=Date.now();
        reactionHistoryRef.current=reactionHistoryRef.current.filter(value=>at-value<600_000);
        const humanSpeechActive=liaAudioHumanSpeechActive(audioStateRef.current,at);
        const reaction=liaChooseLaughterReaction({
          sessionExplicitlyActive:listening,
          microphoneConsent:listening,
          localSoundClassifierAvailable:capability.available,
          mode,
          socialLevel:social,
          laughterConfidence:latestLaughterConfidenceRef.current,
          laughterIntensity:.7,
          groupLaughter:liaAudioLooksLikeGroupLaughter(audioStateRef.current,at),
          directAddressed:false,
          humanSpeechActive,
          liaSpeaking:voiceSpeaking,
          silenceAfterLaughterMs:450,
          msSinceLastReaction:lastReactionAtRef.current?at-lastReactionAtRef.current:Number.MAX_SAFE_INTEGER,
          reactionsLast10Minutes:reactionHistoryRef.current.length,
          sensitiveMoment:false,
        });
        if(reaction==='none'||reaction==='smile'||!laughterApproved)return;
        lastReactionAtRef.current=at;
        reactionHistoryRef.current.push(at);
        void speakLia(liaLaughterUtterance(reaction,locale.languageTag),locale.languageTag,currentVoice?.identifier,{onStart:()=>setVoiceSpeaking(true),onDone:()=>setVoiceSpeaking(false),onStopped:()=>setVoiceSpeaking(false),onError:()=>setVoiceSpeaking(false)});
      },450);
    });
    return()=>{subscription?.remove();if(pendingReactionRef.current){clearTimeout(pendingReactionRef.current);pendingReactionRef.current=null;}};
  },[listening,capability.available,mode,social,voiceSpeaking,locale.languageTag,currentVoice?.identifier,laughterApproved]);

  useEffect(()=>{
    let cancelled=false;
    const shouldRun=enabled&&open&&listening&&!liaNavigationLiveSessionActive()&&(mode==='table'||mode==='cooking')&&liaTableConversationAvailable();
    if(!shouldRun){
      const runtime=tableConversationRuntimeRef.current;
      tableConversationRuntimeRef.current=null;
      tableResponseGenerationRef.current+=1;
      if(runtime)void runtime.stop();
      return()=>{cancelled=true;};
    }
    void startLiaTableLiveCoordinator({
      directCallForTurn:(turn)=>({
        directlyAddressed:phoneNameRetryRef.current>0||liaPhoneCallClarificationPending()||liaMessageClarificationPending()||liaReminderClarificationPending()||liaTimerClarificationPending()||liaDirectAppActionClarificationPending()||liaMusicClarificationPending()||liaNavigationClarificationPending()||detectLiaDirectAddress(turn.text,directNames).addressed,
        speechUnderstood:turn.speechConfidence>=.8,
        sensitive:false,
        humanSpeechActive:false,
      }),
      contextForTurn:()=>({
        topicUnderstood:true,
        contributionUseful:mode==='table'&&!musicPresenceRef.current.musicActive,
        sensitive:false,
        humanSpeechActive:liaAudioHumanSpeechActive(audioStateRef.current,Date.now()),
        naturalGapMs:1800,
      }),
      onEligibleTurn:(turn)=>{
        const generation=++tableResponseGenerationRef.current;
        const directlyAddressed=phoneNameRetryRef.current>0||liaPhoneCallClarificationPending()||liaMessageClarificationPending()||liaReminderClarificationPending()||liaTimerClarificationPending()||liaDirectAppActionClarificationPending()||liaMusicClarificationPending()||liaNavigationClarificationPending()||detectLiaDirectAddress(turn.text,directNames).addressed;
        const speakIfStillFree=async(text:string,sensitive=false)=>{
          if(generation!==tableResponseGenerationRef.current||!text.trim())return;
          if(!liaMaySpeakDuringMusic({musicActive:musicPresenceRef.current.musicActive,directlyAddressed,userExplicitlyRequestedComment:directlyAddressed}))return;
          const maySpeak=maySpeakGeneratedTableResponse({
            responseReady:true,
            sensitive,
            humanSpeechActive:liaAudioHumanSpeechActive(audioStateRef.current,Date.now()),
            liaAlreadySpeaking:voiceSpeaking,
            sessionStillActive:Boolean(tableConversationRuntimeRef.current),
          });
          if(!maySpeak)return;
          await speakLia(text,locale.languageTag,currentVoice?.identifier,{
            onStart:()=>setVoiceSpeaking(true),
            onDone:()=>setVoiceSpeaking(false),
            onStopped:()=>setVoiceSpeaking(false),
            onError:()=>setVoiceSpeaking(false),
          });
        };
        void (async()=>{
          const namingTurn=await handleLiaNamingTurn({text:turn.text,languageTag:locale.languageTag,preferences:naming});
          if(generation!==tableResponseGenerationRef.current)return;
          if(namingTurn.handled){
            if(namingTurn.preferences!==naming)setNaming(namingTurn.preferences);
            if(namingTurn.reply)await speakIfStillFree(namingTurn.reply);
            return;
          }
          const assistant=await executeLiaAssistantVoiceRequest({text:turn.text,languageTag:locale.languageTag,awaitingPhoneName:phoneNameRetryRef.current>0,awaitingPhoneClarification:liaPhoneCallClarificationPending(),awaitingMessageClarification:liaMessageClarificationPending(),directNames,householdId,weekStart,demo});
          if(generation!==tableResponseGenerationRef.current)return;
          if(assistant.status==='phone'){
            if(assistant.result.status==='no_match'||assistant.result.status==='invalid_target'){
              phoneNameRetryRef.current+=1;
              await speakIfStillFree(liaPhonePronunciationRetryReply(phoneNameRetryRef.current,locale.languageTag));
              return;
            }
            phoneNameRetryRef.current=0;
            if(assistant.spokenReply)await speakIfStillFree(assistant.spokenReply);
            return;
          }
          if(assistant.status==='action_cancelled'){
            phoneNameRetryRef.current=0;
            await speakIfStillFree(assistant.spokenReply);
            return;
          }
          if(assistant.status==='message_unavailable'){
            await speakIfStillFree(locale.languageTag.startsWith('fr')?'Je peux comprendre ta demande, mais je ne peux pas prétendre avoir envoyé un message sans service de messagerie connecté.':'I understand, but I cannot claim a message was sent without a connected messaging service.');
            return;
          }
          if(assistant.status==='message_prepared'||assistant.status==='message_needs_clarification'){
            if(assistant.spokenReply)await speakIfStillFree(assistant.spokenReply);
            return;
          }
          if(assistant.status==='reminder_scheduled'||assistant.status==='reminder_needs_clarification'||assistant.status==='reminder_permission_denied'||assistant.status==='reminder_invalid'){
            await speakIfStillFree(assistant.spokenReply);
            return;
          }
          if(assistant.status==='timer_started'||assistant.status==='timer_remaining'||assistant.status==='timer_cancelled'||assistant.status==='timer_needs_clarification'||assistant.status==='timer_none_active'||assistant.status==='timer_unavailable'||assistant.status==='timer_invalid'){
            await speakIfStillFree(assistant.spokenReply);
            return;
          }
          if(assistant.status==='music_launched'||assistant.status==='music_needs_clarification'||assistant.status==='music_unavailable'){
            await speakIfStillFree(assistant.spokenReply);
            return;
          }
          if(assistant.status==='navigation_requested'){
            onNavigationRequested?.(assistant.destination);
            await speakIfStillFree(assistant.spokenReply);
            return;
          }
          if(assistant.status==='navigation_needs_clarification'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='navigation_status'||assistant.status==='navigation_stopped'||assistant.status==='navigation_stopover_needs_confirmation'||assistant.status==='navigation_stopover_added'||assistant.status==='navigation_stopover_cancelled'||assistant.status==='navigation_stopover_unavailable'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='calendar_open_requested'){onOpenCalendar?.();await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='pantry_vision_requested'){onPantryVisionRequested?.();await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='pantry_vision_context'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='pantry_stock_saved'||assistant.status==='pantry_stock_partial'||assistant.status==='pantry_stock_unavailable'||assistant.status==='pantry_stock_failed'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='pantry_shopping_added'||assistant.status==='pantry_shopping_partial'||assistant.status==='pantry_shopping_needs_clarification'||assistant.status==='pantry_shopping_nothing_missing'||assistant.status==='pantry_shopping_unavailable'||assistant.status==='pantry_shopping_failed'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='pantry_planning_completed'||assistant.status==='pantry_planning_needs_recipe'||assistant.status==='pantry_planning_needs_clarification'||assistant.status==='pantry_planning_unavailable'||assistant.status==='pantry_planning_failed'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='pantry_recipe_open_requested'){onPantryRecipeRequested?.(assistant.recipeId,assistant.startCooking);await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='pantry_recipe_open_needs_recipe'||assistant.status==='pantry_recipe_open_unavailable'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='cooking_command'){if(assistant.spokenReply)await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='calendar_created'||assistant.status==='calendar_deleted'||assistant.status==='calendar_updated'||assistant.status==='calendar_listed'||assistant.status==='calendar_needs_clarification'||assistant.status==='calendar_not_found'||assistant.status==='calendar_ambiguous'||assistant.status==='calendar_unavailable'){await speakIfStillFree(assistant.spokenReply);return;}
          if(assistant.status==='app_action_completed'||assistant.status==='app_action_needs_clarification'||assistant.status==='app_action_unavailable'||assistant.status==='app_action_failed'){
            await speakIfStillFree(assistant.spokenReply);
            return;
          }
          const personalReply=liaPersonalPresenceReply(turn.text,locale.languageTag);
          if(personalReply){await speakIfStillFree(personalReply);return;}

          const result=await generateLiaTableResponse({
            turn,
            context:{
              mode:mode==='cooking'?'cooking':'table',
              languageTag:locale.languageTag,
              topicKey:null,
              memberId:turn.memberId,
              mayUseMemberName:turn.mayUseMemberName,
              naming,
              householdId,
              weekStart,
              demo,
              confirmedFacts:musicPresenceRef.current.track?[{key:'ambient_music_track',value:`${musicPresenceRef.current.track.title} — ${musicPresenceRef.current.track.artist}`,scope:'session',confirmed:true,relevant:true,sensitive:false},{key:'ambient_music_state',value:musicPresenceRef.current.musicActive?'playing':'ended',scope:'session',confirmed:true,relevant:true,sensitive:false}]:[],
            },
          });
          if(generation!==tableResponseGenerationRef.current)return;
          if(result.status!=='ready'){
            if(assistant.status==='defer_to_response'&&!result.sensitive){
              const reply=liaAgentFailureReply(result.status,locale.languageTag);
              if(reply)await speakIfStillFree(reply);
            }
            return;
          }
          await speakIfStillFree(result.text,result.sensitive);
        })();
      },
    }).then(runtime=>{
      if(cancelled){if(runtime)void runtime.stop();return;}
      tableConversationRuntimeRef.current=runtime;
    });
    return()=>{
      cancelled=true;
      const runtime=tableConversationRuntimeRef.current;
      tableConversationRuntimeRef.current=null;
      tableResponseGenerationRef.current+=1;
      if(runtime)void runtime.stop();
    };
  },[enabled,open,listening,mode,locale.languageTag,currentVoice?.identifier,naming,directNames,householdId,weekStart,demo,onNavigationRequested,onOpenCalendar]);

  useEffect(()=>{
    if(enabled&&!manualListeningPaused)return;
    void stopLiaForegroundAssistantListening();
    if(listening){setListening(false);void stopLiaListening();void stopLiaAmbientMusicRecognition();}
    phoneNameRetryRef.current=0;
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaCalendarClarification();
  },[enabled,manualListeningPaused,listening]);

  useEffect(()=>{
    const sub=AppState.addEventListener('change',state=>{
      if(state==='active'){
        setAppActive(true);
        if(listening){void startLiaListening();void startLiaAmbientMusicRecognition();}
        clearLiaExternalHandoff();
        return;
      }
      const nativePhoneCallActive=Platform.OS==='ios'&&Boolean(getLiaAudioDiagnosticSnapshot()?.systemCallActive);
      const keepAssistantSession=listening&&(liaExternalHandoffActive()||nativePhoneCallActive);
      if(keepAssistantSession)setAppActive(true);
      if(listening&&(liaExternalHandoffActive()||nativePhoneCallActive))return;
      setAppActive(false);
      if(open)setOpen(false);
      void stopLiaForegroundAssistantListening();
      if(listening){setListening(false);void stopLiaListening();void stopLiaAmbientMusicRecognition();}
      if(voiceSpeaking){setVoiceSpeaking(false);void stopLiaVoice();}
      phoneNameRetryRef.current=0;
      clearLiaPhoneCallClarification();
      clearLiaMessageClarification();
      clearLiaReminderClarification();
      clearLiaTimerClarification();
      clearLiaDirectAppActionClarification();
      clearLiaMusicClarification();
      clearLiaNavigationClarification();
    });
    return()=>sub.remove();
  },[open,listening,voiceSpeaking]);

  useEffect(()=>()=>{const runtime=tableConversationRuntimeRef.current;tableConversationRuntimeRef.current=null;if(runtime)void runtime.stop();phoneNameRetryRef.current=0;clearLiaPhoneCallClarification();clearLiaMessageClarification();clearLiaReminderClarification();clearLiaTimerClarification();clearLiaDirectAppActionClarification();clearLiaMusicClarification();clearLiaNavigationClarification();clearLiaExternalHandoff();void stopLiaForegroundAssistantListening();void stopLiaAmbientMusicRecognition();void stopLiaVoice();void stopLiaListening();},[]);

  const previewVoice=async()=>{
    if(voiceBusy)return;
    setVoiceBusy(true);
    try{
      await speakLia(locale.t('lia.voiceSample'),locale.languageTag,currentVoice?.identifier,{onStart:()=>setVoiceSpeaking(true),onDone:()=>setVoiceSpeaking(false),onStopped:()=>setVoiceSpeaking(false),onError:()=>setVoiceSpeaking(false)});
    }finally{setVoiceBusy(false);}
  };

  const auditionVoice=voiceOptions[Math.min(auditionIndex,Math.max(0,voiceOptions.length-1))]??currentVoice;

  const speakAudition=async(text:string,voice:LiaVoiceOption|null=auditionVoice)=>{
    if(voiceBusy||!voice)return;
    setVoiceBusy(true);
    try{
      await speakLia(text,locale.languageTag,voice.identifier,{onStart:()=>setVoiceSpeaking(true),onDone:()=>setVoiceSpeaking(false),onStopped:()=>setVoiceSpeaking(false),onError:()=>setVoiceSpeaking(false)});
    }finally{setVoiceBusy(false);}
  };

  const chooseAuditionVoice=async()=>{
    if(!auditionVoice||voiceBusy)return;
    setVoiceBusy(true);
    try{
      await setPreferredLiaVoice(auditionVoice.identifier);
      await setLiaLaughterApproved(false);
      setCurrentVoice(auditionVoice);
      setLaughterApprovedState(false);
    }finally{setVoiceBusy(false);}
  };

  const approveAuditionLaughter=async()=>{
    if(!auditionVoice||currentVoice?.identifier!==auditionVoice.identifier||voiceBusy)return;
    setVoiceBusy(true);
    try{await setLiaLaughterApproved(true);setLaughterApprovedState(true);}finally{setVoiceBusy(false);}
  };


  const toggleListening=async()=>{
    if(listeningBusy)return;
    setListeningBusy(true);setListeningError(false);
    try{
      if(listening){
        setManualListeningPaused(true);
        await stopLiaForegroundAssistantListening();
        await stopLiaListening();
        await stopLiaAmbientMusicRecognition();
        setListening(false);
        return;
      }
      setManualListeningPaused(false);
      const started=await startLiaListening();
      setListening(started);
      if(started&&primaryAssistant)await startLiaForegroundAssistantListening(locale.languageTag,{onFinal:handleForegroundAssistantTranscript});
      if(!started)setListeningError(true);
    }catch{setListening(false);setListeningError(true);}finally{setListeningBusy(false);}
  };

  return <>
    {returnVisible&&earlyReturnMessage?<View style={[styles.returnBubble,{bottom:Math.max(82,insets.bottom+74)}]}><Text style={[styles.returnBubbleText,rtl&&styles.rtlText]}>{earlyReturnMessage}</Text><Pressable accessibilityRole="button" accessibilityLabel={locale.t('common.close')} onPress={()=>{setReturnVisible(false);onEarlyReturnDismiss?.();}} style={styles.returnBubbleClose}><Text style={styles.returnBubbleCloseText}>×</Text></Pressable></View>:null}
    <Pressable accessibilityRole="button" accessibilityLabel={locale.t('lia.open')} accessibilityState={{expanded:open}} onPress={()=>setOpen(true)} style={[styles.orb,{bottom:Math.max(18,insets.bottom+10)}]}>
      <Text style={styles.orbText}>LIA</Text>
      {listening?<View style={styles.liveDot}/>:null}
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet,rtl&&styles.rtlBox]}>
          <View style={[styles.header,rtl&&styles.rowRtl]}><View style={{flex:1}}><Text style={[styles.kicker,rtl&&styles.rtlText]}>LIA</Text><Text style={[styles.title,rtl&&styles.rtlText]}>{locale.t('lia.title')}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={locale.t('common.close')} onPress={()=>setOpen(false)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          {onCommanderCommand&&!voiceLab?<View style={styles.commanderContext}><Text style={[styles.label,rtl&&styles.rtlText]}>{locale.t('lia.commanderControl')}</Text>{commanderContextLabel?<Text style={[styles.commanderContextLabel,rtl&&styles.rtlText]}>{commanderContextLabel}</Text>:null}<TextInput accessibilityLabel={locale.t('lia.commanderCommandPlaceholder')} value={commanderCommand} onChangeText={value=>{setCommanderCommand(value);setCommanderCommandStatus('idle');}} onSubmitEditing={()=>{const value=commanderCommand.trim();if(!value)return;const handled=onCommanderCommand(value);setCommanderCommandStatus(handled?'done':'unknown');if(handled)setCommanderCommand('');}} returnKeyType="send" placeholder={locale.t('lia.commanderCommandPlaceholder')} placeholderTextColor={colors.placeholder} style={[styles.commanderCommandInput,rtl&&styles.rtlText]}/>{commanderCommandStatus==='done'?<Text accessibilityLiveRegion="polite" style={[styles.commanderCommandStatus,rtl&&styles.rtlText]}>{locale.t('lia.commanderCommandDone')}</Text>:commanderCommandStatus==='unknown'?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.commanderCommandError,rtl&&styles.rtlText]}>{locale.t('lia.commanderCommandUnknown')}</Text>:null}</View>:null}
          {voiceLab?<>
            <Text style={[styles.body,rtl&&styles.rtlText]}>{locale.t('lia.voiceLabIntro')}</Text>
            <View style={[styles.row,rtl&&styles.rowRtl]}>
              {voiceOptions.map((voice,index)=><Choice key={voice.identifier} selected={auditionIndex===index} label={locale.t('lia.voiceCandidate',{letter:String.fromCharCode(65+index)})} onPress={()=>setAuditionIndex(index)}/>)}
            </View>
            <View style={styles.status}><Text style={[styles.statusText,rtl&&styles.rtlText]}>{auditionVoice?`${locale.t('lia.voiceCandidate',{letter:String.fromCharCode(65+Math.min(auditionIndex,2))})} · ${auditionVoice.name}`:locale.t('lia.voiceSystem')}</Text></View>
            <Pressable accessibilityRole="button" accessibilityState={{busy:voiceBusy,disabled:voiceBusy||!auditionVoice}} disabled={voiceBusy||!auditionVoice} onPress={()=>void speakAudition(locale.t('lia.voiceSampleLong'))} style={styles.listen}><Text style={styles.listenText}>{locale.t('lia.voicePreviewPhrase')}</Text></Pressable>
            <Text style={[styles.label,rtl&&styles.rtlText]}>{locale.t('lia.laughterTest')}</Text>
            <View style={[styles.row,rtl&&styles.rowRtl]}>
              {(['smile','chuckle','laugh'] as const).map(reaction=><Pressable key={reaction} accessibilityRole="button" accessibilityState={{busy:voiceBusy,disabled:voiceBusy||!auditionVoice}} disabled={voiceBusy||!auditionVoice} onPress={()=>void speakAudition(liaLaughterUtterance(reaction,locale.languageTag))} style={styles.secondary}><Text style={styles.secondaryText}>{locale.t(reaction==='smile'?'lia.laughSmile':reaction==='chuckle'?'lia.laughChuckle':'lia.laughFull')}</Text></Pressable>)}
            </View>
            <Text style={[styles.localNote,rtl&&styles.rtlText]}>{locale.t('lia.laughterPrototypeNote')}</Text>
            <Pressable accessibilityRole="button" accessibilityState={{busy:voiceBusy,disabled:voiceBusy||!auditionVoice,selected:currentVoice?.identifier===auditionVoice?.identifier}} disabled={voiceBusy||!auditionVoice} onPress={()=>void chooseAuditionVoice()} style={[styles.listen,currentVoice?.identifier===auditionVoice?.identifier&&styles.listenOn]}><Text style={[styles.listenText,currentVoice?.identifier===auditionVoice?.identifier&&styles.listenTextOn]}>{currentVoice?.identifier===auditionVoice?.identifier?locale.t('lia.voiceSelected'):locale.t('lia.voiceUse',{letter:String.fromCharCode(65+Math.min(auditionIndex,2))})}</Text></Pressable>
            {currentVoice?.identifier===auditionVoice?.identifier?<Pressable accessibilityRole="button" accessibilityState={{busy:voiceBusy,disabled:voiceBusy,checked:laughterApproved}} disabled={voiceBusy} onPress={()=>void approveAuditionLaughter()} style={[styles.secondary,laughterApproved&&styles.choiceSelected]}><Text style={[styles.secondaryText,laughterApproved&&styles.choiceTextSelected]}>{laughterApproved?locale.t('lia.laughterApproved'):locale.t('lia.laughterApprove')}</Text></Pressable>:null}
            <Pressable accessibilityRole="button" onPress={()=>setVoiceLab(false)} style={styles.secondary}><Text style={styles.secondaryText}>{locale.t('lia.voiceBack')}</Text></Pressable>
          </>:<>
            <Text style={[styles.body,rtl&&styles.rtlText]}>{locale.t('lia.subtitle')}</Text>
            <View style={styles.status}><Text style={[styles.statusText,rtl&&styles.rtlText]}>{enabled?locale.t('lia.statusOn',{mode:modeLabel,social:socialLabel}):locale.t('lia.statusPaused')}</Text></View>
            <Text style={[styles.label,rtl&&styles.rtlText]}>{locale.t('lia.presence')}</Text>
            <View style={[styles.row,rtl&&styles.rowRtl]}>{(['cooking','table','idle'] as LiaSurfaceMode[]).map(value=><Choice key={value} selected={mode===value} label={locale.t(value==='cooking'?'lia.cooking':value==='table'?'lia.table':'lia.quiet')} onPress={()=>{setEnabled(true);setMode(value);}}/>)}</View>
            <Text style={[styles.label,rtl&&styles.rtlText]}>{locale.t('lia.tone')}</Text>
            <View style={[styles.row,rtl&&styles.rowRtl]}>{(['discreet','present','host'] as LiaSocialLevel[]).map(value=><Choice key={value} selected={social===value} label={locale.t(value==='discreet'?'lia.socialDiscreet':value==='host'?'lia.socialHost':'lia.socialPresent')} onPress={()=>setSocial(value)}/>)}</View>

            {(onOpenCommander||onOpenMemos||onOpenCalendar)?<>
              <View style={styles.divider}/>
              <Text style={[styles.label,rtl&&styles.rtlText]}>{locale.t('lia.shortcuts')}</Text>
              <View style={[styles.row,rtl&&styles.rowRtl]}>
                {onOpenCommander?<Pressable accessibilityRole="button" onPress={()=>{setOpen(false);onOpenCommander();}} style={styles.secondary}><Text style={styles.secondaryText}>{locale.t('lia.openCommander')}</Text></Pressable>:null}
                {onOpenMemos?<Pressable accessibilityRole="button" onPress={()=>{setOpen(false);onOpenMemos();}} style={styles.secondary}><Text style={styles.secondaryText}>{locale.t('lia.openMemos')}</Text></Pressable>:null}
                {onOpenCalendar?<Pressable accessibilityRole="button" onPress={()=>{setOpen(false);onOpenCalendar();}} style={styles.secondary}><Text style={styles.secondaryText}>{locale.t('lia.openCalendar')}</Text></Pressable>:null}
              </View>
            </>:null}

            <View style={styles.divider}/>
            <Text style={[styles.label,rtl&&styles.rtlText]}>{locale.t('lia.voice')}</Text>
            <Text style={[styles.voiceName,rtl&&styles.rtlText]}>{currentVoice?.name??locale.t('lia.voiceSystem')}</Text>
            <View style={[styles.row,rtl&&styles.rowRtl]}>
              <Pressable accessibilityRole="button" accessibilityState={{busy:voiceBusy,disabled:voiceBusy}} disabled={voiceBusy} onPress={previewVoice} style={styles.secondary}><Text style={styles.secondaryText}>{locale.t('lia.voicePreview')}</Text></Pressable>
              {voiceOptions.length>1?<Pressable accessibilityRole="button" onPress={()=>setVoiceLab(true)} style={styles.secondary}><Text style={styles.secondaryText}>{locale.t('lia.voiceChoose')}</Text></Pressable>:null}
            </View>
            <Text style={[styles.localNote,rtl&&styles.rtlText]}>{laughterApproved?locale.t('lia.laughterApprovedStatus'):locale.t('lia.laughterPendingStatus')}</Text>

            {mode!=='idle'?<>
              <Text style={[styles.label,rtl&&styles.rtlText]}>{locale.t('lia.listening')}</Text>
              {capability.available?<>
                <Pressable accessibilityRole="button" accessibilityState={{busy:listeningBusy,checked:listening,disabled:listeningBusy}} disabled={listeningBusy} onPress={toggleListening} style={[styles.listen,listening&&styles.listenOn]}><Text style={[styles.listenText,listening&&styles.listenTextOn]}>{listening?locale.t('lia.listenStop'):locale.t('lia.listenStart')}</Text></Pressable>
                {listening?<Text style={[styles.localNote,rtl&&styles.rtlText]}>{locale.t('lia.listenLocal')}</Text>:null}
                {Platform.OS==='ios'&&audioDiagnostic?<View style={styles.diagnosticCard}>
                  <Text style={[styles.diagnosticTitle,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnostic')}</Text>
                  <Text style={[styles.diagnosticLine,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnosticMicrophone')}: {audioDiagnostic.microphonePermission} · {locale.t('lia.audioDiagnosticEngine')}: {audioDiagnostic.audioEngineRunning?locale.t('lia.audioDiagnosticActive'):locale.t('lia.audioDiagnosticInactive')}</Text>
                  <Text style={[styles.diagnosticLine,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnosticShazam')}: {audioDiagnostic.shazamSessionReady?locale.t('lia.audioDiagnosticReady'):locale.t('lia.audioDiagnosticPending')} · {locale.t('lia.audioDiagnosticApp')}: {audioDiagnostic.appState}</Text>
                  <Text style={[styles.diagnosticLine,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnosticInterruption')}: {audioDiagnostic.lastInterruption} · {locale.t('lia.audioDiagnosticResume')}: {audioDiagnostic.lastResumeResult}</Text>
                  <Text style={[styles.diagnosticLine,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnosticCall')}: {audioDiagnostic.systemCallActive?locale.t('lia.audioDiagnosticCallActive'):locale.t('lia.audioDiagnosticCallIdle')} · {audioDiagnostic.systemCallState}</Text>
                  {audioDiagnostic.lastMusicTitle||audioDiagnostic.lastMusicArtist?<Text style={[styles.diagnosticLine,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnosticTrack')}: {[audioDiagnostic.lastMusicTitle,audioDiagnostic.lastMusicArtist].filter(Boolean).join(' — ')}</Text>:null}
                  {audioDiagnostic.lastShazamError?<Text style={[styles.errorText,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnosticError')}: {audioDiagnostic.lastShazamError}</Text>:null}
                  <Pressable accessibilityRole="button" accessibilityState={{busy:diagnosticExportBusy,disabled:diagnosticExportBusy}} disabled={diagnosticExportBusy} onPress={()=>{setDiagnosticExportError(false);setDiagnosticExportBusy(true);void shareLiaAudioDiagnosticReport().catch(()=>setDiagnosticExportError(true)).finally(()=>setDiagnosticExportBusy(false));}} style={styles.diagnosticExport}><Text style={styles.diagnosticExportText}>{diagnosticExportBusy?locale.t('lia.audioDiagnosticExporting'):locale.t('lia.audioDiagnosticExport')}</Text></Pressable>
                  {diagnosticExportError?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.errorText,rtl&&styles.rtlText]}>{locale.t('lia.audioDiagnosticExportError')}</Text>:null}
                </View>:null}
                {listeningError?<Text style={[styles.errorText,rtl&&styles.rtlText]}>{locale.t('lia.microphoneDenied')}</Text>:null}
              </>:<Text style={[styles.localNote,rtl&&styles.rtlText]}>{locale.t(Platform.OS==='android'?'lia.listenAndroidPending':'lia.listenBuildRequired')}</Text>}
            </>:null}

            <Pressable accessibilityRole="button" onPress={()=>setEnabled(value=>!value)} style={[styles.pause,enabled&&styles.pauseOn]}><Text style={[styles.pauseText,enabled&&styles.pauseTextOn]}>{enabled?locale.t('lia.pause'):locale.t('lia.resume')}</Text></Pressable>
            <Text style={[styles.privacy,rtl&&styles.rtlText]}>{locale.t('lia.privacy')}</Text>
          </>}
        </View>
      </View>
    </Modal>
  </>;
}

function Choice({label,selected,onPress}:{label:string;selected:boolean;onPress:()=>void}){return <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={[styles.choice,selected&&styles.choiceSelected]}><Text style={[styles.choiceText,selected&&styles.choiceTextSelected]}>{label}</Text></Pressable>}

const styles=StyleSheet.create({returnBubble:{position:'absolute',right:18,maxWidth:300,zIndex:31,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:16,paddingVertical:11,paddingLeft:13,paddingRight:38,shadowColor:'#000',shadowOpacity:.12,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:5},returnBubbleText:{color:colors.ink,fontSize:12,lineHeight:18,fontWeight:'800'},returnBubbleClose:{position:'absolute',right:7,top:5,width:28,height:28,alignItems:'center',justifyContent:'center'},returnBubbleCloseText:{color:colors.muted,fontSize:18,fontWeight:'800'},orb:{position:'absolute',right:16,width:54,height:54,borderRadius:27,backgroundColor:colors.sageDark,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.18,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:6,zIndex:50},orbText:{color:colors.onAccent,fontWeight:'900',fontSize:15,letterSpacing:.6},liveDot:{position:'absolute',right:2,top:2,width:11,height:11,borderRadius:6,backgroundColor:'#C94848',borderWidth:2,borderColor:colors.paper},backdrop:{flex:1,backgroundColor:'rgba(0,0,0,.28)',justifyContent:'flex-end'},sheet:{backgroundColor:colors.paper,borderTopLeftRadius:28,borderTopRightRadius:28,padding:22,paddingBottom:34,gap:12,maxHeight:'92%'},header:{flexDirection:'row',alignItems:'flex-start',gap:14},kicker:{fontSize:12,fontWeight:'900',letterSpacing:2,color:colors.sageDark},title:{fontSize:28,fontWeight:'900',color:colors.ink,marginTop:2},close:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:colors.neutralSoft},closeText:{fontSize:28,lineHeight:30,color:colors.ink},body:{color:colors.muted,fontSize:15,lineHeight:22},status:{padding:12,borderRadius:14,backgroundColor:colors.sageCard},statusText:{color:colors.sageDark,fontSize:13,fontWeight:'800'},label:{color:colors.ink,fontSize:13,fontWeight:'800',marginTop:4},row:{flexDirection:'row',gap:8,flexWrap:'wrap'},rowRtl:{flexDirection:'row-reverse'},choice:{paddingHorizontal:13,paddingVertical:10,borderRadius:999,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper},choiceSelected:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},choiceText:{color:colors.ink,fontSize:13,fontWeight:'700'},choiceTextSelected:{color:colors.onAccent},divider:{height:1,backgroundColor:colors.border,marginVertical:2},voiceName:{fontSize:12,color:colors.muted},secondary:{paddingHorizontal:13,paddingVertical:10,borderRadius:14,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper},secondaryText:{color:colors.ink,fontSize:13,fontWeight:'800'},listen:{paddingVertical:13,borderRadius:16,alignItems:'center',backgroundColor:colors.sageDark},listenOn:{backgroundColor:colors.neutralSoft,borderWidth:1,borderColor:colors.border},listenText:{fontWeight:'900',color:colors.onAccent},listenTextOn:{color:colors.ink},localNote:{fontSize:11,lineHeight:16,color:colors.muted},diagnosticCard:{padding:12,borderRadius:14,borderWidth:1,borderColor:colors.border,backgroundColor:colors.neutralSoft,gap:4},diagnosticTitle:{fontSize:12,fontWeight:'900',color:colors.ink},diagnosticLine:{fontSize:10,lineHeight:15,color:colors.muted,fontWeight:'700'},diagnosticExport:{marginTop:6,paddingVertical:9,paddingHorizontal:12,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper,alignItems:'center'},diagnosticExportText:{fontSize:11,fontWeight:'900',color:colors.ink},errorText:{fontSize:12,lineHeight:17,color:'#A13A3A'},pause:{marginTop:2,paddingVertical:13,borderRadius:16,alignItems:'center',backgroundColor:colors.sageDark},pauseOn:{backgroundColor:colors.neutralSoft},pauseText:{fontWeight:'900',color:colors.onAccent},pauseTextOn:{color:colors.ink},commanderContext:{padding:12,borderRadius:14,backgroundColor:colors.sageCard,gap:7},commanderContextLabel:{fontSize:11,color:colors.sageDark,fontWeight:'800'},commanderCommandInput:{minHeight:46,borderWidth:1,borderColor:colors.border,borderRadius:12,backgroundColor:colors.input,paddingHorizontal:12,fontSize:14,color:colors.ink},commanderCommandStatus:{fontSize:11,color:colors.sageDark,fontWeight:'800'},commanderCommandError:{fontSize:11,color:'#A13A3A',fontWeight:'800'},privacy:{fontSize:11,lineHeight:16,color:colors.muted},rtlText:{textAlign:'right',writingDirection:'rtl'},rtlBox:{direction:'rtl'}});
