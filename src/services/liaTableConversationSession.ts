import {
  LiaResolvedTableTurn,
  LiaTableSpeakerIdentity,
  LiaTableSpeechSegment,
  liaResolveTableSpeechTurn,
} from './liaTableSpeechAdapter';

export type LiaTableSpeakerTrack={
  trackId:string;
  memberId:string|null;
  identityConfidence:number;
  lastHeardAt:number;
};

export type LiaTableConversationSession={
  startedAt:number;
  tracks:Record<string,LiaTableSpeakerTrack>;
  recentTurns:LiaResolvedTableTurn[];
};

export function createLiaTableConversationSession(now=Date.now()):LiaTableConversationSession{
  return{startedAt:now,tracks:{},recentTurns:[]};
}

export function applyLiaTableSpeechSegment(input:{
  session:LiaTableConversationSession;
  segment:LiaTableSpeechSegment;
  identity:LiaTableSpeakerIdentity|null;
  maxRecentTurns?:number;
}):LiaTableConversationSession{
  const turn=liaResolveTableSpeechTurn(input.segment,input.identity);
  const max=Math.max(1,input.maxRecentTurns??24);
  return{
    ...input.session,
    tracks:{
      ...input.session.tracks,
      [turn.speakerTrackId]:{
        trackId:turn.speakerTrackId,
        memberId:turn.memberId,
        identityConfidence:turn.identityConfidence,
        lastHeardAt:input.segment.endedAt,
      },
    },
    recentTurns:[...input.session.recentTurns,turn].slice(-max),
  };
}


export function pruneInactiveTableTracks(
  session:LiaTableConversationSession,
  now:number,
  inactiveAfterMs=15*60*1000
):LiaTableConversationSession{
  const tracks=Object.fromEntries(
    Object.entries(session.tracks).filter(([,track])=>now-track.lastHeardAt<=inactiveAfterMs)
  );
  return{...session,tracks};
}

export function confirmTableSpeakerIdentity(input:{
  session:LiaTableConversationSession;
  trackId:string;
  memberId:string;
  confidence?:number;
}):LiaTableConversationSession{
  const current=input.session.tracks[input.trackId];
  if(!current)return input.session;
  const confidence=Math.max(.9,Math.min(1,input.confidence??1));
  return{
    ...input.session,
    tracks:{
      ...input.session.tracks,
      [input.trackId]:{...current,memberId:input.memberId,identityConfidence:confidence},
    },
    recentTurns:input.session.recentTurns.map(turn=>turn.speakerTrackId===input.trackId
      ?{...turn,memberId:input.memberId,identityConfidence:confidence,mayUseMemberName:true}
      :turn),
  };
}

export function activeTableMemberIds(session:LiaTableConversationSession):string[]{
  return [...new Set(
    Object.values(session.tracks)
      .filter(track=>!!track.memberId&&track.identityConfidence>=.9)
      .map(track=>track.memberId as string)
  )];
}


export function clearLiaTableConversationSession(now=Date.now()):LiaTableConversationSession{
  // Raw table speech is deliberately session-only: no transcript or speaker track survives stop/background.
  return{startedAt:now,tracks:{},recentTurns:[]};
}
