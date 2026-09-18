export type LiaOpenLoopKind='reminder'|'follow_up'|'offer_help';
export type LiaOpenLoopSensitivity='ordinary'|'personal'|'sensitive';
export type LiaOpenLoopAction='none'|'alarm'|'memo'|'prepare'|'search'|'discuss'|'check_in';
export type LiaOpenLoopStatus='open'|'done'|'dismissed';

export type LiaOpenLoop={
  id:string;
  householdId:string|null;
  kind:LiaOpenLoopKind;
  topic:string;
  subjectLabel:string|null;
  summary:string;
  appPrompt:string;
  sensitivity:LiaOpenLoopSensitivity;
  action:LiaOpenLoopAction;
  dueAtIso:string;
  expiresAtIso:string|null;
  notificationPreview:string|null;
  notificationPreviewSafe:boolean;
  status:LiaOpenLoopStatus;
  surfaceCount:number;
  lastSurfacedAtIso:string|null;
  createdAtIso:string;
  updatedAtIso:string;
};

export type LiaOpenLoopSurfaceContext={
  now:Date;
  quiet:boolean;
  mode:'idle'|'cooking'|'table';
  humanSpeechActive:boolean;
  organizerEngaged:boolean;
};

const MIN_RESURFACE_MS=4*60*60*1000;
const MAX_SURFACES=3;

function time(value:string|null):number|null{
  if(!value)return null;
  const parsed=Date.parse(value);
  return Number.isFinite(parsed)?parsed:null;
}

export function liaOpenLoopDue(loop:LiaOpenLoop,now=new Date()):boolean{
  if(loop.status!=='open')return false;
  const due=time(loop.dueAtIso);
  if(due===null||due>now.getTime())return false;
  const expires=time(loop.expiresAtIso);
  return expires===null||expires>now.getTime();
}

export function liaOpenLoopMaySurface(loop:LiaOpenLoop,context:LiaOpenLoopSurfaceContext):boolean{
  if(!liaOpenLoopDue(loop,context.now)||context.quiet||context.humanSpeechActive||!context.organizerEngaged)return false;
  if(loop.surfaceCount>=MAX_SURFACES)return false;
  const last=time(loop.lastSurfacedAtIso);
  if(last!==null&&context.now.getTime()-last<MIN_RESURFACE_MS)return false;
  // Personal/sensitive threads never jump into a family table conversation.
  if(context.mode==='table'&&loop.sensitivity!=='ordinary')return false;
  return true;
}

function kindPriority(kind:LiaOpenLoopKind):number{return kind==='reminder'?30:kind==='follow_up'?20:10;}
function actionPriority(action:LiaOpenLoopAction):number{return action==='alarm'||action==='prepare'?5:action==='check_in'?3:1;}

export function chooseLiaOpenLoopCandidate(loops:LiaOpenLoop[],context:LiaOpenLoopSurfaceContext):LiaOpenLoop|null{
  const candidates=loops.filter(loop=>liaOpenLoopMaySurface(loop,context));
  candidates.sort((a,b)=>{
    const aDue=time(a.dueAtIso)??context.now.getTime();
    const bDue=time(b.dueAtIso)??context.now.getTime();
    const aScore=kindPriority(a.kind)+actionPriority(a.action)-a.surfaceCount*4;
    const bScore=kindPriority(b.kind)+actionPriority(b.action)-b.surfaceCount*4;
    if(aScore!==bScore)return bScore-aScore;
    return aDue-bDue;
  });
  return candidates[0]??null;
}

export function liaOpenLoopCanShowInSharedAppSurface(loop:LiaOpenLoop):boolean{
  // A lock screen is not the only place that can leak context: the main app may
  // also be visible to family. Personal and sensitive follow-ups stay private.
  return loop.sensitivity==='ordinary';
}

export function liaOpenLoopNotificationBody(loop:LiaOpenLoop,genericPreview:string):string{
  if(loop.sensitivity!=='ordinary'||!loop.notificationPreviewSafe)return genericPreview;
  const preview=loop.notificationPreview?.trim();
  return preview||genericPreview;
}

