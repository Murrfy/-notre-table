import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { LiaForegroundSpeechTranscriptEvent, LiaMusicRecognitionEvent, LiaNativeAudioRuntimeStatus, LiaNativeVoice, LiaSoundClassificationEvent, LiaSpeechStateEvent, LiaSpeechTranscriptEvent } from './LiaSoundAnalysis.types';

type LiaSoundEvents = {
  onSoundClassification(event: LiaSoundClassificationEvent): void;
  onSpeechState(event: LiaSpeechStateEvent): void;
  onSpeechTranscript(event: LiaSpeechTranscriptEvent): void;
  onMusicRecognition(event: LiaMusicRecognitionEvent): void;
  onAudioRuntimeState(event: LiaNativeAudioRuntimeStatus): void;
  onForegroundSpeechTranscript(event: LiaForegroundSpeechTranscriptEvent): void;
};

declare class LiaSoundNativeModule extends NativeModule<LiaSoundEvents> {
  audioRuntimeStatus(): LiaNativeAudioRuntimeStatus;
  isSoundAnalysisAvailable(): boolean;
  microphonePermissionStatus(): string;
  requestMicrophonePermission(): Promise<boolean>;
  startSoundAnalysis(): Promise<boolean>;
  stopSoundAnalysis(): Promise<void>;
  isMusicRecognitionAvailable(): boolean;
  startMusicRecognition(): Promise<boolean>;
  stopMusicRecognition(): Promise<void>;
  isSpeechRecognitionAvailable(): boolean;
  speechRecognitionPermissionStatus(): string;
  requestSpeechRecognitionPermission(): Promise<boolean>;
  startSpeechRecognition(languageTag:string): Promise<boolean>;
  stopSpeechRecognition(): Promise<void>;
  isForegroundAssistantAvailable(): boolean;
  startForegroundAssistant(languageTag:string): Promise<boolean>;
  stopForegroundAssistant(): Promise<void>;
  getVoices(): LiaNativeVoice[];
  speak(text:string,languageTag:string,voiceIdentifier:string|null,utteranceId:string): Promise<boolean>;
  stopSpeech(): Promise<void>;
}

export default requireOptionalNativeModule<LiaSoundNativeModule>('LiaSoundAnalysis');
