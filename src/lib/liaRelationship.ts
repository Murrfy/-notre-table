import type {LiaFamilySoftGap,LiaRelationshipStatus} from './liaFamilyForm';
import type {LiaSurfaceMode} from './lia';

export type LiaRelationalTopic='food'|'family'|'personal_history'|'plans'|'leisure'|'style'|'travel';
export type LiaSocialToneEstimate='unknown'|'warm'|'neutral'|'tense'|'distress';
export type LiaRelationshipMemorySensitivity='ordinary'|'personal'|'sensitive';
export type LiaProfileReminderVariant='gentle'|'confidante'|'specific';

export type LiaRelationalQuestionContext={
  enabled:boolean;
  quiet:boolean;
  mode:LiaSurfaceMode;
  humanSpeechActive:boolean;
  liaSpeaking:boolean;
  sensitiveConversation:boolean;
  tone:LiaSocialToneEstimate;
  silenceMs:number;
  questionsLast30Minutes:number;
  questionsToday:number;
  msSinceLastSpontaneousQuestion:number;
  organizerEngaged:boolean;
};

/** LIA may be curious without becoming intrusive. A tense or distressed table always wins over curiosity. */
export function liaMayInitiateRelationalQuestion(input:LiaRelationalQuestionContext):boolean{
  if(!input.enabled||input.quiet||input.humanSpeechActive||input.liaSpeaking||input.sensitiveConversation)return false;
  if(input.mode==='table'&&(input.tone==='tense'||input.tone==='distress'||input.tone==='unknown'))return false;
  if(!input.organizerEngaged)return false;
  if(input.questionsLast30Minutes>=2||input.questionsToday>=6)return false;
  if(input.msSinceLastSpontaneousQuestion<10*60*1000)return false;
  const requiredSilence=input.mode==='table'?2500:input.mode==='cooking'?1200:1800;
  return input.silenceMs>=requiredSilence;
}

export function liaTopicAllowedInContext(topic:LiaRelationalTopic,input:{mode:LiaSurfaceMode;tone:LiaSocialToneEstimate}):boolean{
  if(input.tone==='tense'||input.tone==='distress')return false;
  if(input.mode==='table')return topic==='food'||topic==='family'||topic==='plans'||topic==='leisure'||topic==='travel';
  return true;
}

/** Sensitive memories always need explicit consent. Ordinary/personal facts may be retained only after personal memory is enabled. */
export function liaMayPersistRelationshipMemory(input:{personalMemoryEnabled:boolean;sensitivity:LiaRelationshipMemorySensitivity;explicitSaveConsent:boolean}):boolean{
  if(!input.personalMemoryEnabled)return false;
  if(input.sensitivity==='sensitive')return input.explicitSaveConsent;
  return true;
}

/** Personal or sensitive memories can help LIA privately, but are never material for a joke at the family table. */
export function liaMemoryMayBeUsedAtTable(input:{sensitivity:LiaRelationshipMemorySensitivity;householdSafe:boolean;personReactedPositivelyBefore:boolean}):boolean{
  return input.sensitivity==='ordinary'&&input.householdSafe&&input.personReactedPositivelyBefore;
}

export function liaProfileReminderVariant(attempt:number):LiaProfileReminderVariant{
  if(attempt<=0)return 'gentle';
  if(attempt===1)return 'confidante';
  return 'specific';
}

export function liaShouldRemindProfile(input:{gaps:LiaFamilySoftGap[];lastReminderAt:number|null;now:number;dismissedUntil:number|null;sensitiveMoment:boolean;quiet:boolean}):boolean{
  if(!input.gaps.length||input.sensitiveMoment||input.quiet)return false;
  if(input.dismissedUntil!==null&&input.dismissedUntil>input.now)return false;
  if(input.lastReminderAt!==null&&input.now-input.lastReminderAt<24*60*60*1000)return false;
  return true;
}

