import {LiaResolvedTableTurn} from './liaTableSpeechAdapter';
import {detectLiaDirectAddress} from './liaDirectAddress';
import {createLiaTableInterventionHistory,noteLiaTableIntervention} from './liaTableInterventionHistory';
import {createLiaTableTopicState,updateLiaTableTopic} from './liaTableTopicTracker';
import {startLiaTableConversationRuntime,LiaTableConversationRuntime} from './liaTableConversationRuntime';
import {
  decideLiaTableParticipation,
  decideLiaTableParticipationWithHistory,
  decideDirectLiaTableReply,
  LiaTableParticipationDecision,
} from './liaTableParticipationRuntime';

export type LiaLiveTableContext=(turn:LiaResolvedTableTurn)=>Omit<
  Parameters<typeof decideLiaTableParticipation>[0],
  'turn'|'interventionsLast20Min'|'msSinceLastTopicContribution'
>;

export async function startLiaTableLiveCoordinator(input:{
  contextForTurn:LiaLiveTableContext;
  directCallForTurn?:(turn:LiaResolvedTableTurn)=>{directlyAddressed:boolean;speechUnderstood:boolean;sensitive:boolean;humanSpeechActive:boolean};
  topicKeyForTurn?:(turn:LiaResolvedTableTurn)=>string|null;
  onEligibleTurn:(turn:LiaResolvedTableTurn,decision:LiaTableParticipationDecision)=>void;
  onError?:(error:Error)=>void;
}):Promise<LiaTableConversationRuntime|null>{
  let interventionHistory=createLiaTableInterventionHistory();
  let topicState=createLiaTableTopicState();
  return startLiaTableConversationRuntime({
    onError:input.onError,
    onTurn:(turn)=>{
      const detected=detectLiaDirectAddress(turn.text);
      const direct=input.directCallForTurn?.(turn)??{
        directlyAddressed:detected.addressed,
        speechUnderstood:turn.speechConfidence>=.8,
        sensitive:false,
        humanSpeechActive:false,
      };
      const now=Date.now();
      topicState=updateLiaTableTopic({state:topicState,turn,now});
      const topicKey=input.topicKeyForTurn?.(turn)??topicState.key;
      const decision=direct.directlyAddressed
        ?decideDirectLiaTableReply({turn,...direct})
        :decideLiaTableParticipationWithHistory({
          turn,
          ...input.contextForTurn(turn),
          topicKey,
          now,
          history:interventionHistory,
        });
      if(decision.action==='speak'){
        interventionHistory=noteLiaTableIntervention(interventionHistory,{
          at:now,
          topicKey,
          direct:direct.directlyAddressed,
        });
        input.onEligibleTurn(turn,decision);
      }
    },
  });
}
