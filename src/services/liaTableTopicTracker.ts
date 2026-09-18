import {LiaResolvedTableTurn} from './liaTableSpeechAdapter';

export type LiaTableTopicState={
  key:string|null;
  lastMeaningfulText:string|null;
  lastSpeakerTrackId:string|null;
  updatedAt:number;
};

export function createLiaTableTopicState():LiaTableTopicState{
  return{key:null,lastMeaningfulText:null,lastSpeakerTrackId:null,updatedAt:0};
}

function normalizedTopicKey(text:string):string{
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\p{L}\p{N}\s]/gu,' ')
    .trim().split(/\s+/).slice(0,6).join('_');
}

export function updateLiaTableTopic(input:{
  state:LiaTableTopicState;
  turn:LiaResolvedTableTurn;
  now:number;
}):LiaTableTopicState{
  const text=input.turn.text.trim();
  const shortContinuation=/^(oui|non|vas-y|d'accord|ok|ça|ca|celui-là|celle-là)$/i.test(text);
  const sameSpeaker=input.state.lastSpeakerTrackId===input.turn.speakerTrackId;
  const fresh=input.now-input.state.updatedAt<=5*60*1000;
  if(shortContinuation&&sameSpeaker&&fresh&&input.state.key)return{...input.state,updatedAt:input.now};
  const key=normalizedTopicKey(text)||input.state.key;
  return{key,lastMeaningfulText:text||input.state.lastMeaningfulText,lastSpeakerTrackId:input.turn.speakerTrackId,updatedAt:input.now};
}


export function mayAttachCrossSpeakerContinuation(input:{
  state:LiaTableTopicState;
  turn:LiaResolvedTableTurn;
  now:number;
  addressedToGroupOrLia:boolean;
}):boolean{
  const text=input.turn.text.trim();
  const short=/^(oui|non|vas-y|d'accord|ok|ça|ca|celui-là|celle-là)$/i.test(text);
  const fresh=input.now-input.state.updatedAt<=30_000;
  return !!input.state.key&&short&&fresh&&input.addressedToGroupOrLia;
}
