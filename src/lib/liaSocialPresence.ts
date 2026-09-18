import type {LiaSocialLevel,LiaSurfaceMode} from './lia';

export type LiaLaughterReaction='none'|'smile'|'chuckle'|'laugh';

export type LiaLaughterContext={
  sessionExplicitlyActive:boolean;
  microphoneConsent:boolean;
  localSoundClassifierAvailable:boolean;
  mode:LiaSurfaceMode;
  socialLevel:LiaSocialLevel;
  laughterConfidence:number;
  laughterIntensity:number;
  groupLaughter:boolean;
  directAddressed:boolean;
  humanSpeechActive:boolean;
  liaSpeaking:boolean;
  silenceAfterLaughterMs:number;
  msSinceLastReaction:number;
  reactionsLast10Minutes:number;
  sensitiveMoment:boolean;
};

const MIN_LAUGHTER_CONFIDENCE=.78;
const MIN_POST_LAUGHTER_SILENCE_MS=350;
const MIN_REACTION_COOLDOWN_MS=45_000;

function reactionBudget(level:LiaSocialLevel):number{
  if(level==='host')return 3;
  if(level==='present')return 2;
  return 0;
}

/**
 * Chooses whether LIA may share a brief laugh with the family.
 * Sound recognition is expected to happen locally on-device; this policy never
 * grants microphone access and never sends ambient audio to a cloud service.
 */
export function liaChooseLaughterReaction(input:LiaLaughterContext):LiaLaughterReaction{
  if(!input.sessionExplicitlyActive||!input.microphoneConsent||!input.localSoundClassifierAvailable)return 'none';
  if(input.mode==='idle'||input.sensitiveMoment)return 'none';
  if(input.humanSpeechActive||input.liaSpeaking)return 'none';
  if(input.laughterConfidence<MIN_LAUGHTER_CONFIDENCE)return 'none';
  if(input.silenceAfterLaughterMs<MIN_POST_LAUGHTER_SILENCE_MS)return 'none';
  if(input.msSinceLastReaction<MIN_REACTION_COOLDOWN_MS)return 'none';
  if(input.reactionsLast10Minutes>=reactionBudget(input.socialLevel))return 'none';

  const intensity=Math.max(0,Math.min(1,input.laughterIntensity));
  if(input.directAddressed&&intensity>=.58)return intensity>=.82?'laugh':'chuckle';
  if(input.socialLevel==='host'&&input.groupLaughter&&intensity>=.78)return 'laugh';
  if(input.socialLevel==='present'&&input.groupLaughter&&intensity>=.62)return 'chuckle';
  return 'none';
}

export function liaMustCancelQueuedSocialReaction(input:{humanSpeechActive:boolean;liaInterrupted:boolean;sessionExplicitlyActive:boolean}):boolean{
  return !input.sessionExplicitlyActive||input.humanSpeechActive||input.liaInterrupted;
}

export function liaSocialAudioMayStart(input:{sessionExplicitlyActive:boolean;microphoneConsent:boolean;mode:LiaSurfaceMode}):boolean{
  return input.sessionExplicitlyActive&&input.microphoneConsent&&input.mode!=='idle';
}

export const LIA_SOCIAL_AUDIO_POLICY={
  minLaughterConfidence:MIN_LAUGHTER_CONFIDENCE,
  minPostLaughterSilenceMs:MIN_POST_LAUGHTER_SILENCE_MS,
  minReactionCooldownMs:MIN_REACTION_COOLDOWN_MS,
  processing:'on_device' as const,
  ambientCloudUpload:false as const,
};


export type LiaTableInterventionKind='none'|'light_question'|'family_callback'|'meal_praise'|'activity_idea';
export type LiaTableInterventionContext={
  sessionExplicitlyActive:boolean;
  tone:'unknown'|'warm'|'neutral'|'tense'|'distress';
  humanSpeechActive:boolean;
  liaSpeaking:boolean;
  silenceMs:number;
  interventionsLast20Minutes:number;
  sensitiveConversation:boolean;
  hasHouseholdSafeCallback:boolean;
  mealFeedbackMoment:boolean;
  afterMeal:boolean;
};

/**
 * Table mode is intentionally conservative: family conversation is primary.
 * A long silence is allowed and never treated as a failure.
 */
export function chooseLiaTableIntervention(input:LiaTableInterventionContext):LiaTableInterventionKind{
  if(!input.sessionExplicitlyActive||input.humanSpeechActive||input.liaSpeaking||input.sensitiveConversation)return'none';
  if(input.tone==='unknown'||input.tone==='tense'||input.tone==='distress')return'none';
  if(input.interventionsLast20Minutes>=2)return'none';
  if(input.silenceMs<3000)return'none';
  if(input.mealFeedbackMoment)return'meal_praise';
  if(input.hasHouseholdSafeCallback&&input.tone==='warm')return'family_callback';
  if(input.afterMeal)return'activity_idea';
  return input.tone==='warm'?'light_question':'none';
}

export type LiaTableHumorCandidate={
  id:string;
  text:string;
  basedOnRealEvent:boolean;
  sensitivity:'ordinary'|'personal'|'sensitive';
  householdSafe:boolean;
  targetReactedPositivelyBefore:boolean;
  attacksBodyWeightHealth:boolean;
};

/** Humor at the table must be earned by real, safe family context. */
export function liaTableHumorAllowed(candidate:LiaTableHumorCandidate):boolean{
  return candidate.basedOnRealEvent&&
    candidate.sensitivity==='ordinary'&&
    candidate.householdSafe&&
    candidate.targetReactedPositivelyBefore&&
    !candidate.attacksBodyWeightHealth;
}

export type LiaTableAnecdoteCandidate={
  hasSpecificRealEvent:boolean;
  hasConcreteDetail:boolean;
  inventedOrInferred:boolean;
  sensitivity:'ordinary'|'personal'|'sensitive';
  householdSafe:boolean;
};

/** Vague or invented "anecdotes" are never acceptable social material. */
export function liaTableAnecdoteAllowed(input:LiaTableAnecdoteCandidate):boolean{
  return input.hasSpecificRealEvent&&input.hasConcreteDetail&&!input.inventedOrInferred&&input.sensitivity==='ordinary'&&input.householdSafe;
}


export type LiaVoiceTurnContext={
  sessionExplicitlyActive:boolean;
  microphoneConsent:boolean;
  mode:LiaSurfaceMode;
  directAddressed:boolean;
  humanSpeechActive:boolean;
  liaSpeaking:boolean;
  queuedSpeech:boolean;
  silenceMs:number;
  sensitiveMoment:boolean;
};

export type LiaVoiceTurnDecision='listen'|'answer'|'wait'|'cancel_queued';

/**
 * Voice turn-taking is interruption-first: a human voice always wins, queued
 * speech is cancelled rather than spoken over someone, and table mode waits
 * longer than cooking before an unsolicited turn.
 */
