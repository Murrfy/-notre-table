export type LiaDailyEventKind='appointment'|'child_pickup'|'errand'|'purchase'|'work'|'family'|'other';
export type LiaRightHandOfferKind='ask_time'|'set_alarm'|'set_recurring_alarm'|'prepare_notes'|'search'|'save_memo'|'follow_up';
export type LiaRightHandOffer={
  kind:LiaRightHandOfferKind;
  requiresConfirmation:boolean;
  requiresLiveData:boolean;
  private:boolean;
};

export type LiaRightHandContext={
  eventKind:LiaDailyEventKind;
  timeKnown:boolean;
  recurring:boolean;
  notesPrepared?:boolean;
  needsCurrentExternalData?:boolean;
  sensitivity:'ordinary'|'personal'|'sensitive';
};

function add(list:LiaRightHandOffer[],offer:LiaRightHandOffer){
  if(!list.some(existing=>existing.kind===offer.kind))list.push(offer);
}

/**
 * Deterministic action policy for LIA's "right hand" behavior.
 * The language model may phrase these offers naturally, but it may not skip
 * confirmation for an action that changes the user's reminders or data.
 */
export function liaRightHandOffers(input:LiaRightHandContext):LiaRightHandOffer[]{
  const offers:LiaRightHandOffer[]=[];
  const privateAction=input.sensitivity!=='ordinary';

  if(input.eventKind==='child_pickup'){
    if(!input.timeKnown)add(offers,{kind:'ask_time',requiresConfirmation:false,requiresLiveData:false,private:false});
    else add(offers,{kind:'set_alarm',requiresConfirmation:true,requiresLiveData:false,private:false});
    if(input.recurring)add(offers,{kind:'set_recurring_alarm',requiresConfirmation:true,requiresLiveData:false,private:false});
    add(offers,{kind:'follow_up',requiresConfirmation:true,requiresLiveData:false,private:false});
  }else if(input.eventKind==='appointment'){
    if(!input.notesPrepared)add(offers,{kind:'prepare_notes',requiresConfirmation:true,requiresLiveData:false,private:privateAction});
    if(!input.timeKnown)add(offers,{kind:'ask_time',requiresConfirmation:false,requiresLiveData:false,private:privateAction});
    else add(offers,{kind:'set_alarm',requiresConfirmation:true,requiresLiveData:false,private:privateAction});
    add(offers,{kind:'follow_up',requiresConfirmation:true,requiresLiveData:false,private:privateAction});
  }else if(input.eventKind==='purchase'){
    add(offers,{kind:'search',requiresConfirmation:true,requiresLiveData:true,private:privateAction});
    add(offers,{kind:'save_memo',requiresConfirmation:true,requiresLiveData:false,private:privateAction});
    add(offers,{kind:'follow_up',requiresConfirmation:true,requiresLiveData:false,private:privateAction});
  }else{
    if(input.timeKnown)add(offers,{kind:'set_alarm',requiresConfirmation:true,requiresLiveData:false,private:privateAction});
    if(input.needsCurrentExternalData)add(offers,{kind:'search',requiresConfirmation:true,requiresLiveData:true,private:privateAction});
    add(offers,{kind:'follow_up',requiresConfirmation:true,requiresLiveData:false,private:privateAction});
  }
  return offers.slice(0,3);
}

export function liaRightHandMustStayPrivate(offer:LiaRightHandOffer):boolean{return offer.private;}


export type LiaDayThread={
  id:string;
  eventKind:LiaDailyEventKind;
  label:string;
  timeIso:string|null;
  recurring:boolean;
  sensitivity:'ordinary'|'personal'|'sensitive';
  completed:boolean;
  followUpDue:boolean;
  needsCurrentExternalData:boolean;
};

export type LiaDayBrief={
  nextThread:LiaDayThread|null;
  askForMissingTime:boolean;
  offer:LiaRightHandOffer|null;
  remainingOpenCount:number;
};

/**
 * Gives LIA a compact "what matters next" view instead of treating every
 * remembered event as equally urgent. It never performs the action itself.
 */
export function liaBuildDayBrief(input:{threads:LiaDayThread[];nowIso:string}):LiaDayBrief{
  const now=Date.parse(input.nowIso);
  const open=input.threads.filter(thread=>!thread.completed);
  const scored=open.map(thread=>{
    const at=thread.timeIso?Date.parse(thread.timeIso):NaN;
    const missingTime=!thread.timeIso;
    const overdue=Number.isFinite(at)&&Number.isFinite(now)&&at<now;
    const soon=Number.isFinite(at)&&Number.isFinite(now)&&at>=now&&at-now<=3*60*60*1000;
    const score=(thread.followUpDue?40:0)+(soon?30:0)+(overdue?20:0)+(missingTime?10:0);
    return{thread,score,at:Number.isFinite(at)?at:Number.POSITIVE_INFINITY};
  }).sort((a,b)=>b.score-a.score||a.at-b.at);
  const next=scored[0]?.thread??null;
  if(!next)return{nextThread:null,askForMissingTime:false,offer:null,remainingOpenCount:0};
  const offers=liaRightHandOffers({
    eventKind:next.eventKind,
    timeKnown:Boolean(next.timeIso),
    recurring:next.recurring,
    needsCurrentExternalData:next.needsCurrentExternalData,
    sensitivity:next.sensitivity,
  });
  return{
    nextThread:next,
    askForMissingTime:!next.timeIso,
    offer:offers[0]??null,
    remainingOpenCount:open.length,
  };
}

export function liaDayBriefMaySurface(input:{
  brief:LiaDayBrief;
  quiet:boolean;
  humanSpeechActive:boolean;
  mode:'idle'|'cooking'|'table';
}):boolean{
  if(!input.brief.nextThread||input.quiet||input.humanSpeechActive)return false;
  if(input.mode==='table'&&input.brief.nextThread.sensitivity!=='ordinary')return false;
  return true;
}


export type LiaFollowUpOutcome='unknown'|'went_well'|'needs_action'|'cancelled';
export type LiaFollowUpDecision={
  askHowItWent:boolean;
  proposeMemo:boolean;
  proposeNextStep:boolean;
  closeThread:boolean;
};

/** A right hand closes loops: after an event, LIA follows up once and adapts. */
export function liaFollowUpDecision(input:{
  eventFinished:boolean;
  outcome:LiaFollowUpOutcome;
  followUpAlreadyAsked:boolean;
  userDismissed:boolean;
  sensitivity:'ordinary'|'personal'|'sensitive';
}):LiaFollowUpDecision{
  if(!input.eventFinished||input.userDismissed)return{askHowItWent:false,proposeMemo:false,proposeNextStep:false,closeThread:input.userDismissed};
  if(!input.followUpAlreadyAsked&&input.outcome==='unknown')return{askHowItWent:true,proposeMemo:false,proposeNextStep:false,closeThread:false};
  if(input.outcome==='needs_action')return{askHowItWent:false,proposeMemo:true,proposeNextStep:true,closeThread:false};
  if(input.outcome==='went_well'||input.outcome==='cancelled')return{askHowItWent:false,proposeMemo:false,proposeNextStep:false,closeThread:true};
  return{askHowItWent:false,proposeMemo:false,proposeNextStep:false,closeThread:false};
}
