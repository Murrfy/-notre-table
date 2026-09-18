import {
  LiaMealPollResponse,
  LiaMealChoiceCount,
  LiaMealPollSummary,
  liaSummarizeMealPoll,
  liaCountMealChoices,
  liaMealResolutionSuggestion,
  LiaMealResolutionSuggestion,
  LiaMealReplyDelivery,
  liaMealReplyDelivery,
  liaMealOrderNextStep,
  LiaMealOrderNextStep,
  liaMealExecutionBrief,
  LiaMealExecutionBrief,
} from '../lib/liaSocialPresence';

export type LiaMealConversationSnapshot={
  summary:LiaMealPollSummary;
  counts:LiaMealChoiceCount[];
  resolution:LiaMealResolutionSuggestion;
  delivery:LiaMealReplyDelivery;
  nextStep:LiaMealOrderNextStep;
  execution:LiaMealExecutionBrief;
};

export function buildLiaMealConversationSnapshot(input:{
  responses:LiaMealPollResponse[];
  oneProviderCanCoverTopChoices:boolean;
  organizerAskedForSuggestion:boolean;
  pendingNewReplies:number;
  humanSpeechActive:boolean;
  msSinceLastLiaIntervention:number;
  organizerDecision:'order'|'cook'|'undecided';
  missingItems:string[];
}):LiaMealConversationSnapshot{
  const summary=liaSummarizeMealPoll(input.responses);
  const counts=liaCountMealChoices(input.responses);
  return{
    summary,
    counts,
    resolution:liaMealResolutionSuggestion({
      counts,
      oneProviderCanCoverTopChoices:input.oneProviderCanCoverTopChoices,
      organizerAskedForSuggestion:input.organizerAskedForSuggestion,
    }),
    delivery:liaMealReplyDelivery({
      pendingNewReplies:input.pendingNewReplies,
      humanSpeechActive:input.humanSpeechActive,
      msSinceLastLiaIntervention:input.msSinceLastLiaIntervention,
    }),
    nextStep:liaMealOrderNextStep({
      organizerDecision:input.organizerDecision,
      mealChoicesKnown:counts.length>0,
    }),
    execution:liaMealExecutionBrief({
      attendingCount:summary.comingMemberIds.length,
      selectedChoices:counts.map(x=>x.choice),
      cookingChosen:input.organizerDecision==='cook',
      orderingChosen:input.organizerDecision==='order',
      missingItems:input.missingItems,
    }),
  };
}


export type LiaMealConversationTurn={
  kind:'reply_update'|'family_summary'|'decision_prompt'|'execution_update'|'none';
  shouldSpeak:boolean;
  memberIds:string[];
  choices:LiaMealChoiceCount[];
};

export function buildLiaMealConversationTurn(input:{
  snapshot:LiaMealConversationSnapshot;
  newReplyMemberIds:string[];
  decisionStillNeeded:boolean;
}):LiaMealConversationTurn{
  if(input.snapshot.delivery==='announce_one'||input.snapshot.delivery==='bundle_updates'){
    return{
      kind:'reply_update',
      shouldSpeak:true,
      memberIds:input.newReplyMemberIds,
      choices:input.snapshot.counts,
    };
  }
  if(input.decisionStillNeeded&&input.snapshot.counts.length>0){
    return{
      kind:'decision_prompt',
      shouldSpeak:true,
      memberIds:input.snapshot.summary.comingMemberIds,
      choices:input.snapshot.counts,
    };
  }
  if(input.snapshot.execution.nextAction!=='wait'){
    return{
      kind:'execution_update',
      shouldSpeak:true,
      memberIds:input.snapshot.summary.comingMemberIds,
      choices:input.snapshot.counts,
    };
  }
  return{kind:'none',shouldSpeak:false,memberIds:[],choices:[]};
}


export type LiaMealSpokenContext={
  memberNames:Record<string,string>;
  turn:LiaMealConversationTurn;
};

export function liaMealSpokenNames(input:LiaMealSpokenContext):string[]{
  return input.turn.memberIds
    .map(id=>input.memberNames[id])
    .filter((name):name is string=>!!name);
}

export function liaMealTurnNeedsNaturalLanguage(turn:LiaMealConversationTurn):boolean{
  return turn.shouldSpeak&&turn.kind!=='none';
}