export function liaOpenLoopNeedsPrivateChannel(loop:LiaOpenLoop):boolean{
  return loop.sensitivity!=='ordinary';
}


export type LiaReengagementDecision={
  channel:'none'|'in_app'|'notification';
  bodyMode:'none'|'contextual'|'generic_private';
  reason:'not_due'|'quiet'|'too_soon'|'ignored_too_often'|'private'|'useful_context';
};

/**
 * Re-engagement must be earned by a real open loop. LIA never sends a generic
 * "come back" nudge merely to increase app opens.
 */
export function liaOpenLoopReengagement(input:{
  loop:LiaOpenLoop;
  now:Date;
  quiet:boolean;
  appForeground:boolean;
  ignoredReengagements:number;
  lastReengagementAtIso:string|null;
}):LiaReengagementDecision{
  if(!liaOpenLoopDue(input.loop,input.now))return{channel:'none',bodyMode:'none',reason:'not_due'};
  if(input.quiet)return{channel:'none',bodyMode:'none',reason:'quiet'};
  const last=time(input.lastReengagementAtIso);
  if(last!==null&&input.now.getTime()-last<12*60*60*1000)return{channel:'none',bodyMode:'none',reason:'too_soon'};
  if(input.ignoredReengagements>=2)return{channel:'none',bodyMode:'none',reason:'ignored_too_often'};
  if(input.appForeground){
    if(input.loop.sensitivity!=='ordinary')return{channel:'none',bodyMode:'none',reason:'private'};
    return{channel:'in_app',bodyMode:'contextual',reason:'useful_context'};
  }
  if(input.loop.sensitivity!=='ordinary'||!input.loop.notificationPreviewSafe){
    return{channel:'notification',bodyMode:'generic_private',reason:'private'};
  }
  return{channel:'notification',bodyMode:'contextual',reason:'useful_context'};
}

export function liaOpenLoopReengagementBody(input:{
  decision:LiaReengagementDecision;
  loop:LiaOpenLoop;
  genericPrivatePreview:string;
}):string|null{
  if(input.decision.channel==='none')return null;
  if(input.decision.bodyMode==='generic_private')return input.genericPrivatePreview;
  const preview=input.loop.notificationPreview?.trim();
  return preview||input.loop.appPrompt.trim()||null;
}


export type LiaReengagementHistory={
  lastSentAtIso:string|null;
  ignoredCount:number;
  pendingOpenLoopId?:string|null;
  pendingSentAtIso?:string|null;
};

export function liaReengagementHistoryAfterEvent(input:{
  history:LiaReengagementHistory;
  event:'sent'|'opened'|'dismissed';
  now:Date;
  openLoopId?:string|null;
}):LiaReengagementHistory{
  if(input.event==='sent')return{
    lastSentAtIso:input.now.toISOString(),ignoredCount:input.history.ignoredCount,
    pendingOpenLoopId:input.openLoopId??null,pendingSentAtIso:input.now.toISOString(),
  };
  if(input.event==='opened')return{
    lastSentAtIso:input.history.lastSentAtIso,ignoredCount:0,pendingOpenLoopId:null,pendingSentAtIso:null,
  };
  return{
    lastSentAtIso:input.history.lastSentAtIso,ignoredCount:Math.min(99,input.history.ignoredCount+1),
    pendingOpenLoopId:null,pendingSentAtIso:null,
  };
}


export function liaReengagementHistoryAfterPendingTimeout(input:{
  history:LiaReengagementHistory;
  now:Date;
  timeoutMs?:number;
}):LiaReengagementHistory{
  const sent=input.history.pendingSentAtIso;
  if(!input.history.pendingOpenLoopId||!sent)return input.history;
  const sentAt=Date.parse(sent);
  const timeout=Math.max(60_000,input.timeoutMs??24*60*60*1000);
  if(Number.isNaN(sentAt)||input.now.getTime()-sentAt<timeout)return input.history;
  return{
    lastSentAtIso:input.history.lastSentAtIso,
    ignoredCount:Math.min(99,input.history.ignoredCount+1),
    pendingOpenLoopId:null,
    pendingSentAtIso:null,
  };
}
