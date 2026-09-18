export type LiaRecognizedMusic={title:string;artist:string;identifier?:string|null;matchedAtMs:number};
export type LiaMusicPresenceState={track:LiaRecognizedMusic|null;musicActive:boolean;lastMusicEvidenceAtMs:number|null;discussionReady:LiaRecognizedMusic|null};

export function createLiaMusicPresenceState():LiaMusicPresenceState{return{track:null,musicActive:false,lastMusicEvidenceAtMs:null,discussionReady:null};}

export function noteLiaMusicMatch(state:LiaMusicPresenceState,track:LiaRecognizedMusic,atMs=track.matchedAtMs):LiaMusicPresenceState{
  return{...state,track:{...track,matchedAtMs:atMs},musicActive:true,lastMusicEvidenceAtMs:atMs,discussionReady:null};
}

export function noteLiaMusicAudioEvidence(state:LiaMusicPresenceState,isMusic:boolean,atMs:number,silenceMs=6500):LiaMusicPresenceState{
  if(isMusic)return{...state,musicActive:true,lastMusicEvidenceAtMs:atMs,discussionReady:null};
  if(!state.musicActive||!state.track||state.lastMusicEvidenceAtMs===null)return state;
  if(atMs-state.lastMusicEvidenceAtMs<silenceMs)return state;
  return{...state,musicActive:false,discussionReady:state.track};
}

export function liaMaySpeakDuringMusic(input:{musicActive:boolean;directlyAddressed:boolean;userExplicitlyRequestedComment:boolean;overrideAllowsInterruption?:boolean}):boolean{
  if(!input.musicActive)return true;
  return input.directlyAddressed||input.userExplicitlyRequestedComment||Boolean(input.overrideAllowsInterruption);
}
