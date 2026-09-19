export type LiaSpeakerIdentityPolicyInput={
  memberId:string|null;
  identityConfidence:number;
  overlappingSpeech?:boolean;
  context:'table'|'cooking'|'general';
  urgentPracticalQuestion?:boolean;
};

export type LiaSpeakerIdentityPolicy={
  known:boolean;
  mayUseName:boolean;
  mayAttributeMemory:boolean;
  shouldAskIdentity:boolean;
  answerBeforeIdentityQuestion:boolean;
};

export function liaSpeakerIdentityPolicy(input:LiaSpeakerIdentityPolicyInput):LiaSpeakerIdentityPolicy{
  const known=Boolean(input.memberId)&&input.identityConfidence>=.9&&!input.overlappingSpeech;
  const socialContext=input.context==='table'||input.context==='cooking';
  return{
    known,
    mayUseName:known,
    mayAttributeMemory:known,
    shouldAskIdentity:socialContext&&!known,
    answerBeforeIdentityQuestion:Boolean(input.urgentPracticalQuestion),
  };
}

export function liaUnknownSpeakerQuestion(languageTag:string):string{
  if(languageTag.toLowerCase().startsWith('fr'))return 'Au fait, qui me parle ?';
  if(languageTag.toLowerCase().startsWith('he'))return 'אגב, מי מדבר איתי?';
  return 'By the way, who am I speaking with?';
}

export function liaMayPersistSpeakerFact(input:LiaSpeakerIdentityPolicyInput):boolean{
  return liaSpeakerIdentityPolicy(input).mayAttributeMemory;
}