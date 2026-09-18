import {addLiaSpeechTranscriptListener,liaMicrophonePermissionStatus,liaSpeechRecognitionAvailable,liaSpeechRecognitionPermissionStatus,requestLiaMicrophonePermission,requestLiaSpeechRecognitionPermission,startLiaSpeechRecognition,stopLiaSpeechRecognition,type LiaNativeSubscription} from '../../modules/lia-sound-analysis';

export type LiaFormDictationCallbacks={
  onPartial?:(text:string)=>void;
  onFinal:(text:string)=>void;
};

let subscription:LiaNativeSubscription|null=null;

export function liaFormDictationAvailable():boolean{return liaSpeechRecognitionAvailable();}

export async function startLiaFormDictation(languageTag:string,callbacks:LiaFormDictationCallbacks):Promise<boolean>{
  await stopLiaFormDictation();
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

  subscription=addLiaSpeechTranscriptListener(event=>{
    if(event.isFinal)callbacks.onFinal(event.text);
    else callbacks.onPartial?.(event.text);
  });
  const started=await startLiaSpeechRecognition(languageTag);
  if(!started){subscription?.remove();subscription=null;}
  return started;
}

export async function stopLiaFormDictation():Promise<void>{
  subscription?.remove();subscription=null;
  await stopLiaSpeechRecognition().catch(()=>{});
}