export function liaProfileReminderKey(variant:LiaProfileReminderVariant,gaps:LiaFamilySoftGap[]):string{
  if(variant==='gentle')return 'lia.profileReminderGentle';
  if(variant==='confidante')return 'lia.profileReminderConfidante';
  if(gaps.length===1&&gaps[0]==='relationship_status')return 'lia.profileReminderRelationship';
  if(gaps.length===1&&gaps[0]==='organizer_age')return 'lia.profileReminderAge';
  if(gaps.length===1&&gaps[0]==='child_age')return 'lia.profileReminderChildAge';
  if(gaps.length===1&&gaps[0]==='organizer_phone')return 'lia.profileReminderPhone';
  if(gaps.length===1&&gaps[0]==='family_phone')return 'lia.profileReminderFamilyPhone';
  return 'lia.profileReminderSpecific';
}

export function liaRelationshipStatusIsKnown(value:LiaRelationshipStatus|''):value is LiaRelationshipStatus{return value!=='';}


export type LiaCuriosityFactGap={
  factKey:string;
  topic:LiaRelationalTopic;
  subjectLabel:string|null;
  sensitivity:LiaRelationshipMemorySensitivity;
  householdSafe:boolean;
  prompt:string;
  priority:number;
};

/**
 * Relationship curiosity is gap-driven. These are possible knowledge gaps,
 * not a questionnaire: the engine selects at most one suitable gap at a time.
 */
export function chooseLiaRelationshipGap(input:{
  gaps:LiaCuriosityFactGap[];
  knownFactKeys:string[];
  recentlyAskedFactKeys:string[];
  mode:LiaSurfaceMode;
  tone:LiaSocialToneEstimate;
  privateContext:boolean;
}):LiaCuriosityFactGap|null{
  if(input.tone==='tense'||input.tone==='distress')return null;
  const known=new Set(input.knownFactKeys),recent=new Set(input.recentlyAskedFactKeys);
  const allowed=input.gaps.filter(gap=>
    !known.has(gap.factKey)&&!recent.has(gap.factKey)&&
    liaTopicAllowedInContext(gap.topic,{mode:input.mode,tone:input.tone})&&
    (gap.sensitivity==='ordinary'||input.privateContext)
  );
  allowed.sort((a,b)=>b.priority-a.priority);
  return allowed[0]??null;
}

export type LiaAnswerMemoryProposal={
  shouldProposeSave:boolean;
  sensitivity:LiaRelationshipMemorySensitivity;
  householdSafe:boolean;
  requiresExplicitConsent:boolean;
};

/**
 * Answers become durable relationship memory only through the existing memory
 * policy. Sensitive facts always require explicit save consent.
 */
export function liaRelationshipAnswerMemoryProposal(input:{
  meaningful:boolean;
  sensitivity:LiaRelationshipMemorySensitivity;
  householdSafe:boolean;
  personalMemoryEnabled:boolean;
}):LiaAnswerMemoryProposal{
  if(!input.meaningful||!input.personalMemoryEnabled)return{shouldProposeSave:false,sensitivity:input.sensitivity,householdSafe:false,requiresExplicitConsent:input.sensitivity==='sensitive'};
  return{
    shouldProposeSave:true,
    sensitivity:input.sensitivity,
    householdSafe:input.sensitivity==='ordinary'&&input.householdSafe,
    requiresExplicitConsent:input.sensitivity==='sensitive',
  };
}

export type LiaLaterDelightKind='remember_preference'|'offer_help'|'family_touch'|'none';

/**
 * A remembered fact can create a later useful or affectionate callback, but
 * private facts never become family-table material.
 */
export function liaLaterDelightKind(input:{
  topic:LiaRelationalTopic;
  sensitivity:LiaRelationshipMemorySensitivity;
  householdSafe:boolean;
  mode:LiaSurfaceMode;
  needsCurrentExternalData:boolean;
}):LiaLaterDelightKind{
  if(input.mode==='table'&&(input.sensitivity!=='ordinary'||!input.householdSafe))return'none';
  if(input.needsCurrentExternalData)return'offer_help';
  if(input.mode==='table'&&(input.topic==='food'||input.topic==='family'||input.topic==='leisure'))return'family_touch';
  return'remember_preference';
}
