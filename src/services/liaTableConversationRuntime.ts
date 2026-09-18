import {
  getLiaTableSpeechAdapter,
  LiaResolvedTableTurn,
  LiaTableSpeakerIdentity,
} from './liaTableSpeechAdapter';
import {
  applyLiaTableSpeechSegment,
  createLiaTableConversationSession,
  clearLiaTableConversationSession,
  LiaTableConversationSession,
} from './liaTableConversationSession';

export type LiaTableConversationRuntime={
  stop:()=>Promise<void>;
  getSession:()=>LiaTableConversationSession;
};

export async function startLiaTableConversationRuntime(input:{
  onTurn?:(turn:LiaResolvedTableTurn,session:LiaTableConversationSession)=>void;
  onError?:(error:Error)=>void;
}={}):Promise<LiaTableConversationRuntime|null>{
  const adapter=getLiaTableSpeechAdapter();
  if(!adapter)return null;

  let session=createLiaTableConversationSession();
  const identities=new Map<string,LiaTableSpeakerIdentity>();

  await adapter.startSession({
    onSpeakerIdentity:(trackId,identity)=>identities.set(trackId,identity),
    onSegment:(segment)=>{
      session=applyLiaTableSpeechSegment({
        session,
        segment,
        identity:identities.get(segment.speakerTrackId)??null,
      });
      input.onTurn?.(session.recentTurns[session.recentTurns.length-1],session);
    },
    onError:input.onError,
  });

  let stopped=false;
  return{
    stop:async()=>{
      if(stopped)return;
      stopped=true;
      identities.clear();
      session=clearLiaTableConversationSession();
      await adapter.stopSession();
    },
    getSession:()=>session,
  };
}
