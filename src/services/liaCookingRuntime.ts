import {applyLiaHandsFreeCookingAction,liaCookingVoiceReply,liaHandsFreeCookingAction,type LiaCookingRuntimeState} from '../lib/liaCookingCompanion';

export function runLiaCookingCommand(input:{
  text:string;
  state:LiaCookingRuntimeState;
  currentStep:string;
  nowMs:number;
}){
  const action=liaHandsFreeCookingAction(input.text);
  const timerRemainingSeconds=input.state.timerEndsAtMs===null?null:Math.max(0,Math.ceil((input.state.timerEndsAtMs-input.nowMs)/1000));
  const reply=liaCookingVoiceReply({
    action,
    currentStep:input.currentStep,
    stepIndex:input.state.stepIndex,
    stepCount:input.state.stepCount,
    timerRemainingSeconds,
  });
  const state=applyLiaHandsFreeCookingAction({state:input.state,action,nowMs:input.nowMs});
  return{action,reply,state};
}


export type LiaCookingSpeechAdapter={
  available:boolean;
  start:(onRecognizedText:(text:string)=>void)=>Promise<void>;
  stop:()=>Promise<void>;
};

export function createUnavailableCookingSpeechAdapter():LiaCookingSpeechAdapter{
  return{
    available:false,
    async start(){return;},
    async stop(){return;},
  };
}
