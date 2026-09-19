import {liaSpeakerIdentityPolicy} from './liaSpeakerIdentityPolicy';
export type LiaTableSpeechSegment={
  text:string;
  startedAt:number;
  endedAt:number;
  speakerTrackId:string;
  confidence:number;
  overlappingSpeech?:boolean;
};

export type LiaTableSpeakerIdentity={
  memberId:string|null;
  confidence:number;
};

export interface LiaTableSpeechAdapter{
  isAvailable():boolean;
  startSession(input:{
    onSegment:(segment:LiaTableSpeechSegment)=>void;
    onSpeakerIdentity?:(trackId:string,identity:LiaTableSpeakerIdentity)=>void;
    onError?:(error:Error)=>void;
  }):Promise<void>;
  stopSession():Promise<void>;
}

let adapter:LiaTableSpeechAdapter|null=null;

export function registerLiaTableSpeechAdapter(next:LiaTableSpeechAdapter|null):void{
  adapter=next;
}

export function getLiaTableSpeechAdapter():LiaTableSpeechAdapter|null{
  return adapter?.isAvailable()?adapter:null;
}

export function liaTableSpeechAvailable():boolean{
  return !!getLiaTableSpeechAdapter();
}


export type LiaResolvedTableTurn={
  text:string;
  speakerTrackId:string;
  memberId:string|null;
  identityConfidence:number;
  speechConfidence:number;
  mayUseMemberName:boolean;
};

export function liaResolveTableSpeechTurn(
  segment:LiaTableSpeechSegment,
  identity:LiaTableSpeakerIdentity|null
):LiaResolvedTableTurn{
  const identityConfidence=identity?.confidence??0;
  const memberId=identity?.memberId??null;
  return{
    text:segment.text.trim(),
    speakerTrackId:segment.speakerTrackId,
    memberId,
    identityConfidence,
    speechConfidence:segment.confidence,
    mayUseMemberName:liaSpeakerIdentityPolicy({memberId,identityConfidence,overlappingSpeech:segment.overlappingSpeech,context:'table'}).mayUseName,
  };
}
