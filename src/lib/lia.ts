export type LiaSurfaceMode='idle'|'cooking'|'table';
export type LiaSocialLevel='discreet'|'present'|'host';
export type LiaMemoryVisibility='organizer'|'member_private'|'household';
export type LiaMemoryKind='allergy'|'diet'|'nutrition_goal'|'cooking_skill'|'preference'|'portion_habit'|'schedule'|'leftover'|'restaurant_feedback'|'recipe_feedback'|'guest_note';

export type LiaMemoryEntry={
  id:string;
  householdId:string;
  kind:LiaMemoryKind;
  subjectUserId?:string|null;
  value:Record<string,unknown>;
  visibility:LiaMemoryVisibility;
  confirmed:boolean;
  validFrom?:string|null;
  validUntil?:string|null;
};

export type LiaConversationState={
  enabled:boolean;
  mode:LiaSurfaceMode;
  socialLevel:LiaSocialLevel;
  directAddressed:boolean;
  humanSpeechActive:boolean;
  silenceMs:number;
  hasUsefulIntervention:boolean;
};

export type LiaQuestionDecision={
  answerAlreadyKnown:boolean;
  answerWouldChangeDecision:boolean;
  askedRecently:boolean;
  sensitiveWithoutConsent:boolean;
};

export function liaMayAskQuestion(input:LiaQuestionDecision):boolean{
  return !input.answerAlreadyKnown&&input.answerWouldChangeDecision&&!input.askedRecently&&!input.sensitiveWithoutConsent;
}

export function liaMaySpeak(input:LiaConversationState):boolean{
  if(!input.enabled||input.humanSpeechActive)return false;
  if(input.directAddressed)return input.silenceMs>=250;
  if(!input.hasUsefulIntervention||input.socialLevel==='discreet')return false;
  const requiredSilence=input.mode==='table'?1500:input.mode==='cooking'?700:1000;
  return input.silenceMs>=requiredSilence;
}

export function liaMustYieldToHuman(humanSpeechActive:boolean):boolean{
  return humanSpeechActive;
}

export function liaMemoryIsActive(entry:LiaMemoryEntry,nowIso:string):boolean{
  if(!entry.confirmed)return false;
  const now=Date.parse(nowIso);
  if(!Number.isFinite(now))return false;
  if(entry.validFrom&&Date.parse(entry.validFrom)>now)return false;
  if(entry.validUntil&&Date.parse(entry.validUntil)<now)return false;
  return true;
}

export function liaCanSayMemoryToHousehold(entry:LiaMemoryEntry):boolean{
  return entry.confirmed&&entry.visibility==='household';
}

export function liaShouldOfferLeftover(args:{availablePortions:number;expectedEaters:number;memberCookingComfort:'low'|'medium'|'high';memberAlone:boolean}):boolean{
  return args.memberAlone&&args.availablePortions>=1&&args.expectedEaters===1&&args.memberCookingComfort==='low';
}


export type LiaHelpDomain='meal'|'shopping'|'travel'|'purchase'|'schedule'|'rest'|'household'|'general';
export type LiaHelpAction=
  |'check_stock'
  |'ask_family'
  |'manage_timers'
  |'simplify_recipe'
  |'safe_pause'
  |'compare_prices'
  |'compare_options'
  |'locate_place'
  |'check_traffic'
  |'optimize_route'
  |'search_web'
  |'save_memory'
  |'plan_next_step';

export type LiaHelpContext={
  domain:LiaHelpDomain;
  goal:string;
  mode?:LiaSurfaceMode;
  hasKnownStock?:boolean;
  headcountKnown?:boolean;
  multipleStops?:boolean;
  needsCurrentExternalData?:boolean;
  userTired?:boolean;
  activeHeat?:boolean;
};

export type LiaHelpSuggestion={
  action:LiaHelpAction;
  reason:'reduce_search'|'avoid_forgetting'|'save_money'|'save_time'|'reduce_decision'|'safety'|'use_context';
  requiresConfirmation:boolean;
  requiresLiveData:boolean;
};

function addHelp(list:LiaHelpSuggestion[],item:LiaHelpSuggestion){
  if(!list.some(existing=>existing.action===item.action))list.push(item);
}

