import {LiaResolvedTableTurn} from './liaTableSpeechAdapter';
import {routeLiaTableIntent,LiaTableIntentDecision} from './liaTableIntentRouter';
import {buildLiaTableActionPlan,LiaTableActionPlan} from './liaTableActionPlan';
import {detectLiaTableRequestSignals} from './liaTableRequestSignals';

export type LiaTableTurnPipelineResult={
  intent:LiaTableIntentDecision;
  plan:LiaTableActionPlan;
};

export function processLiaTableTurn(input:{
  turn:LiaResolvedTableTurn;
  topicUnderstood:boolean;
  explicitResearchRequest:boolean;
  explicitReminderRequest:boolean;
  explicitActionRequest:boolean;
  sensitive:boolean;
  organizerApprovedExternalAction:boolean;
}):LiaTableTurnPipelineResult{
  const intent=routeLiaTableIntent(input);
  const plan=buildLiaTableActionPlan({
    intent,
    organizerApprovedExternalAction:input.organizerApprovedExternalAction,
  });
  return{intent,plan};
}


export function processLiaTableTurnFromSpeech(input:{
  turn:LiaResolvedTableTurn;
  topicUnderstood:boolean;
  sensitive:boolean;
  organizerApprovedExternalAction:boolean;
}):LiaTableTurnPipelineResult{
  const signals=detectLiaTableRequestSignals(input.turn.text);
  return processLiaTableTurn({
    ...input,
    explicitResearchRequest:signals.research,
    explicitReminderRequest:signals.reminder,
    explicitActionRequest:signals.action,
  });
}
