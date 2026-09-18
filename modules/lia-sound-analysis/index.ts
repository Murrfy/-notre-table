import NativeModule from './src/LiaSoundAnalysisModule';
import type { LiaForegroundSpeechTranscriptEvent, LiaMusicRecognitionEvent, LiaNativeAudioRuntimeStatus, LiaNativeVoice, LiaSoundClassificationEvent, LiaSpeechStateEvent, LiaSpeechTranscriptEvent } from './src/LiaSoundAnalysis.types';

export type { LiaForegroundSpeechTranscriptEvent, LiaMusicRecognitionEvent, LiaNativeAudioRuntimeStatus, LiaNativeVoice, LiaSoundClassificationEvent, LiaSpeechStateEvent, LiaSpeechTranscriptEvent };
export type LiaNativeSubscription={remove:()=>void};

export function liaNativeAudioModuleAvailable():boolean{return Boolean(NativeModule);}
export function liaNativeAudioRuntimeStatus():LiaNativeAudioRuntimeStatus|null{return NativeModule?.audioRuntimeStatus?.()??null;}
export function addLiaNativeAudioRuntimeListener(listener:(event:LiaNativeAudioRuntimeStatus)=>void):LiaNativeSubscription|null{return NativeModule?.addListener('onAudioRuntimeState',listener)??null;}
export function liaSoundAnalysisAvailable(): boolean {return Boolean(NativeModule?.isSoundAnalysisAvailable?.());}
export function liaMicrophonePermissionStatus():string{return NativeModule?.microphonePermissionStatus?.()??'unavailable';}
export async function requestLiaMicrophonePermission():Promise<boolean>{return NativeModule?NativeModule.requestMicrophonePermission():false;}
export async function startLiaSoundAnalysis(): Promise<boolean> {return NativeModule?NativeModule.startSoundAnalysis():false;}
export async function stopLiaSoundAnalysis(): Promise<void> {if(NativeModule)await NativeModule.stopSoundAnalysis();}
export function liaMusicRecognitionAvailable():boolean{return Boolean(NativeModule?.isMusicRecognitionAvailable?.());}
export async function startLiaMusicRecognition():Promise<boolean>{return NativeModule?NativeModule.startMusicRecognition():false;}
export async function stopLiaMusicRecognition():Promise<void>{if(NativeModule)await NativeModule.stopMusicRecognition();}
export function addLiaMusicRecognitionListener(listener:(event:LiaMusicRecognitionEvent)=>void):LiaNativeSubscription|null{return NativeModule?.addListener('onMusicRecognition',listener)??null;}
export function addLiaSoundClassificationListener(listener:(event:LiaSoundClassificationEvent)=>void):LiaNativeSubscription|null{return NativeModule?.addListener('onSoundClassification',listener)??null;}
export function liaSpeechRecognitionAvailable():boolean{return Boolean(NativeModule?.isSpeechRecognitionAvailable?.());}
export function liaSpeechRecognitionPermissionStatus():string{return NativeModule?.speechRecognitionPermissionStatus?.()??'unavailable';}
export async function requestLiaSpeechRecognitionPermission():Promise<boolean>{return NativeModule?NativeModule.requestSpeechRecognitionPermission():false;}
export async function startLiaSpeechRecognition(languageTag:string):Promise<boolean>{return NativeModule?NativeModule.startSpeechRecognition(languageTag):false;}
export async function stopLiaSpeechRecognition():Promise<void>{if(NativeModule)await NativeModule.stopSpeechRecognition();}
export function liaForegroundAssistantAvailable():boolean{return Boolean(NativeModule?.isForegroundAssistantAvailable?.());}
export async function startLiaForegroundAssistant(languageTag:string):Promise<boolean>{return NativeModule?NativeModule.startForegroundAssistant(languageTag):false;}
export async function stopLiaForegroundAssistant():Promise<void>{if(NativeModule)await NativeModule.stopForegroundAssistant();}
export function addLiaForegroundSpeechTranscriptListener(listener:(event:LiaForegroundSpeechTranscriptEvent)=>void):LiaNativeSubscription|null{return NativeModule?.addListener('onForegroundSpeechTranscript',listener)??null;}
export function addLiaSpeechTranscriptListener(listener:(event:LiaSpeechTranscriptEvent)=>void):LiaNativeSubscription|null{return NativeModule?.addListener('onSpeechTranscript',listener)??null;}
export function listNativeLiaVoices():LiaNativeVoice[]{return NativeModule?.getVoices?.()??[];}
export async function speakNativeLia(text:string,languageTag:string,voiceIdentifier:string|null,utteranceId:string):Promise<boolean>{return NativeModule?NativeModule.speak(text,languageTag,voiceIdentifier,utteranceId):false;}
export async function stopNativeLiaSpeech():Promise<void>{if(NativeModule)await NativeModule.stopSpeech();}
export function addLiaSpeechStateListener(listener:(event:LiaSpeechStateEvent)=>void):LiaNativeSubscription|null{return NativeModule?.addListener('onSpeechState',listener)??null;}
