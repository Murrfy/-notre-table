export type LiaCookingApproximationItem={name:string;quantity:number|null;unit:string|null};

export type LiaCookingApproximationRequest={
  scope:'ingredient'|'ingredient_list';
  recipeTitle:string;
  ingredientName:string;
  targetServings:number|null;
  baseServings:number|null;
  recordedQuantity:number|null;
  recordedUnit:string|null;
  ingredients?:LiaCookingApproximationItem[];
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
let followupUntilMs=0;

export function setLiaCookingSessionVoiceHandler(next:Handler,clearClarification?:()=>void):()=>void{
  handler=next;
  clearHandlerClarification=clearClarification??null;
  return()=>{
    if(handler===next){
      handler=null;
      clearHandlerClarification=null;
      clarificationPending=false;
      followupUntilMs=0;
    }
  };
}
export function liaCookingSessionActive():boolean{return Boolean(handler);}
export function liaCookingSessionClarificationPending():boolean{return clarificationPending;}
export function liaCookingSessionFollowupActive(nowMs=Date.now()):boolean{return Boolean(handler)&&followupUntilMs>=nowMs;}
export function markLiaCookingSessionFollowupWindow(windowMs=120_000):void{followupUntilMs=Date.now()+Math.max(1,windowMs);}
export function clearLiaCookingSessionClarification():void{
  clarificationPending=false;
  followupUntilMs=0;
  clearHandlerClarification?.();
}
export async function runLiaCookingSessionVoiceCommand(text:string,languageTag:string):Promise<LiaCookingSessionVoiceResult>{
  followupUntilMs=0;
  const result=handler?await handler(text,languageTag):{handled:false,spokenReply:null};
  clarificationPending=Boolean(result.clarificationPending);
  return result;
}
