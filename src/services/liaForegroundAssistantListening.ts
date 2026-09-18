import {
  addLiaForegroundSpeechTranscriptListener,
  liaForegroundAssistantAvailable,
  liaMicrophonePermissionStatus,
  liaSpeechRecognitionPermissionStatus,
  requestLiaMicrophonePermission,
  requestLiaSpeechRecognitionPermission,
  startLiaForegroundAssistant,
  stopLiaForegroundAssistant,
  type LiaNativeSubscription,
} from '../../modules/lia-sound-analysis';

export type LiaForegroundAssistantCallbacks={
  onPartial?:(text:string)=>void;
  onFinal:(text:string)=>void;
};

let subscription:LiaNativeSubscription|null=null;
let active=false;

export function liaForegroundAssistantListeningAvailable():boolean{return liaForegroundAssistantAvailable();}
export function liaForegroundAssistantListeningActive():boolean{return active;}

export async function startLiaForegroundAssistantListening(languageTag:string,callbacks:LiaForegroundAssistantCallbacks):Promise<boolean>{
  await stopLiaForegroundAssistantListening();
  if(!liaForegroundAssistantAvailable())return false;

  let microphone=liaMicrophonePermissionStatus();
  if(microphone==='undetermined'){
    const granted=await requestLiaMicrophonePermission();
    microphone=granted?'granted':'denied';
  }
  if(microphone!=='granted')return false;

  let speech=liaSpeechRecognitionPermissionStatus();
  if(speech==='undetermined'){
    const granted=await requestLiaSpeechRecognitionPermission();
    speech=granted?'granted':'denied';
  }
  if(speech!=='granted')return false;

  subscription=addLiaForegroundSpeechTranscriptListener(event=>{
    const text=event.text.trim();
    if(!text)return;
    if(event.isFinal)callbacks.onFinal(text);
    else callbacks.onPartial?.(text);
  });
  const started=await startLiaForegroundAssistant(languageTag);
  active=started;
  if(!started){subscription?.remove();subscription=null;}
  return started;
}

export async function stopLiaForegroundAssistantListening():Promise<void>{
  subscription?.remove();
  subscription=null;
  active=false;
  await stopLiaForegroundAssistant().catch(()=>{});
}
