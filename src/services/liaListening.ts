import { Platform } from 'react-native';
import {addLiaSoundClassificationListener,liaSoundAnalysisAvailable,requestLiaMicrophonePermission,startLiaSoundAnalysis,stopLiaSoundAnalysis,type LiaSoundClassificationEvent} from '../../modules/lia-sound-analysis';

export type LiaListeningCapability={available:boolean;platform:'ios'|'android'|'other';reason:'ready'|'android_model_or_build_required'|'native_build_required'|'unsupported'};

export function getLiaListeningCapability():LiaListeningCapability{
  if(Platform.OS==='ios')return liaSoundAnalysisAvailable()?{available:true,platform:'ios',reason:'ready'}:{available:false,platform:'ios',reason:'native_build_required'};
  if(Platform.OS==='android')return liaSoundAnalysisAvailable()?{available:true,platform:'android',reason:'ready'}:{available:false,platform:'android',reason:'android_model_or_build_required'};
  return {available:false,platform:'other',reason:'unsupported'};
}

export async function requestLiaListeningPermission():Promise<boolean>{
  if(!getLiaListeningCapability().available)return false;
  return requestLiaMicrophonePermission();
}

export async function startLiaListening():Promise<boolean>{
  if(!getLiaListeningCapability().available)return false;
  const permitted=await requestLiaListeningPermission();
  if(!permitted)return false;
  return startLiaSoundAnalysis();
}

export async function stopLiaListening():Promise<void>{await stopLiaSoundAnalysis();}
export function addLiaListeningEventListener(listener:(event:LiaSoundClassificationEvent)=>void){return addLiaSoundClassificationListener(listener);}
export function isLaughterClassification(label:string):boolean{const normalized=label.trim().toLowerCase();return normalized.includes('laughter')||normalized.includes('laugh')||normalized.includes('giggle')||normalized.includes('chuckle');}
export function isHumanSpeechClassification(label:string):boolean{const normalized=label.trim().toLowerCase();return normalized==='speech'||normalized.includes('conversation')||normalized.includes('talking')||normalized.includes('narration');}

export function isMusicClassification(label:string):boolean{const normalized=label.trim().toLowerCase();return normalized==='music'||normalized.includes('music');}
