import {LiaTableInterventionHistory,liaTableRhythmFromHistory} from './liaTableInterventionHistory';
import {LiaResolvedTableTurn} from './liaTableSpeechAdapter';

export type LiaTableParticipationInput={
  turn:LiaResolvedTableTurn;
  topicUnderstood:boolean;
  contributionUseful:boolean;
  sensitive:boolean;
  humanSpeechActive:boolean;
  naturalGapMs:number;
  interventionsLast20Min:number;
  msSinceLastTopicContribution:number;
};

export type LiaTableParticipationDecision={
  action:'speak'|'hold';
  useMemberName:boolean;
  reason:'useful_gap'|'sensitive'|'human_speaking'|'unclear'|'too_soon'|'rate_limit';
};

export function decideLiaTableParticipation(input:LiaTableParticipationInput):LiaTableParticipationDecision{
  const useMemberName=input.turn.mayUseMemberName;
  if(input.sensitive)return{action:'hold',useMemberName:false,reason:'sensitive'};
  if(input.humanSpeechActive)return{action:'hold',useMemberName:false,reason:'human_speaking'};
  if(!input.topicUnderstood||!input.contributionUseful)return{action:'hold',useMemberName,reason:'unclear'};
  if(input.naturalGapMs<1800||input.msSinceLastTopicContribution<120000)
    return{action:'hold',useMemberName,reason:'too_soon'};
  if(input.interventionsLast20Min>=3)return{action:'hold',useMemberName,reason:'rate_limit'};
  return{action:'speak',useMemberName,reason:'useful_gap'};
}


export function decideDirectLiaTableReply(input:{
  turn:LiaResolvedTableTurn;
  directlyAddressed:boolean;
  speechUnderstood:boolean;
  sensitive:boolean;
  humanSpeechActive:boolean;
}):LiaTableParticipationDecision{
  if(input.sensitive)return{action:'hold',useMemberName:false,reason:'sensitive'};
  if(input.humanSpeechActive)return{action:'hold',useMemberName:false,reason:'human_speaking'};
  if(!input.directlyAddressed||!input.speechUnderstood)
    return{action:'hold',useMemberName:input.turn.mayUseMemberName,reason:'unclear'};
  return{action:'speak',useMemberName:input.turn.mayUseMemberName,reason:'useful_gap'};
}


export function decideLiaTableParticipationWithHistory(input:{
  turn:LiaResolvedTableTurn;
  topicKey:string|null;
  now:number;
  history:LiaTableInterventionHistory;
  topicUnderstood:boolean;
  contributionUseful:boolean;
  sensitive:boolean;
  humanSpeechActive:boolean;
  naturalGapMs:number;
}):LiaTableParticipationDecision{
  const rhythm=liaTableRhythmFromHistory(input.history,input.now,input.topicKey);
  return decideLiaTableParticipation({
    turn:input.turn,
    topicUnderstood:input.topicUnderstood,
    contributionUseful:input.contributionUseful,
    sensitive:input.sensitive,
    humanSpeechActive:input.humanSpeechActive,
    naturalGapMs:input.naturalGapMs,
    ...rhythm,
  });
}
