export type LiaSoundClassificationEvent = {
  label: string;
  confidence: number;
  timestampMs: number;
};

export type LiaSpeechStateEvent = {
  utteranceId: string;
  state: 'start'|'done'|'stopped'|'error';
};

export type LiaSpeechTranscriptEvent = {
  text: string;
  isFinal: boolean;
};

export type LiaForegroundSpeechTranscriptEvent = LiaSpeechTranscriptEvent;

export type LiaNativeVoice = {
  identifier: string;
  name: string;
  language: string;
  quality: string;
};

export type LiaMusicRecognitionEvent = {
  title:string;
  artist:string;
  identifier:string;
  appleMusicURL?:string;
  webURL?:string;
  matchedAtMs:number;
};

export type LiaNativeAudioRuntimeStatus = {
  microphonePermission:string;
  analysisRequested:boolean;
  audioEngineRunning:boolean;
  musicRecognitionEnabled:boolean;
  shazamSessionReady:boolean;
  speechRecognitionRunning:boolean;
  foregroundAssistantEnabled:boolean;
  foregroundSpeechRecognitionRunning:boolean;
  systemCallActive:boolean;
  activeSystemCallCount:number;
  systemCallState:string;
  audioSessionCategory:string;
  audioSessionMode:string;
  lastInterruption:string;
  lastResumeResult:string;
  lastShazamError:string;
  lastMusicTitle:string;
  lastMusicArtist:string;
  reason:string;
  updatedAtMs:number;
};
