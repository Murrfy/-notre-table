import {
  LiaOpenTableQuestion,
  closeLiaOpenTableQuestion,
  liaOpenTableQuestionMayAcceptReply,
} from './liaOpenTableQuestion';

export type LiaTableDialogueState={
  openQuestion:LiaOpenTableQuestion|null;
  lastResolvedQuestionId:string|null;
};

export function createLiaTableDialogueState():LiaTableDialogueState{
  return{openQuestion:null,lastResolvedQuestionId:null};
}

export function openLiaTableQuestion(
  state:LiaTableDialogueState,
  question:LiaOpenTableQuestion
):LiaTableDialogueState{
  return{...state,openQuestion:{...question,closed:false}};
}

export function consumeLiaTableQuestionReply(input:{
  state:LiaTableDialogueState;
  now:number;
  replyingMemberId:string|null;
}):{state:LiaTableDialogueState;accepted:boolean}{
  const q=input.state.openQuestion;
  if(!liaOpenTableQuestionMayAcceptReply({question:q,now:input.now,replyingMemberId:input.replyingMemberId}))
    return{state:input.state,accepted:false};
  const closed=closeLiaOpenTableQuestion(q!);
  return{
    accepted:true,
    state:{openQuestion:closed,lastResolvedQuestionId:closed.id},
  };
}


export function expireLiaTableQuestion(
  state:LiaTableDialogueState,
  now:number,
  ttlMs=60_000
):LiaTableDialogueState{
  const q=state.openQuestion;
  if(!q||q.closed||now-q.askedAt<=ttlMs)return state;
  return{...state,openQuestion:closeLiaOpenTableQuestion(q)};
}
