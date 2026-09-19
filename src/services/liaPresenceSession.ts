import type {LiaResolvedTableTurn} from './liaTableSpeechAdapter';
import {liaSpeakerIdentityPolicy} from './liaSpeakerIdentityPolicy';

export type LiaPresenceIdentity={
  trackId:string;
  memberId:string|null;
  displayName:string|null;
  confidence:number;
  identifiedExplicitly:boolean;
  lastHeardAt:number;
};

export type LiaPresenceSession={
  speakers:Record<string,LiaPresenceIdentity>;
  pendingIdentityTrackId:string|null;
  lastIdentityQuestionAt:number|null;
};

export function createLiaPresenceSession():LiaPresenceSession{
  return{speakers:{},pendingIdentityTrackId:null,lastIdentityQuestionAt:null};
}

export function observeLiaSpeaker(input:{
  session:LiaPresenceSession;
  turn:LiaResolvedTableTurn;
  displayName?:string|null;
  now?:number;
  context?:'table'|'cooking';
}):LiaPresenceSession{
  const now=input.now??Date.now();
  const known=liaSpeakerIdentityPolicy({
    memberId:input.turn.memberId,
    identityConfidence:input.turn.identityConfidence,
    context:input.context??'table',
  }).known;
  const previous=input.session.speakers[input.turn.speakerTrackId];
  return{
    ...input.session,
    speakers:{
      ...input.session.speakers,
      [input.turn.speakerTrackId]:{
        trackId:input.turn.speakerTrackId,
        memberId:known?input.turn.memberId:(previous?.memberId??null),
        displayName:known?(input.displayName??previous?.displayName??null):(previous?.displayName??null),
        confidence:known?input.turn.identityConfidence:(previous?.confidence??0),
        identifiedExplicitly:previous?.identifiedExplicitly??false,
        lastHeardAt:now,
      },
    },
    pendingIdentityTrackId:known?input.session.pendingIdentityTrackId:input.turn.speakerTrackId,
  };
}

export function shouldAskWhoIsSpeaking(input:{
  session:LiaPresenceSession;
  trackId:string;
  context:'table'|'cooking';
  now?:number;
  minGapMs?:number;
}):boolean{
  const speaker=input.session.speakers[input.trackId];
  if(speaker?.memberId&&speaker.confidence>=.9)return false;
  const now=input.now??Date.now();
  const gap=input.minGapMs??45_000;
  return input.session.lastIdentityQuestionAt===null||now-input.session.lastIdentityQuestionAt>=gap;
}

export function markIdentityQuestionAsked(session:LiaPresenceSession,trackId:string,now=Date.now()):LiaPresenceSession{
  return{...session,pendingIdentityTrackId:trackId,lastIdentityQuestionAt:now};
}

export function identifyPendingSpeaker(input:{
  session:LiaPresenceSession;
  memberId:string;
  displayName:string;
  now?:number;
}):LiaPresenceSession{
  const trackId=input.session.pendingIdentityTrackId;
  if(!trackId)return input.session;
  const previous=input.session.speakers[trackId];
  return{
    ...input.session,
    pendingIdentityTrackId:null,
    speakers:{
      ...input.session.speakers,
      [trackId]:{
        trackId,
        memberId:input.memberId,
        displayName:input.displayName.trim(),
        confidence:1,
        identifiedExplicitly:true,
        lastHeardAt:input.now??previous?.lastHeardAt??Date.now(),
      },
    },
  };
}

export function speakerForPersonalMemory(session:LiaPresenceSession,trackId:string):LiaPresenceIdentity|null{
  const speaker=session.speakers[trackId];
  if(!speaker?.memberId||speaker.confidence<.9)return null;
  return speaker;
}