export function liaVoiceTurnDecision(input:LiaVoiceTurnContext):LiaVoiceTurnDecision{
  if(!input.sessionExplicitlyActive||!input.microphoneConsent)return'listen';
  if(input.humanSpeechActive)return input.queuedSpeech?'cancel_queued':'listen';
  if(input.liaSpeaking)return'wait';
  if(input.directAddressed)return input.silenceMs>=250?'answer':'wait';
  if(input.sensitiveMoment)return'listen';
  const silence=input.mode==='table'?3000:input.mode==='cooking'?900:1500;
  return input.silenceMs>=silence?'answer':'wait';
}

export function liaVoiceMustStopImmediately(input:{humanSpeechStarted:boolean;sessionEnded:boolean;microphoneConsentRevoked:boolean}):boolean{
  return input.humanSpeechStarted||input.sessionEnded||input.microphoneConsentRevoked;
}


export type LiaTableTopicParticipationContext={
  sessionExplicitlyActive:boolean;
  microphoneConsent:boolean;
  mode:LiaSurfaceMode;
  topicConfidence:number;
  hasUsefulContribution:boolean;
  contributionVerified:boolean;
  humanSpeechActive:boolean;
  liaSpeaking:boolean;
  silenceMs:number;
  sensitiveConversation:boolean;
  interventionsLast20Minutes:number;
  msSinceLastTopicContribution:number;
};

export type LiaTableTopicParticipationDecision='contribute'|'listen';

/**
 * LIA may join an ordinary family topic (travel, plans, activities, food, etc.)
 * only when she has a concrete, verified contribution. She waits for a natural
 * gap, never speaks over a person, and remains deliberately sparse.
 */
export function liaTableTopicParticipationDecision(input:LiaTableTopicParticipationContext):LiaTableTopicParticipationDecision{
  if(!input.sessionExplicitlyActive||!input.microphoneConsent||input.mode!=='table')return'listen';
  if(input.sensitiveConversation||input.humanSpeechActive||input.liaSpeaking)return'listen';
  if(input.topicConfidence<.72||!input.hasUsefulContribution||!input.contributionVerified)return'listen';
  if(input.silenceMs<1800)return'listen';
  if(input.interventionsLast20Minutes>=3)return'listen';
  if(input.msSinceLastTopicContribution<120_000)return'listen';
  return'contribute';
}


export type LiaTableOpportunityContext={
  sessionExplicitlyActive:boolean;
  mode:LiaSurfaceMode;
  humanSpeechActive:boolean;
  familyHadResponseWindow:boolean;
  sensitiveConversation:boolean;
  concreteRequestDetected:boolean;
  canOfferUsefulHelp:boolean;
  subjectAge:number|null;
  requiresGuardianDecision:boolean;
};

export type LiaTableOpportunityDecision='offer_help'|'listen';

/**
 * When a family member expresses a concrete wish, LIA may offer practical help
 * after the family has had room to respond. For minors, she may clarify the wish
 * and offer research, but never bypass a required guardian decision.
 */
export function liaTableOpportunityDecision(input:LiaTableOpportunityContext):LiaTableOpportunityDecision{
  if(!input.sessionExplicitlyActive||input.mode!=='table'||input.humanSpeechActive)return'listen';
  if(input.sensitiveConversation||!input.familyHadResponseWindow)return'listen';
  if(!input.concreteRequestDetected||!input.canOfferUsefulHelp)return'listen';
  if(input.subjectAge!==null&&input.subjectAge<18&&input.requiresGuardianDecision)return'listen';
  return'offer_help';
}

export type LiaTableClarificationKind='activity_type'|'location'|'schedule'|'budget'|'none';

export function liaTableNextClarification(input:{
  activityNeedsType:boolean;
  locationMissing:boolean;
  scheduleMissing:boolean;
  budgetNeeded:boolean;
}):LiaTableClarificationKind{
  if(input.activityNeedsType)return'activity_type';
  if(input.locationMissing)return'location';
  if(input.scheduleMissing)return'schedule';
  if(input.budgetNeeded)return'budget';
  return'none';
}


export type LiaFamilyAssistHandoffContext={
  sessionExplicitlyActive:boolean;
  mode:LiaSurfaceMode;
  humanSpeechActive:boolean;
  familyHadResponseWindow:boolean;
  parentExpressedIntentToHelp:boolean;
  parentExpressedTimeConstraint:boolean;
  taskCanBeDelegatedSafely:boolean;
  requiresParentApprovalBeforeAction:boolean;
};

export type LiaFamilyAssistHandoffDecision='offer_parent_assistance'|'listen';

/**
 * LIA can notice that a parent wants to help but lacks time and offer to do the
 * preparatory work. The parent remains the decision-maker; approval-gated
 * actions are never performed merely because LIA heard the conversation.
 */
export function liaFamilyAssistHandoffDecision(input:LiaFamilyAssistHandoffContext):LiaFamilyAssistHandoffDecision{
  if(!input.sessionExplicitlyActive||input.mode!=='table'||input.humanSpeechActive)return'listen';
  if(!input.familyHadResponseWindow||!input.parentExpressedIntentToHelp)return'listen';
  if(!input.parentExpressedTimeConstraint||!input.taskCanBeDelegatedSafely)return'listen';
  return'offer_parent_assistance';
}


export type LiaFamilyHelpMemoDecision='offer_research'|'offer_memo'|'save_memo'|'wait';

export function liaFamilyHelpMemoDecision(input:{
  parentAcceptedLiaHelp:boolean;
  researchCompleted:boolean;
  memoConsent:boolean;
}):LiaFamilyHelpMemoDecision{
  if(!input.parentAcceptedLiaHelp)return'offer_research';
  if(!input.researchCompleted)return'wait';
  if(!input.memoConsent)return'offer_memo';
  return'save_memo';
}


export type LiaTopicHumorContinuationDecision='light_humor'|'stay_neutral';

export function liaTopicHumorContinuationDecision(input:{
  sessionExplicitlyActive:boolean;
  mode:LiaSurfaceMode;
  topicStillActive:boolean;
  practicalHelpAlreadyHandled:boolean;
  tone:'unknown'|'warm'|'neutral'|'tense'|'distress';
  humanSpeechActive:boolean;
  targetComfortKnown:boolean;
  sensitiveTopic:boolean;
  jokeTargetsVulnerability:boolean;
}):LiaTopicHumorContinuationDecision{
  if(!input.sessionExplicitlyActive||input.mode!=='table'||!input.topicStillActive)return'stay_neutral';
  if(!input.practicalHelpAlreadyHandled||input.humanSpeechActive)return'stay_neutral';
  if(input.tone!=='warm'||!input.targetComfortKnown)return'stay_neutral';
  if(input.sensitiveTopic||input.jokeTargetsVulnerability)return'stay_neutral';
  return'light_humor';
}


export type LiaEverydayKnowledgeDecision='answer_briefly'|'clarify'|'listen';