/**
 * LIA's primary policy is to look for the next useful piece of help, not merely
 * generate a conversational reply. This router stays deterministic; an LLM may
 * phrase the suggestions, but it must not bypass these product constraints.
 */
export function liaSuggestHelp(input:LiaHelpContext):LiaHelpSuggestion[]{
  const suggestions:LiaHelpSuggestion[]=[];
  if(input.domain==='meal'){
    if(input.headcountKnown===false)addHelp(suggestions,{action:'ask_family',reason:'use_context',requiresConfirmation:true,requiresLiveData:false});
    if(input.hasKnownStock)addHelp(suggestions,{action:'check_stock',reason:'avoid_forgetting',requiresConfirmation:false,requiresLiveData:false});
    if(input.mode==='cooking')addHelp(suggestions,{action:'manage_timers',reason:'avoid_forgetting',requiresConfirmation:true,requiresLiveData:false});
    addHelp(suggestions,{action:'plan_next_step',reason:'reduce_decision',requiresConfirmation:true,requiresLiveData:false});
  }
  if(input.domain==='shopping'){
    if(input.hasKnownStock)addHelp(suggestions,{action:'check_stock',reason:'avoid_forgetting',requiresConfirmation:false,requiresLiveData:false});
    addHelp(suggestions,{action:'compare_prices',reason:'save_money',requiresConfirmation:true,requiresLiveData:true});
    if(input.multipleStops)addHelp(suggestions,{action:'optimize_route',reason:'save_time',requiresConfirmation:true,requiresLiveData:true});
    else addHelp(suggestions,{action:'locate_place',reason:'save_time',requiresConfirmation:true,requiresLiveData:true});
  }
  if(input.domain==='travel'||input.domain==='schedule'){
    addHelp(suggestions,{action:'check_traffic',reason:'save_time',requiresConfirmation:true,requiresLiveData:true});
    if(input.multipleStops)addHelp(suggestions,{action:'optimize_route',reason:'save_time',requiresConfirmation:true,requiresLiveData:true});
    addHelp(suggestions,{action:'plan_next_step',reason:'reduce_decision',requiresConfirmation:true,requiresLiveData:false});
  }
  if(input.domain==='purchase'){
    addHelp(suggestions,{action:'compare_options',reason:'reduce_decision',requiresConfirmation:true,requiresLiveData:true});
    addHelp(suggestions,{action:'compare_prices',reason:'save_money',requiresConfirmation:true,requiresLiveData:true});
    addHelp(suggestions,{action:'locate_place',reason:'save_time',requiresConfirmation:true,requiresLiveData:true});
  }
  if(input.domain==='rest'||input.userTired){
    if(input.activeHeat)addHelp(suggestions,{action:'safe_pause',reason:'safety',requiresConfirmation:true,requiresLiveData:false});
    else addHelp(suggestions,{action:'plan_next_step',reason:'reduce_decision',requiresConfirmation:true,requiresLiveData:false});
    if(input.mode==='cooking')addHelp(suggestions,{action:'manage_timers',reason:'avoid_forgetting',requiresConfirmation:true,requiresLiveData:false});
  }
  if(input.domain==='household'){
    addHelp(suggestions,{action:'save_memory',reason:'use_context',requiresConfirmation:true,requiresLiveData:false});
    addHelp(suggestions,{action:'plan_next_step',reason:'reduce_decision',requiresConfirmation:true,requiresLiveData:false});
  }
  if(input.domain==='general'&&input.needsCurrentExternalData){
    addHelp(suggestions,{action:'search_web',reason:'reduce_search',requiresConfirmation:true,requiresLiveData:true});
  }
  return suggestions.slice(0,3);
}

export function liaMayAskGoalFollowUp(input:{questionsAlreadyAsked:number;answerNeededForGoal:boolean;userEngaged:boolean}):boolean{
  return input.answerNeededForGoal&&input.userEngaged&&input.questionsAlreadyAsked<3;
}

export function liaCanSuggestRestDuringCooking(input:{activeHeat:boolean;applianceCanBeSafelyLeft:boolean}):boolean{
  return !input.activeHeat&&input.applianceCanBeSafelyLeft;
}
