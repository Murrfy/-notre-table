import {LiaTableDialogueState} from './liaTableDialogueState';

export type LiaTableSilenceDecision='wait_for_reply'|'may_participate';

export function liaTableSilenceDecision(input:{
  dialogue:LiaTableDialogueState;
  now:number;
  humanSpeechActive:boolean;
}):LiaTableSilenceDecision{
  if(input.humanSpeechActive)return'wait_for_reply';
  const q=input.dialogue.openQuestion;
  if(q&&!q.closed&&input.now-q.askedAt<=60_000)return'wait_for_reply';
  return'may_participate';
}
