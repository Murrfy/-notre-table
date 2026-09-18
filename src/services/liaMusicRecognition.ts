import {Platform} from 'react-native';
import {addLiaMusicRecognitionListener,liaMusicRecognitionAvailable,startLiaMusicRecognition,stopLiaMusicRecognition,type LiaMusicRecognitionEvent} from '../../modules/lia-sound-analysis';

export type LiaMusicRecognitionCapability={available:boolean;platform:'ios'|'android'|'other';reason:'ready'|'native_build_required'|'android_shazam_sdk_required'|'unsupported'};
export function getLiaMusicRecognitionCapability():LiaMusicRecognitionCapability{
  if(Platform.OS==='ios')return liaMusicRecognitionAvailable()?{available:true,platform:'ios',reason:'ready'}:{available:false,platform:'ios',reason:'native_build_required'};
  if(Platform.OS==='android')return liaMusicRecognitionAvailable()?{available:true,platform:'android',reason:'ready'}:{available:false,platform:'android',reason:'android_shazam_sdk_required'};
  return{available:false,platform:'other',reason:'unsupported'};
}
export async function startLiaAmbientMusicRecognition():Promise<boolean>{return getLiaMusicRecognitionCapability().available?startLiaMusicRecognition():false;}
export async function stopLiaAmbientMusicRecognition():Promise<void>{await stopLiaMusicRecognition();}
export function addLiaAmbientMusicRecognitionListener(listener:(event:LiaMusicRecognitionEvent)=>void){return addLiaMusicRecognitionListener(listener);}
