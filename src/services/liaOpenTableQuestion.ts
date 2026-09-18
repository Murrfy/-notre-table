export type LiaOpenTableQuestion={
  id:string;
  askedAt:number;
  targetMemberId:string|null;
  topicKey:string|null;
  closed:boolean;
};

export function liaOpenTableQuestionMayAcceptReply(input:{
  question:LiaOpenTableQuestion|null;
  now:number;
  replyingMemberId:string|null;
}):boolean{
  const q=input.question;
  if(!q||q.closed)return false;
  if(input.now-q.askedAt>60_000)return false;
  if(q.targetMemberId&&input.replyingMemberId&&q.targetMemberId!==input.replyingMemberId)return false;
  return true;
}

export function closeLiaOpenTableQuestion(question:LiaOpenTableQuestion):LiaOpenTableQuestion{
  return{...question,closed:true};
}