export function liaEverydayKnowledgeDecision(input:{
  sessionExplicitlyActive:boolean;
  mode:LiaSurfaceMode;
  humanSpeechActive:boolean;
  familyHadResponseWindow:boolean;
  ordinaryTopic:boolean;
  sensitiveConversation:boolean;
  answerConfidence:number;
  termAmbiguous:boolean;
  usefulToConversation:boolean;
}):LiaEverydayKnowledgeDecision{
  if(!input.sessionExplicitlyActive||input.mode!=='table'||input.humanSpeechActive)return'listen';
  if(!input.familyHadResponseWindow||!input.ordinaryTopic||input.sensitiveConversation)return'listen';
  if(!input.usefulToConversation)return'listen';
  if(input.termAmbiguous||input.answerConfidence<.82)return'clarify';
  return'answer_briefly';
}


export type LiaSpeakerAddressing='named'|'unnamed';

export function liaSpeakerAddressing(input:{
  conversationUnderstood:boolean;
  speakerIdentityConfidence:number;
}):LiaSpeakerAddressing{
  if(!input.conversationUnderstood)return'unnamed';
  return input.speakerIdentityConfidence>=.90?'named':'unnamed';
}

export type LiaHouseholdSpeakerTurn={
  speakerTrackId:string;
  householdMemberId:string|null;
  identityConfidence:number;
  transcript:string;
};

export function liaMayAnswerSpeakerTurn(input:{
  turn:LiaHouseholdSpeakerTurn;
  topicUnderstood:boolean;
  usefulAnswerAvailable:boolean;
  naturalGapAvailable:boolean;
  humanSpeechActive:boolean;
}):boolean{
  return input.topicUnderstood&&input.usefulAnswerAvailable&&input.naturalGapAvailable&&!input.humanSpeechActive;
}


export type LiaAddressForm='tu'|'vous'|'vous_collective'|'ask_tutoiement';

export function liaAddressForm(input:{
  audience:'individual'|'group';
  memberAge:number|null;
  tutoiementPreference:'accepted'|'declined'|'unknown';
  firstDirectExchange:boolean;
}):LiaAddressForm{
  if(input.audience==='group')return'vous_collective';
  if(input.memberAge!==null&&input.memberAge<18)return'tu';
  if(input.tutoiementPreference==='accepted')return'tu';
  if(input.tutoiementPreference==='declined')return'vous';
  if(input.firstDirectExchange)return'ask_tutoiement';
  return'vous';
}


export type LiaConversationThread={
  id:string;
  speakerTrackId:string;
  householdMemberId:string|null;
  topicKey:string;
  lastTurnAt:number;
  open:boolean;
};

export function liaResumeConversationThread(input:{
  threads:LiaConversationThread[];
  speakerTrackId:string;
  topicKey:string;
}):LiaConversationThread|null{
  const candidates=input.threads
    .filter(x=>x.open&&x.speakerTrackId===input.speakerTrackId&&x.topicKey===input.topicKey)
    .sort((a,b)=>b.lastTurnAt-a.lastTurnAt);
  return candidates[0]??null;
}

export type LiaSpeakerIdentityEvidence={
  voiceConfidence:number;
  directlyNamed:boolean;
  kinshipAddress:'papa'|'maman'|'none';
  conversationalFit:boolean;
};

export function liaSpeakerIdentityConfidence(input:LiaSpeakerIdentityEvidence):number{
  let score=Math.max(0,Math.min(1,input.voiceConfidence))*.70;
  if(input.directlyNamed)score+=.20;
  if(input.kinshipAddress!=='none')score+=.05;
  if(input.conversationalFit)score+=.05;
  return Math.min(1,score);
}


export type LiaTableRhythmDecision='speak'|'hold';

export function liaTableRhythmDecision(input:{
  humanSpeechActive:boolean;
  silenceMs:number;
  rapidBackAndForth:boolean;
  liaInterventionsLast10Minutes:number;
  msSinceLiaLastSpoke:number;
  directlyAskedLia:boolean;
  contributionImportance:'low'|'useful'|'urgent';
}):LiaTableRhythmDecision{
  if(input.humanSpeechActive)return'hold';
  if(input.directlyAskedLia)return'speak';
  if(input.contributionImportance==='urgent'&&input.silenceMs>=700)return'speak';
  if(input.rapidBackAndForth)return'hold';
  if(input.silenceMs<1600)return'hold';
  if(input.liaInterventionsLast10Minutes>=3)return'hold';
  if(input.msSinceLiaLastSpoke<90_000)return'hold';
  return input.contributionImportance==='useful'?'speak':'hold';
}


export type LiaHeardFamilyNeedKind='information'|'research'|'shopping'|'reminder'|'decision';

export type LiaHeardFamilyNeed={
  kind:LiaHeardFamilyNeedKind;
  topic:string;
  speakerTrackId:string;
  householdMemberId:string|null;
  requiresConsent:boolean;
  requiresAdultApproval:boolean;
};

export type LiaHeardNeedNextStep='answer_now'|'offer_help'|'ask_adult'|'ask_consent'|'leave_in_conversation';

export function liaHeardNeedNextStep(input:{
  need:LiaHeardFamilyNeed;
  reliableAnswerAvailable:boolean;
  helpAvailable:boolean;
  consentGiven:boolean;
  adultApproved:boolean;
}):LiaHeardNeedNextStep{
  if(input.need.requiresAdultApproval&&!input.adultApproved)return'ask_adult';
  if(input.need.requiresConsent&&!input.consentGiven)return'ask_consent';
  if(input.need.kind==='information'&&input.reliableAnswerAvailable)return'answer_now';
  if(input.helpAvailable)return'offer_help';
  return'leave_in_conversation';
}


export type LiaKinshipAddressee='father'|'mother'|'parents'|'family'|'unknown';

