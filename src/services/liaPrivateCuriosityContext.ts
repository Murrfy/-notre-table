import type {LiaSurfaceMode} from '../lib/lia';

type LiaPrivateCuriosityContext={
  mode:LiaSurfaceMode;
  appActive:boolean;
  listening:boolean;
  liaSpeaking:boolean;
  musicActive:boolean;
  lastHumanSpeechAtMs:number;
  lastSurfaceChangeAtMs:number;
};

const state:LiaPrivateCuriosityContext={
  mode:'idle',
  appActive:false,
  listening:false,
  liaSpeaking:false,
  musicActive:false,
  lastHumanSpeechAtMs:Date.now(),
  lastSurfaceChangeAtMs:Date.now(),
};

export function updateLiaPrivateCuriosityContext(input:Partial<Omit<LiaPrivateCuriosityContext,'lastHumanSpeechAtMs'|'lastSurfaceChangeAtMs'>>):void{
  if(input.mode&&input.mode!==state.mode){
    state.mode=input.mode;
    state.lastSurfaceChangeAtMs=Date.now();
    state.lastHumanSpeechAtMs=Date.now();
  }
  if(typeof input.appActive==='boolean')state.appActive=input.appActive;
  if(typeof input.listening==='boolean')state.listening=input.listening;
  if(typeof input.liaSpeaking==='boolean')state.liaSpeaking=input.liaSpeaking;
  if(typeof input.musicActive==='boolean')state.musicActive=input.musicActive;
}

export function noteLiaPrivateCuriosityHumanSpeech(atMs=Date.now()):void{
  state.lastHumanSpeechAtMs=atMs;
}

export function liaPrivateCuriosityMayPrompt(nowMs=Date.now(),minimumSilenceMs=15_000):boolean{
  if(!state.appActive||!state.listening||state.liaSpeaking||state.musicActive)return false;
  if(state.mode==='table')return false;
  const quietSince=Math.max(state.lastHumanSpeechAtMs,state.lastSurfaceChangeAtMs);
  return nowMs-quietSince>=minimumSilenceMs;
}

export function getLiaPrivateCuriosityContext():Readonly<LiaPrivateCuriosityContext>{return {...state};}