export type LiaMealSpeechPlan={
  opening:'update'|'summary'|'decision'|'execution';
  mentionNames:string[];
  mentionCounts:boolean;
  mentionPending:boolean;
  offerCompromise:boolean;
  keepBrief:boolean;
};

export function buildLiaMealSpeechPlan(input:{
  turn:LiaMealConversationTurn;
  names:string[];
  pendingCount:number;
  resolution:LiaMealResolutionSuggestion;
}):LiaMealSpeechPlan|null{
  if(!input.turn.shouldSpeak||input.turn.kind==='none')return null;
  const opening=
    input.turn.kind==='reply_update'?'update':
    input.turn.kind==='decision_prompt'?'decision':
    input.turn.kind==='execution_update'?'execution':'summary';
  return{
    opening,
    mentionNames:input.names,
    mentionCounts:input.turn.choices.length>0,
    mentionPending:input.pendingCount>0,
    offerCompromise:input.resolution==='combine_order',
    keepBrief:true,
  };
}


export type LiaMealAnnouncementFingerprint={
  coming:number;
  notComing:number;
  pending:number;
  choiceSignature:string;
};

export function liaMealAnnouncementFingerprint(summary:LiaMealPollSummary,counts:LiaMealChoiceCount[]):LiaMealAnnouncementFingerprint{
  return{
    coming:summary.comingMemberIds.length,
    notComing:summary.notComingMemberIds.length,
    pending:summary.pendingMemberIds.length,
    choiceSignature:counts.map(x=>`${x.choice}:${x.count}`).join('|'),
  };
}

export function liaMealAnnouncementChanged(a:LiaMealAnnouncementFingerprint|null,b:LiaMealAnnouncementFingerprint):boolean{
  if(!a)return true;
  return a.coming!==b.coming
    ||a.notComing!==b.notComing
    ||a.pending!==b.pending
    ||a.choiceSignature!==b.choiceSignature;
}


export type LiaMealConversationCompleteness='ready_to_act'|'needs_decision'|'waiting_replies';

export function liaMealConversationCompleteness(input:{
  attendingCount:number;
  pendingCount:number;
  choicesKnown:boolean;
  organizerDecision:'order'|'cook'|'undecided';
  pendingMembersCanUseFamilyDefault:boolean;
}):LiaMealConversationCompleteness{
  if(input.pendingCount>0&&!input.pendingMembersCanUseFamilyDefault)return'waiting_replies';
  if(input.attendingCount===0&&!input.pendingMembersCanUseFamilyDefault)return'waiting_replies';
  if(!input.choicesKnown||input.organizerDecision==='undecided')return'needs_decision';
  return'ready_to_act';
}


export type LiaMealActionConfirmation='confirm_external_action'|'proceed_internal'|'wait';

export function liaMealActionConfirmation(input:{
  completeness:LiaMealConversationCompleteness;
  nextAction:'cook'|'order'|'shop'|'wait';
  causesExternalCommitment:boolean;
}):LiaMealActionConfirmation{
  if(input.completeness!=='ready_to_act'||input.nextAction==='wait')return'wait';
  if(input.causesExternalCommitment)return'confirm_external_action';
  return'proceed_internal';
}


export type LiaLateMealChangeAction=
  'update_before_commitment'|'offer_add_on'|'inform_only'|'ignore_duplicate';

export function liaLateMealChangeAction(input:{
  replyActuallyChanged:boolean;
  externalActionConfirmed:boolean;
  compatibleAddOnVerified:boolean;
}):LiaLateMealChangeAction{
  if(!input.replyActuallyChanged)return'ignore_duplicate';
  if(!input.externalActionConfirmed)return'update_before_commitment';
  if(input.compatibleAddOnVerified)return'offer_add_on';
  return'inform_only';
}


export type LiaOrganizerQuestionDecision='ask'|'state_plan'|'act_without_question';

export function liaShouldAskOrganizer(input:{
  consequence:'low'|'medium'|'high';
  confidence:number;
  establishedFamilyPattern:boolean;
  reversible:boolean;
  externalCommitment:boolean;
}):LiaOrganizerQuestionDecision{
  if(input.externalCommitment||input.consequence==='high')return'ask';
  if(input.confidence<.9)return'ask';
  if(input.establishedFamilyPattern&&input.consequence==='low'){
    return input.reversible?'act_without_question':'state_plan';
  }
  return'state_plan';
}
