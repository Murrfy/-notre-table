import {LiaTableIntentDecision} from './liaTableIntentRouter';

export type LiaTableActionPlan={
  step:'reply'|'clarify'|'research'|'prepare'|'await_confirmation'|'stay_silent';
  mayExecuteExternally:boolean;
};

export function buildLiaTableActionPlan(input:{
  intent:LiaTableIntentDecision;
  organizerApprovedExternalAction:boolean;
}):LiaTableActionPlan{
  switch(input.intent.intent){
    case'listen_only':return{step:'stay_silent',mayExecuteExternally:false};
    case'clarify':return{step:'clarify',mayExecuteExternally:false};
    case'research':return{step:'research',mayExecuteExternally:false};
    case'answer_now':return{step:'reply',mayExecuteExternally:false};
    case'reminder':
    case'prepare_action':
      return input.organizerApprovedExternalAction
        ?{step:'prepare',mayExecuteExternally:true}
        :{step:'await_confirmation',mayExecuteExternally:false};
  }
}
