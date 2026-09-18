import {LiaTableTurnPipelineResult} from './liaTableTurnPipeline';

export type LiaTableCommand=
  |{type:'reply';text:string}
  |{type:'clarify';text:string}
  |{type:'research';query:string}
  |{type:'reminder';request:string}
  |{type:'prepare_action';request:string}
  |{type:'none'};

export function buildLiaTableCommand(input:{
  recognizedText:string;
  pipeline:LiaTableTurnPipelineResult;
}):LiaTableCommand{
  const text=input.recognizedText.trim();
  switch(input.pipeline.plan.step){
    case'reply':return{type:'reply',text};
    case'clarify':return{type:'clarify',text};
    case'research':return{type:'research',query:text};
    case'prepare':
    case'await_confirmation':
      if(input.pipeline.intent.intent==='reminder')return{type:'reminder',request:text};
      return{type:'prepare_action',request:text};
    case'stay_silent':return{type:'none'};
  }
}