export function liaKinshipAddressee(input:{
  openingWords:string;
}):LiaKinshipAddressee{
  const s=input.openingWords.trim().toLocaleLowerCase('fr-FR');
  if(/^(papa et maman|maman et papa|les parents)\b/.test(s))return'parents';
  if(/^(papa|p'pa)\b/.test(s))return'father';
  if(/^(maman|m'man)\b/.test(s))return'mother';
  if(/^(tout le monde|vous tous)\b/.test(s))return'family';
  return'unknown';
}

export function liaKinshipClueMayNarrowSpeaker(input:{
  addressee:LiaKinshipAddressee;
  candidateRelationshipToAddressee:'child'|'partner'|'other'|'unknown';
}):boolean{
  if(input.addressee!=='father'&&input.addressee!=='mother'&&input.addressee!=='parents')return false;
  return input.candidateRelationshipToAddressee==='child';
}


export type LiaThreadAttachmentDecision='attach'|'new_thread';

export function liaThreadAttachmentDecision(input:{
  sameSpeakerTrack:boolean;
  semanticSimilarity:number;
  msSinceThreadTurn:number;
  explicitTopicReturn:boolean;
}):LiaThreadAttachmentDecision{
  if(!input.sameSpeakerTrack)return'new_thread';
  if(input.explicitTopicReturn&&input.semanticSimilarity>=.55)return'attach';
  if(input.msSinceThreadTurn>15*60_000)return'new_thread';
  return input.semanticSimilarity>=.74?'attach':'new_thread';
}


export type LiaRecallVisibility='private_owner'|'member_private'|'household_shared'|'ephemeral';

export function liaMayRecallAtTable(input:{
  visibility:LiaRecallVisibility;
  explicitShareConsent:boolean;
  sensitive:boolean;
}):boolean{
  if(input.sensitive)return false;
  if(input.visibility==='household_shared')return true;
  if(input.visibility==='ephemeral')return false;
  return input.explicitShareConsent;
}


export type LiaTableReplyDepth='one_liner'|'brief'|'expanded';

export function liaTableReplyDepth(input:{
  directlyAsked:boolean;
  simpleFact:boolean;
  familyRequestsDetails:boolean;
  uncertaintyNeedsExplanation:boolean;
}):LiaTableReplyDepth{
  if(input.familyRequestsDetails||input.uncertaintyNeedsExplanation)return'expanded';
  if(input.simpleFact&&!input.directlyAsked)return'one_liner';
  return'brief';
}


export type LiaTableSensitivityShift='normal'|'withdraw';

export function liaTableSensitivityShift(input:{
  conflictSignals:boolean;
  healthOrIntimateTopic:boolean;
  financialOrVulnerabilityTopic:boolean;
  speakerLowersVoiceOrRequestsPrivacy:boolean;
}):LiaTableSensitivityShift{
  if(input.conflictSignals||input.healthOrIntimateTopic||input.financialOrVulnerabilityTopic)return'withdraw';
  if(input.speakerLowersVoiceOrRequestsPrivacy)return'withdraw';
  return'normal';
}


export type LiaOpenQuestionDecision='wait_for_family'|'may_answer';

export function liaOpenQuestionDecision(input:{
  directedAtLia:boolean;
  directedAtWholeTable:boolean;
  familyResponseStarted:boolean;
  waitMs:number;
  reliableAnswerAvailable:boolean;
}):LiaOpenQuestionDecision{
  if(input.directedAtLia)return input.reliableAnswerAvailable?'may_answer':'wait_for_family';
  if(!input.directedAtWholeTable)return'wait_for_family';
  if(input.familyResponseStarted)return'wait_for_family';
  if(input.waitMs<2200)return'wait_for_family';
  return input.reliableAnswerAvailable?'may_answer':'wait_for_family';
}


export type LiaFollowupTurnDecision='one_followup'|'yield_to_family';

export function liaFollowupTurnDecision(input:{
  liaJustContributed:boolean;
  humanRespondedToLia:boolean;
  clarificationNecessary:boolean;
  liaConsecutiveTurns:number;
}):LiaFollowupTurnDecision{
  if(!input.liaJustContributed||!input.humanRespondedToLia)return'yield_to_family';
  if(input.liaConsecutiveTurns>=2)return'yield_to_family';
  return input.clarificationNecessary?'one_followup':'yield_to_family';
}


export type LiaAcceptedTableTask={
  id:string;
  requestedByMemberId:string|null;
  requestedBySpeakerTrackId:string;
  topic:string;
  task:'research'|'compare'|'prepare_options';
  accepted:boolean;
  status:'pending'|'ready'|'closed';
  createdAt:number;
};

export function liaAcceptedTableTaskMayProceed(input:{
  task:LiaAcceptedTableTask;
  requiresAdultApproval:boolean;
  adultApproved:boolean;
}):boolean{
  if(!input.task.accepted||input.task.status!=='pending')return false;
  if(input.requiresAdultApproval&&!input.adultApproved)return false;
  return true;
}


export type LiaTaskReturnDecision='return_result'|'wait';

export function liaTaskReturnDecision(input:{
  taskStatus:'pending'|'ready'|'closed';
  appActive:boolean;
  familyConversationBusy:boolean;
  sensitiveMoment:boolean;
  resultVerified:boolean;
  msSinceLastLiaIntervention:number;
}):LiaTaskReturnDecision{
  if(input.taskStatus!=='ready'||!input.appActive||!input.resultVerified)return'wait';
  if(input.familyConversationBusy||input.sensitiveMoment)return'wait';
  if(input.msSinceLastLiaIntervention<90_000)return'wait';
  return'return_result';
}


export type LiaResultMemoDecision='offer_memo'|'save_memo'|'do_not_save';

export function liaResultMemoDecision(input:{
  usefulBeyondConversation:boolean;
  explicitMemoConsent:boolean;
  userDeclinedMemo:boolean;
}):LiaResultMemoDecision{
  if(input.userDeclinedMemo||!input.usefulBeyondConversation)return'do_not_save';
  return input.explicitMemoConsent?'save_memo':'offer_memo';
}


export type LiaHumorAftermath='continue_lightly'|'drop_humor';

export function liaHumorAftermath(input:{
  laughterOrWarmResponse:boolean;
  awkwardSilence:boolean;
  targetPushesBack:boolean;
  repeatedJokeOnSamePerson:boolean;
}):LiaHumorAftermath{
  if(input.awkwardSilence||input.targetPushesBack||input.repeatedJokeOnSamePerson)return'drop_humor';
  return input.laughterOrWarmResponse?'continue_lightly':'drop_humor';
}


export type LiaThreadParticipationPermission='allowed'|'excluded';

export function liaThreadParticipationPermission(input:{
  explicitStayOutRequest:boolean;
  explicitReinvite:boolean;
  previouslyExcluded:boolean;
}):LiaThreadParticipationPermission{
  if(input.explicitReinvite)return'allowed';
  if(input.explicitStayOutRequest||input.previouslyExcluded)return'excluded';
  return'allowed';
}


export type LiaCorrectionDecision='acknowledge_and_recheck'|'keep_answer';

export function liaCorrectionDecision(input:{
  familyChallengesAnswer:boolean;
  authoritativeFamilyContext:boolean;
  externalFactConfidence:number;
}):LiaCorrectionDecision{
  if(!input.familyChallengesAnswer)return'keep_answer';
  if(input.authoritativeFamilyContext)return'acknowledge_and_recheck';
  return input.externalFactConfidence<.95?'acknowledge_and_recheck':'keep_answer';
}


export type LiaThreadLifecycle='keep_open'|'close';

export function liaThreadLifecycle(input:{
  explicitClosure:boolean;
  taskStillOpen:boolean;
  msSinceLastRelevantTurn:number;
  topicReturnedRecently:boolean;
}):LiaThreadLifecycle{
  if(input.taskStillOpen)return'keep_open';
  if(input.explicitClosure)return'close';
  if(input.topicReturnedRecently)return'keep_open';
  return input.msSinceLastRelevantTurn>=20*60_000?'close':'keep_open';
}


export type LiaSpeakerMembership='household'|'guest'|'unknown';

export function liaSpeakerMembership(input:{
  matchedHouseholdVoice:boolean;
  introducedAsGuest:boolean;
  identityConfidence:number;
}):LiaSpeakerMembership{
  if(input.introducedAsGuest)return'guest';
  if(input.matchedHouseholdVoice&&input.identityConfidence>=.90)return'household';
  return'unknown';
}

export function liaMayUseHouseholdMemoryForSpeaker(input:{
  membership:LiaSpeakerMembership;
  identityConfidence:number;
}):boolean{
  return input.membership==='household'&&input.identityConfidence>=.90;
}


export type LiaOverlappingSpeechDecision='wait'|'process_turn';

export function liaOverlappingSpeechDecision(input:{
  simultaneousSpeakers:number;
  dominantSpeakerConfidence:number;
  directedAtLia:boolean;
}):LiaOverlappingSpeechDecision{
  if(input.simultaneousSpeakers<=1)return'process_turn';
  if(input.directedAtLia&&input.dominantSpeakerConfidence>=.92)return'process_turn';
  return'wait';
}


export type LiaTablePresenceEvent='join'|'leave';

export type LiaTableParticipant={
  speakerTrackId:string;
  householdMemberId:string|null;
  membership:LiaSpeakerMembership;
  present:boolean;
};

export function liaApplyTablePresenceEvent(input:{
  participants:LiaTableParticipant[];
  speakerTrackId:string;
  householdMemberId:string|null;
  membership:LiaSpeakerMembership;
  event:LiaTablePresenceEvent;
}):LiaTableParticipant[]{
  const others=input.participants.filter(x=>x.speakerTrackId!==input.speakerTrackId);
  return [...others,{
    speakerTrackId:input.speakerTrackId,
    householdMemberId:input.householdMemberId,
    membership:input.membership,
    present:input.event==='join'
  }];
}


export type LiaDirectCallDecision='answer'|'clarify'|'wait';

export function liaDirectCallDecision(input:{
  wakeNameDetected:boolean;
  directedQuestion:boolean;
  answerConfidence:number;
  ambiguousRequest:boolean;
  humanSpeechActive:boolean;
}):LiaDirectCallDecision{
  if(!input.wakeNameDetected||!input.directedQuestion)return'wait';
  if(input.humanSpeechActive)return'wait';
  if(input.ambiguousRequest||input.answerConfidence<.80)return'clarify';
  return'answer';
}


export type LiaContextCarryDecision='use_recent_context'|'ask_what_they_mean';

export function liaContextCarryDecision(input:{
  sameSpeakerTrack:boolean;
  msSinceRelevantTurn:number;
  semanticContinuity:number;
  explicitReferenceWord:boolean;
}):LiaContextCarryDecision{
  if(!input.sameSpeakerTrack)return'ask_what_they_mean';
  if(input.msSinceRelevantTurn>5*60_000)return'ask_what_they_mean';
  if(input.explicitReferenceWord&&input.semanticContinuity>=.55)return'use_recent_context';
  return input.semanticContinuity>=.78?'use_recent_context':'ask_what_they_mean';
}


export type LiaTurnAddressee='lia'|'member'|'group'|'unclear';

export function liaTurnAddressee(input:{
  liaNamed:boolean;
  memberNamed:boolean;
  pluralAddress:boolean;
  replyToLiaTurn:boolean;
}):LiaTurnAddressee{
  if(input.liaNamed||input.replyToLiaTurn)return'lia';
  if(input.memberNamed)return'member';
  if(input.pluralAddress)return'group';
  return'unclear';
}

export function liaMayTreatTurnAsReply(input:{
  addressee:LiaTurnAddressee;
  liaAskedQuestion:boolean;
}):boolean{
  return input.liaAskedQuestion&&input.addressee==='lia';
}


export type LiaRelationshipSignal='tutoiement'|'humor_comfort'|'temporary_mood';

export function liaRelationshipSignalPersistence(input:{
  signal:LiaRelationshipSignal;
  explicitPreference:boolean;
  repeatedPositiveEvidence:boolean;
}):'persist'|'session_only'{
  if(input.signal==='tutoiement'&&input.explicitPreference)return'persist';
  if(input.signal==='humor_comfort'&&input.repeatedPositiveEvidence)return'persist';
  return'session_only';
}


export type LiaFutureEventDecision='offer_reminder'|'offer_planning_help'|'listen';

export function liaFutureEventDecision(input:{
  futureEventDetected:boolean;
  explicitNeedToRemember:boolean;
  planningProblemDetected:boolean;
  conversationBusy:boolean;
  sensitive:boolean;
}):LiaFutureEventDecision{
  if(!input.futureEventDetected||input.conversationBusy||input.sensitive)return'listen';
  if(input.explicitNeedToRemember)return'offer_reminder';
  if(input.planningProblemDetected)return'offer_planning_help';
  return'listen';
}


export type LiaTopicScope='individual'|'family';

export function liaTopicScope(input:{
  explicitlyCollective:boolean;
  distinctMembersContributed:number;
  sharedDecisionDetected:boolean;
}):LiaTopicScope{
  if(input.explicitlyCollective||input.sharedDecisionDetected)return'family';
  return input.distinctMembersContributed>=3?'family':'individual';
}


export type LiaShortReplyAttachment='lia_question'|'family_question'|'unclear';

export function liaShortReplyAttachment(input:{
  liaQuestionOpen:boolean;
  familyQuestionOpen:boolean;
  addressedToLia:boolean;
  msSinceLiaQuestion:number;
  msSinceFamilyQuestion:number;
}):LiaShortReplyAttachment{
  if(input.addressedToLia&&input.liaQuestionOpen&&input.msSinceLiaQuestion<=30_000)return'lia_question';
  if(input.familyQuestionOpen&&input.msSinceFamilyQuestion<=30_000)return'family_question';
  if(input.liaQuestionOpen&&input.msSinceLiaQuestion<=12_000)return'lia_question';
  return'unclear';
}


export type LiaIgnoredOfferDecision='drop_offer'|'keep_waiting';

export function liaIgnoredOfferDecision(input:{
  offerMade:boolean;
  familyContinuedOtherTopic:boolean;
  msSinceOffer:number;
  explicitlyDeferred:boolean;
}):LiaIgnoredOfferDecision{
  if(!input.offerMade)return'drop_offer';
  if(input.explicitlyDeferred)return'keep_waiting';
  if(input.familyContinuedOtherTopic||input.msSinceOffer>=45_000)return'drop_offer';
  return'keep_waiting';
}


export type LiaSocialReplyDecision='reply_lightly'|'listen';

export function liaSocialReplyDecision(input:{
  addressedToLia:boolean;
  playfulTone:boolean;
  safeTopic:boolean;
  humanSpeechActive:boolean;
  liaRecentlyOveractive:boolean;
}):LiaSocialReplyDecision{
  if(!input.addressedToLia||input.humanSpeechActive)return'listen';
  if(!input.playfulTone||!input.safeTopic||input.liaRecentlyOveractive)return'listen';
  return'reply_lightly';
}


export type LiaMealAttendanceState='yes'|'no'|'unknown';

export type LiaMealMemberReply={
  memberId:string;
  attendance:LiaMealAttendanceState;
  replyReceived:boolean;
};

export function liaMealMissingReply(input:{
  replies:LiaMealMemberReply[];
  memberId:string;
}):boolean{
  const reply=input.replies.find(x=>x.memberId===input.memberId);
  return !reply||!reply.replyReceived||reply.attendance==='unknown';
}

export type LiaMealMessageOffer='offer_send'|'already_known'|'cannot_message';

export function liaMealMessageOffer(input:{
  attendanceKnown:boolean;
  memberHasMessagingPhone:boolean;
  memberAge:number|null;
}):LiaMealMessageOffer{
  if(input.attendanceKnown)return'already_known';
  if(!input.memberHasMessagingPhone)return'cannot_message';
  return'offer_send';
}

export type LiaMealReplyAnnouncement='coming'|'not_coming'|'still_unknown';

export function liaMealReplyAnnouncement(input:{
  replyReceived:boolean;
  attendance:LiaMealAttendanceState;
}):LiaMealReplyAnnouncement{
  if(!input.replyReceived||input.attendance==='unknown')return'still_unknown';
  return input.attendance==='yes'?'coming':'not_coming';
}


export function liaMealMessageMaySend(input:{
  organizerApproved:boolean;
  memberHasMessagingPhone:boolean;
  messageAllowedForMemberAge:boolean;
}):boolean{
  return input.organizerApproved&&input.memberHasMessagingPhone&&input.messageAllowedForMemberAge;
}

export type LiaMealReplySurface='voice'|'discreet_notification'|'silent';

export function liaMealReplySurface(input:{
  liaConversationActive:boolean;
  appForeground:boolean;
  sensitiveContext:boolean;
}):LiaMealReplySurface{
  if(input.sensitiveContext)return'discreet_notification';
  if(input.liaConversationActive&&input.appForeground)return'voice';
  if(!input.appForeground)return'discreet_notification';
  return'silent';
}


export type LiaMealPollDraft={
  recipientMemberIds:string[];
  askAttendance:boolean;
  mealOptions:string[];
  allowOtherChoice:boolean;
  organizerNote:string|null;
};

export type LiaMealPollMissingInfo='recipients'|'attendance'|'meal_options'|'ready';

export function liaMealPollNextQuestion(input:{
  recipientMemberIds:string[];
  attendanceChoiceKnown:boolean;
  mealOptions:string[];
}):LiaMealPollMissingInfo{
  if(input.recipientMemberIds.length===0)return'recipients';
  if(!input.attendanceChoiceKnown)return'attendance';
  if(input.mealOptions.length===0)return'meal_options';
  return'ready';
}

export function liaMealPollMaySend(input:{
  organizerApprovedFinalDraft:boolean;
  eligibleRecipientCount:number;
  draft:LiaMealPollDraft;
}):boolean{
  return input.organizerApprovedFinalDraft&&input.eligibleRecipientCount>0&&input.draft.recipientMemberIds.length>0;
}


export type LiaMealPollResponse={
  memberId:string;
  attendance:LiaMealAttendanceState;
  mealChoice:string|null;
  replied:boolean;
};

export type LiaMealPollSummary={
  comingMemberIds:string[];
  notComingMemberIds:string[];
  pendingMemberIds:string[];
  mealChoices:Array<{memberId:string;choice:string}>;
};

export function liaSummarizeMealPoll(responses:LiaMealPollResponse[]):LiaMealPollSummary{
  return{
    comingMemberIds:responses.filter(x=>x.replied&&x.attendance==='yes').map(x=>x.memberId),
    notComingMemberIds:responses.filter(x=>x.replied&&x.attendance==='no').map(x=>x.memberId),
    pendingMemberIds:responses.filter(x=>!x.replied||x.attendance==='unknown').map(x=>x.memberId),
    mealChoices:responses.filter(x=>x.replied&&!!x.mealChoice).map(x=>({memberId:x.memberId,choice:x.mealChoice!}))
  };
}


export type LiaMealReplyDeltaDecision='announce_delta'|'hold';

export function liaMealReplyDeltaDecision(input:{
  newlyReceived:boolean;
  liaConversationActive:boolean;
  organizerIsCurrentSpeakerPartner:boolean;
  humanSpeechActive:boolean;
  sensitiveMoment:boolean;
}):LiaMealReplyDeltaDecision{
  if(!input.newlyReceived||!input.liaConversationActive||!input.organizerIsCurrentSpeakerPartner)return'hold';
  if(input.humanSpeechActive||input.sensitiveMoment)return'hold';
  return'announce_delta';
}


export type LiaMealChoiceCount={choice:string;count:number};

export function liaCountMealChoices(responses:LiaMealPollResponse[]):LiaMealChoiceCount[]{
  const counts=new Map<string,number>();
  for(const r of responses){
    if(!r.replied||r.attendance!=='yes'||!r.mealChoice)continue;
    counts.set(r.mealChoice,(counts.get(r.mealChoice)??0)+1);
  }
  return [...counts.entries()]
    .map(([choice,count])=>({choice,count}))
    .sort((a,b)=>b.count-a.count);
}

export type LiaMealResolutionSuggestion='single_majority'|'combine_order'|'ask_organizer'|'no_decision';

export function liaMealResolutionSuggestion(input:{
  counts:LiaMealChoiceCount[];
  oneProviderCanCoverTopChoices:boolean;
  organizerAskedForSuggestion:boolean;
}):LiaMealResolutionSuggestion{
  if(input.counts.length===0)return'no_decision';
  if(input.counts.length===1)return'single_majority';
  if(input.oneProviderCanCoverTopChoices)return'combine_order';
  if(input.organizerAskedForSuggestion&&input.counts[0].count>input.counts[1].count)return'single_majority';
  return'ask_organizer';
}


export type LiaMealDecisionOwner='organizer'|'family';

export function liaMealDecisionOwner(input:{
  organizerDelegatedDecision:boolean;
  familyRuleExplicitlySet:'majority'|'organizer'|'none';
}):LiaMealDecisionOwner{
  if(input.familyRuleExplicitlySet==='majority')return'family';
  return'organizer';
}

export function liaMayUsePlayfulMealFraming(input:{
  safeFamilyTone:boolean;
  disagreementLighthearted:boolean;
  sensitiveDietaryConstraint:boolean;
}):boolean{
  return input.safeFamilyTone&&input.disagreementLighthearted&&!input.sensitiveDietaryConstraint;
}


export type LiaMealOrderNextStep='search_commander'|'prepare_home_meal'|'wait_for_decision';

export function liaMealOrderNextStep(input:{
  organizerDecision:'order'|'cook'|'undecided';
  mealChoicesKnown:boolean;
}):LiaMealOrderNextStep{
  if(!input.mealChoicesKnown||input.organizerDecision==='undecided')return'wait_for_decision';
  return input.organizerDecision==='order'?'search_commander':'prepare_home_meal';
}

export type LiaProviderCombinationEvidence={
  providerVerified:boolean;
  deliversToActiveAddress:boolean;
  allRequestedCategoriesVerified:boolean;
};

export function liaMayClaimProviderCanCombine(input:LiaProviderCombinationEvidence):boolean{
  return input.providerVerified&&input.deliversToActiveAddress&&input.allRequestedCategoriesVerified;
}


export type LiaHomeMealFeasibility='can_make'|'missing_items'|'no_match';

export function liaHomeMealFeasibility(input:{
  matchingRecipeFound:boolean;
  missingIngredientCount:number;
}):LiaHomeMealFeasibility{
  if(!input.matchingRecipeFound)return'no_match';
  return input.missingIngredientCount===0?'can_make':'missing_items';
}

export type LiaMealChoiceConstraint={
  memberId:string;
  choice:string;
  isPreference:boolean;
  isDietaryConstraint:boolean;
};

export function liaMaySubstituteMealChoice(input:{
  choice:LiaMealChoiceConstraint;
  substituteAccepted:boolean;
}):boolean{
  if(input.choice.isDietaryConstraint)return input.substituteAccepted;
  return input.substituteAccepted;
}


export type LiaMealPollLifecycle='open'|'resolved'|'closed';

export function liaMealPollLifecycle(input:{
  decisionMade:boolean;
  organizerClosedPoll:boolean;
  outstandingReplies:number;
}):LiaMealPollLifecycle{
  if(input.organizerClosedPoll)return'closed';
  if(input.decisionMade)return'resolved';
  return'open';
}

export function liaMayPromptPendingMealReplies(input:{
  lifecycle:LiaMealPollLifecycle;
  pendingCount:number;
  organizerAskedToFollowUp:boolean;
}):boolean{
  return input.lifecycle==='open'&&input.pendingCount>0&&input.organizerAskedToFollowUp;
}


export type LiaLateMealReplyImpact='no_change'|'update_summary'|'reopen_decision';

export function liaLateMealReplyImpact(input:{
  pollLifecycle:LiaMealPollLifecycle;
  replyChangesAttendanceCount:boolean;
  replyIntroducesNewMealChoice:boolean;
  orderAlreadyConfirmed:boolean;
}):LiaLateMealReplyImpact{
  if(input.pollLifecycle==='closed'&&input.orderAlreadyConfirmed)return'update_summary';
  if(input.replyIntroducesNewMealChoice&&!input.orderAlreadyConfirmed)return'reopen_decision';
  if(input.replyChangesAttendanceCount)return'update_summary';
  return'no_change';
}


export type LiaMealExecutionBrief={
  attendingCount:number;
  selectedChoices:string[];
  missingItems:string[];
  nextAction:'cook'|'order'|'shop'|'wait';
};

export function liaMealExecutionBrief(input:{
  attendingCount:number;
  selectedChoices:string[];
  cookingChosen:boolean;
  orderingChosen:boolean;
  missingItems:string[];
}):LiaMealExecutionBrief{
  const nextAction:LiaMealExecutionBrief['nextAction']=
    input.cookingChosen
      ?(input.missingItems.length>0?'shop':'cook')
      :(input.orderingChosen?'order':'wait');
  return{
    attendingCount:input.attendingCount,
    selectedChoices:input.selectedChoices,
    missingItems:input.missingItems,
    nextAction
  };
}


export type LiaDelegatedMealRule='majority'|'combine_if_possible'|'none';

export function liaMayResolveDelegatedMealChoice(input:{
  organizerExplicitlyDelegated:boolean;
  savedFamilyRule:LiaDelegatedMealRule;
  dietaryConstraintsSatisfied:boolean;
}):boolean{
  return input.organizerExplicitlyDelegated
    &&input.savedFamilyRule!=='none'
    &&input.dietaryConstraintsSatisfied;
}


export type LiaMealRequirementKind='preference'|'allergy'|'medical'|'religious'|'other_constraint';

export type LiaMealRequirement={
  memberId:string;
  kind:LiaMealRequirementKind;
  value:string;
  confirmed:boolean;
};

export function liaMealRequirementPriority(input:{
  requirement:LiaMealRequirement;
}):'hard_constraint'|'preference'{
  if(!input.requirement.confirmed)return'preference';
  return input.requirement.kind==='preference'?'preference':'hard_constraint';
}

export function liaMealOptionIsCompatible(input:{
  requirements:LiaMealRequirement[];
  incompatibleMemberIds:string[];
}):boolean{
  const hard=new Set(
    input.requirements
      .filter(r=>r.confirmed&&r.kind!=='preference')
      .map(r=>r.memberId)
  );
  return !input.incompatibleMemberIds.some(id=>hard.has(id));
}


export type LiaPortionCheck='enough'|'recalculate'|'unknown';

export function liaPortionCheck(input:{
  attendingCount:number;
  plannedPortions:number|null;
}):LiaPortionCheck{
  if(input.plannedPortions===null)return'unknown';
  return input.plannedPortions>=input.attendingCount?'enough':'recalculate';
}

export function liaMayApplyPortionChange(input:{
  recalculationProposed:boolean;
  organizerApproved:boolean;
}):boolean{
  return input.recalculationProposed&&input.organizerApproved;
}


export type LiaMealReplyDelivery='announce_one'|'bundle_updates'|'hold';

export function liaMealReplyDelivery(input:{
  pendingNewReplies:number;
  humanSpeechActive:boolean;
  msSinceLastLiaIntervention:number;
}):LiaMealReplyDelivery{
  if(input.humanSpeechActive)return'hold';
  if(input.pendingNewReplies>=2)return'bundle_updates';
  if(input.pendingNewReplies===1&&input.msSinceLastLiaIntervention>=30_000)return'announce_one';
  return'hold';
}


export type LiaTimestampedMealReply=LiaMealPollResponse&{receivedAt:number};

export function liaLatestMealReplies(replies:LiaTimestampedMealReply[]):LiaTimestampedMealReply[]{
  const latest=new Map<string,LiaTimestampedMealReply>();
  for(const reply of replies){
    const previous=latest.get(reply.memberId);
    if(!previous||reply.receivedAt>=previous.receivedAt)latest.set(reply.memberId,reply);
  }
  return [...latest.values()];
}


export type LiaFreeMealReplyInterpretation='apply'|'needs_clarification';

export function liaFreeMealReplyInterpretation(input:{
  attendanceConfidence:number;
  mealChoiceConfidence:number;
  containsQualifier:boolean;
}):LiaFreeMealReplyInterpretation{
  if(input.attendanceConfidence<.85)return'needs_clarification';
  if(input.containsQualifier&&input.mealChoiceConfidence<.90)return'needs_clarification';
  return'apply';
}


export type LiaMealPersonalInstruction={
  memberId:string;
  instruction:string;
  confirmed:boolean;
};

export function liaMealPersonalInstructionsForMember(input:{
  instructions:LiaMealPersonalInstruction[];
  memberId:string;
}):LiaMealPersonalInstruction[]{
  return input.instructions.filter(x=>x.memberId===input.memberId&&x.confirmed);
}


export type LiaMealReplyParts={
  attendance:LiaMealAttendanceState;
  mealChoice:string|null;
  personalInstruction:string|null;
};

export function liaMealReplyPartsComplete(input:{
  attendanceConfidence:number;
  choiceConfidence:number;
  instructionDetected:boolean;
  instructionConfidence:number;
}):boolean{
  if(input.attendanceConfidence<.85)return false;
  if(input.choiceConfidence>0&&input.choiceConfidence<.85)return false;
  if(input.instructionDetected&&input.instructionConfidence<.90)return false;
  return true;
}


export function liaMealExecutionHasAllPersonalInstructions(input:{
  confirmedInstructions:LiaMealPersonalInstruction[];
  includedMemberIds:string[];
}):boolean{
  const included=new Set(input.includedMemberIds);
  return input.confirmedInstructions.every(x=>included.has(x.memberId));
}


export type LiaPendingAttendanceHandling='mention_pending'|'do_not_assume_absent';

export function liaPendingAttendanceHandling(input:{
  pendingCount:number;
  decisionNeedsHeadcount:boolean;
}):LiaPendingAttendanceHandling{
  if(input.pendingCount>0&&input.decisionNeedsHeadcount)return'mention_pending';
  return'do_not_assume_absent';
}


export type LiaPendingMemberPracticalHandling=
  'include_as_buffer'
  |'leave_pending'
  |'explicitly_absent';

export function liaPendingMemberPracticalHandling(input:{
  replied:boolean;
  explicitAbsence:boolean;
  establishedAttendancePattern:boolean;
  attendancePatternConfidence:number;
  lowCostToInclude:boolean;
}):LiaPendingMemberPracticalHandling{
  if(input.replied&&input.explicitAbsence)return'explicitly_absent';
  if(!input.replied
    &&input.establishedAttendancePattern
    &&input.attendancePatternConfidence>=.90
    &&input.lowCostToInclude)return'include_as_buffer';
  return'leave_pending';
}

export function liaMayUsePlayfulPendingMemberRemark(input:{
  establishedFamilyFamiliarity:boolean;
  safeFamilyTone:boolean;
  sensitiveContext:boolean;
}):boolean{
  return input.establishedFamilyFamiliarity&&input.safeFamilyTone&&!input.sensitiveContext;
}


export type LiaPendingMemberConversationMove='state_practical_plan'|'mention_uncertainty'|'stay_quiet';

export function liaPendingMemberConversationMove(input:{
  practicalHandling:LiaPendingMemberPracticalHandling;
  decisionNeedsHeadcount:boolean;
  conversationFlowing:boolean;
}):LiaPendingMemberConversationMove{
  if(input.practicalHandling==='include_as_buffer')return'state_practical_plan';
  if(input.practicalHandling==='leave_pending'&&input.decisionNeedsHeadcount)return'mention_uncertainty';
  return input.conversationFlowing?'stay_quiet':'mention_uncertainty';
}


export type LiaPendingMemberMealChoice='shared_family_meal'|'keep_choice_unknown';

export function liaPendingMemberMealChoice(input:{
  replied:boolean;
  establishedFamilyFamiliarity:boolean;
  knownDietaryConstraint:boolean;
  specialMealInstructionKnown:boolean;
}):LiaPendingMemberMealChoice{
  if(!input.replied
    &&input.establishedFamilyFamiliarity
    &&!input.knownDietaryConstraint
    &&!input.specialMealInstructionKnown)return'shared_family_meal';
  return'keep_choice_unknown';
}


export type LiaMealHabitConfidence='insufficient'|'usable'|'established';

export function liaMealHabitConfidence(input:{
  matchingObservations:number;
  contradictingObservations:number;
  explicitlyConfirmedByFamily:boolean;
}):LiaMealHabitConfidence{
  if(input.explicitlyConfirmedByFamily)return'established';
  if(input.matchingObservations>=4&&input.contradictingObservations===0)return'established';
  if(input.matchingObservations>=2&&input.contradictingObservations<=1)return'usable';
  return'insufficient';
}

export function liaMayUseMealHabitWithoutQuestion(input:{
  confidence:LiaMealHabitConfidence;
  lowConsequence:boolean;
  conflictsWithKnownConstraint:boolean;
}):boolean{
  return input.confidence==='established'&&input.lowConsequence&&!input.conflictsWithKnownConstraint;
}


export type LiaMealKnowledgeBasis='today_reply'|'established_habit'|'unknown';

export function liaMealKnowledgeBasis(input:{
  repliedToday:boolean;
  establishedHabitAvailable:boolean;
}):LiaMealKnowledgeBasis{
  if(input.repliedToday)return'today_reply';
  if(input.establishedHabitAvailable)return'established_habit';
  return'unknown';
}

export type LiaMealSpeechCertainty='state_as_fact'|'state_as_habit'|'avoid_claim';

export function liaMealSpeechCertainty(basis:LiaMealKnowledgeBasis):LiaMealSpeechCertainty{
  if(basis==='today_reply')return'state_as_fact';
  if(basis==='established_habit')return'state_as_habit';
  return'avoid_claim';
}


export type LiaCreativeInitiativeDecision='offer_playful_choice'|'stay_practical';

/**
 * LIA may add a small creative fork when it makes the interaction better.
 * Surprise belongs in ideas/questions, never in silent execution. The gate is
 * intentionally conservative so the behaviour feels human rather than
 * repetitive or intrusive.
 */
export function liaCreativeInitiativeDecision(input:{
  sessionExplicitlyActive:boolean;
  humanSpeechActive:boolean;
  sensitiveConversation:boolean;
  urgentMoment:boolean;
  userAskedForStrictExecution:boolean;
  usefulAlternativeExists:boolean;
  creativePromptRecentlyUsed:boolean;
}):LiaCreativeInitiativeDecision{
  if(!input.sessionExplicitlyActive||input.humanSpeechActive)return'stay_practical';
  if(input.sensitiveConversation||input.urgentMoment||input.userAskedForStrictExecution)return'stay_practical';
  if(!input.usefulAlternativeExists||input.creativePromptRecentlyUsed)return'stay_practical';
  return'offer_playful_choice';
}
