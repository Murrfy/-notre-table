export type LiaCookingSessionVoiceResult={handled:boolean;spokenReply:string|null};

type Handler=(text:string,languageTag:string)=>LiaCookingSessionVoiceResult;
let handler:Handler|null=null;

export function setLiaCookingSessionVoiceHandler(next:Handler):()=>void{
  handler=next;
  return()=>{if(handler===next)handler=null;};
}
export function liaCookingSessionActive():boolean{return Boolean(handler);}
export function runLiaCookingSessionVoiceCommand(text:string,languageTag:string):LiaCookingSessionVoiceResult{
  return handler?.(text,languageTag)??{handled:false,spokenReply:null};
}
