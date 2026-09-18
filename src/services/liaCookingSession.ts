export type LiaCookingApproximationRequest={
  recipeTitle:string;
  ingredientName:string;
  targetServings:number|null;
  baseServings:number|null;
  recordedQuantity:number|null;
  recordedUnit:string|null;
  reason:'missing_base_servings'|'missing_quantity';
};

export type LiaCookingSessionVoiceResult={
  handled:boolean;
  spokenReply:string|null;
  clarificationPending?:boolean;
  approximationRequest?:LiaCookingApproximationRequest;
};

type Handler=(text:string,languageTag:string)=>LiaCookingSessionVoiceResult|Promise<LiaCookingSessionVoiceResult>;
let handler:Handler|null=null;
let clearHandlerClarification:(()=>void)|null=null;
let clarificationPending=false;

export function setLiaCookingSessionVoiceHandler(next:Handler,clearClarification?:()=>void):()=>void{
  handler=next;
  clearHandlerClarification=clearClarification??null;
  return()=>{
    if(handler===next){
      handler=null;
      clearHandlerClarification=null;
      clarificationPending=false;
    }
  };
}
export function liaCookingSessionActive():boolean{return Boolean(handler);}
export function liaCookingSessionClarificationPending():boolean{return clarificationPending;}
export function clearLiaCookingSessionClarification():void{
  clarificationPending=false;
  clearHandlerClarification?.();
}
export async function runLiaCookingSessionVoiceCommand(text:string,languageTag:string):Promise<LiaCookingSessionVoiceResult>{
  const result=handler?await handler(text,languageTag):{handled:false,spokenReply:null};
  clarificationPending=Boolean(result.clarificationPending);
  return result;
}
