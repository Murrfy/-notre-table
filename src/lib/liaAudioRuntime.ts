export type LiaAudioSignal={label:string;confidence:number;atMs:number};
export type LiaAudioRuntimeState={recentLaughterAtMs:number[];lastHumanSpeechAtMs:number|null};

const LAUGHTER_BURST_WINDOW_MS=1_600;
const HUMAN_SPEECH_HOLD_MS=900;

export function nextLiaAudioRuntimeState(state:LiaAudioRuntimeState,signal:LiaAudioSignal,kind:'laughter'|'speech'|'other'):LiaAudioRuntimeState{
  const recent=state.recentLaughterAtMs.filter(at=>signal.atMs-at<=LAUGHTER_BURST_WINDOW_MS);
  if(kind==='laughter'&&signal.confidence>=.7)recent.push(signal.atMs);
  return {recentLaughterAtMs:recent,lastHumanSpeechAtMs:kind==='speech'&&signal.confidence>=.55?signal.atMs:state.lastHumanSpeechAtMs};
}

export function liaAudioLooksLikeGroupLaughter(state:LiaAudioRuntimeState,nowMs:number):boolean{
  return state.recentLaughterAtMs.filter(at=>nowMs-at<=LAUGHTER_BURST_WINDOW_MS).length>=2;
}

export function liaAudioHumanSpeechActive(state:LiaAudioRuntimeState,nowMs:number):boolean{
  return state.lastHumanSpeechAtMs!==null&&nowMs-state.lastHumanSpeechAtMs<=HUMAN_SPEECH_HOLD_MS;
}

export const LIA_AUDIO_RUNTIME_POLICY={laughterBurstWindowMs:LAUGHTER_BURST_WINDOW_MS,humanSpeechHoldMs:HUMAN_SPEECH_HOLD_MS};
