import {LiaResolvedTableTurn} from './liaTableSpeechAdapter';

export type LiaTableIntent=
  'answer_now'|'research'|'reminder'|'prepare_action'|'listen_only'|'clarify';

export type LiaTableIntentDecision={
  intent:LiaTableIntent;
  confidence:number;
  requiresExternalAction:boolean;
};

export function routeLiaTableIntent(input:{
  turn:LiaResolvedTableTurn;
  topicUnderstood:boolean;
  explicitResearchRequest:boolean;
  explicitReminderRequest:boolean;
  explicitActionRequest:boolean;
  sensitive:boolean;
}):LiaTableIntentDecision{
  if(input.sensitive)return{intent:'listen_only',confidence:1,requiresExternalAction:false};
  if(!input.topicUnderstood||input.turn.speechConfidence<.75)
    return{intent:'clarify',confidence:Math.min(input.turn.speechConfidence,.74),requiresExternalAction:false};
  if(input.explicitReminderRequest)return{intent:'reminder',confidence:.98,requiresExternalAction:true};
  if(input.explicitResearchRequest)return{intent:'research',confidence:.96,requiresExternalAction:false};
  if(input.explicitActionRequest)return{intent:'prepare_action',confidence:.95,requiresExternalAction:true};
  return{intent:'answer_now',confidence:Math.max(.8,input.turn.speechConfidence),requiresExternalAction:false};
}
