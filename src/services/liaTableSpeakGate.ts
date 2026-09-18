export function maySpeakGeneratedTableResponse(input:{
  responseReady:boolean;
  sensitive:boolean;
  humanSpeechActive:boolean;
  liaAlreadySpeaking:boolean;
  sessionStillActive:boolean;
}):boolean{
  return input.responseReady
    &&!input.sensitive
    &&!input.humanSpeechActive
    &&!input.liaAlreadySpeaking
    &&input.sessionStillActive;
}
