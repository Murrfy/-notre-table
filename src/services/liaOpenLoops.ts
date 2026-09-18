import {supabase} from '../lib/supabase';
import {isArray,isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {chooseLiaOpenLoopCandidate,liaOpenLoopCanShowInSharedAppSurface,liaOpenLoopReengagement,liaOpenLoopReengagementBody,type LiaOpenLoop,type LiaOpenLoopAction,type LiaOpenLoopKind,type LiaOpenLoopSensitivity,type LiaOpenLoopSurfaceContext,type LiaOpenLoopStatus,type LiaReengagementHistory,liaReengagementHistoryAfterEvent,liaReengagementHistoryAfterPendingTimeout} from '../lib/liaOpenLoops';

const LOCAL_KEY='@notre-table/lia-open-loops-v1';
const LIA_REENGAGEMENT_HISTORY_KEY='@notre-table/lia-reengagement-history-v1';

function validLoop(value:unknown):value is LiaOpenLoop{
  if(!isRecord(value))return false;
  return typeof value.id==='string'&&(value.householdId===null||typeof value.householdId==='string')&&
    (value.kind==='reminder'||value.kind==='follow_up'||value.kind==='offer_help')&&typeof value.topic==='string'&&
    (value.subjectLabel===null||typeof value.subjectLabel==='string')&&typeof value.summary==='string'&&typeof value.appPrompt==='string'&&
    (value.sensitivity==='ordinary'||value.sensitivity==='personal'||value.sensitivity==='sensitive')&&
    (value.action==='none'||value.action==='alarm'||value.action==='memo'||value.action==='prepare'||value.action==='search'||value.action==='discuss'||value.action==='check_in')&&
    typeof value.dueAtIso==='string'&&(value.expiresAtIso===null||typeof value.expiresAtIso==='string')&&
    (value.notificationPreview===null||typeof value.notificationPreview==='string')&&typeof value.notificationPreviewSafe==='boolean'&&
    (value.status==='open'||value.status==='done'||value.status==='dismissed')&&typeof value.surfaceCount==='number'&&
    (value.lastSurfacedAtIso===null||typeof value.lastSurfacedAtIso==='string')&&typeof value.createdAtIso==='string'&&typeof value.updatedAtIso==='string';
}
function validLoops(value:unknown):value is LiaOpenLoop[]{return isArray(value)&&value.every(validLoop);}
function localId(){return `lia-loop-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;}
async function localList(){return readStoredJson<LiaOpenLoop[]>(LOCAL_KEY,[],validLoops);}
function clean(value:string,max:number){return value.trim().slice(0,max);}

export type SaveLiaOpenLoopInput={
  householdId?:string|null;
  kind:LiaOpenLoopKind;
  topic:string;
  subjectLabel?:string|null;
  summary:string;
  appPrompt:string;
  sensitivity:LiaOpenLoopSensitivity;
  action?:LiaOpenLoopAction;
  dueAt:Date;
  expiresAt?:Date|null;
  notificationPreview?:string|null;
  notificationPreviewSafe?:boolean;
};

function validateInput(input:SaveLiaOpenLoopInput){
  const topic=clean(input.topic,80),summary=clean(input.summary,500),appPrompt=clean(input.appPrompt,500);
  if(!topic||!summary||!appPrompt)throw new Error('LIA_OPEN_LOOP_REQUIRED');
  if(Number.isNaN(input.dueAt.getTime()))throw new Error('LIA_OPEN_LOOP_DUE_REQUIRED');
  if(input.expiresAt&&Number.isNaN(input.expiresAt.getTime()))throw new Error('LIA_OPEN_LOOP_EXPIRY_INVALID');
  if(input.expiresAt&&input.expiresAt.getTime()<=input.dueAt.getTime())throw new Error('LIA_OPEN_LOOP_EXPIRY_BEFORE_DUE');
  const preview=clean(input.notificationPreview??'',180)||null;
  // Only an explicitly safe ordinary subject may ever become lock-screen copy.
  const previewSafe=input.sensitivity==='ordinary'&&input.notificationPreviewSafe===true&&Boolean(preview);
  return {topic,summary,appPrompt,preview,previewSafe};
}

function fromRow(row:any):LiaOpenLoop{return {
  id:row.id,householdId:row.household_id??null,kind:row.kind,topic:row.topic,subjectLabel:row.subject_label||null,
  summary:row.summary,appPrompt:row.app_prompt,sensitivity:row.sensitivity,action:row.action_kind,
  dueAtIso:row.due_at,expiresAtIso:row.expires_at??null,notificationPreview:row.notification_preview??null,
  notificationPreviewSafe:Boolean(row.notification_preview_safe),status:row.status,surfaceCount:Number(row.surface_count??0),
  lastSurfacedAtIso:row.last_surfaced_at??null,createdAtIso:row.created_at,updatedAtIso:row.updated_at,
};}

export async function listLiaOpenLoops(householdId:string|null,demo=false):Promise<LiaOpenLoop[]>{
  if(demo||!supabase){const rows=await localList();return rows.filter(row=>!householdId||row.householdId===householdId);}
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  let query=supabase.from('lia_open_loops').select('*').eq('user_id',user.id).eq('status','open').order('due_at',{ascending:true});
  if(householdId)query=query.eq('household_id',householdId);
  const {data,error}=await query;if(error)throw error;return (data??[]).map(fromRow);
}

export async function saveLiaOpenLoop(input:SaveLiaOpenLoopInput,demo=false):Promise<LiaOpenLoop>{
  const safe=validateInput(input);const now=new Date().toISOString();
  const base:Omit<LiaOpenLoop,'id'>={householdId:input.householdId??null,kind:input.kind,topic:safe.topic,subjectLabel:clean(input.subjectLabel??'',80)||null,summary:safe.summary,appPrompt:safe.appPrompt,sensitivity:input.sensitivity,action:input.action??'none',dueAtIso:input.dueAt.toISOString(),expiresAtIso:input.expiresAt?.toISOString()??null,notificationPreview:safe.preview,notificationPreviewSafe:safe.previewSafe,status:'open',surfaceCount:0,lastSurfacedAtIso:null,createdAtIso:now,updatedAtIso:now};
  if(demo||!supabase){const row:LiaOpenLoop={id:localId(),...base};const rows=await localList();await writeStoredJson(LOCAL_KEY,[row,...rows]);return row;}
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('lia_open_loops').insert({user_id:user.id,household_id:base.householdId,kind:base.kind,topic:base.topic,subject_label:base.subjectLabel??'',summary:base.summary,app_prompt:base.appPrompt,sensitivity:base.sensitivity,action_kind:base.action,due_at:base.dueAtIso,expires_at:base.expiresAtIso,notification_preview:base.notificationPreview,notification_preview_safe:base.notificationPreviewSafe}).select('*').single();
  if(error)throw error;return fromRow(data);
}

export async function updateLiaOpenLoopStatus(idValue:string,status:Exclude<LiaOpenLoopStatus,'open'>,demo=false):Promise<void>{
  if(demo||!supabase){const rows=await localList();await writeStoredJson(LOCAL_KEY,rows.map(row=>row.id===idValue?{...row,status,updatedAtIso:new Date().toISOString()}:row));return;}
  const {error}=await supabase.from('lia_open_loops').update({status,updated_at:new Date().toISOString()}).eq('id',idValue);if(error)throw error;
}

export async function noteLiaOpenLoopSurfaced(idValue:string,demo=false,now=new Date()):Promise<void>{
  if(demo||!supabase){const rows=await localList();await writeStoredJson(LOCAL_KEY,rows.map(row=>row.id===idValue?{...row,surfaceCount:row.surfaceCount+1,lastSurfacedAtIso:now.toISOString(),updatedAtIso:now.toISOString()}:row));return;}
  const {data,error}=await supabase.from('lia_open_loops').select('surface_count').eq('id',idValue).single();if(error)throw error;
  const {error:updateError}=await supabase.from('lia_open_loops').update({surface_count:Number(data?.surface_count??0)+1,last_surfaced_at:now.toISOString(),updated_at:now.toISOString()}).eq('id',idValue);if(updateError)throw updateError;
}

export async function nextDueLiaOpenLoop(householdId:string|null,context:LiaOpenLoopSurfaceContext,demo=false):Promise<LiaOpenLoop|null>{
  const loops=await listLiaOpenLoops(householdId,demo);return chooseLiaOpenLoopCandidate(loops,context);
}

export async function nextDueLiaOpenLoopForSharedSurface(householdId:string|null,context:LiaOpenLoopSurfaceContext,demo=false):Promise<LiaOpenLoop|null>{
  const loops=(await listLiaOpenLoops(householdId,demo)).filter(liaOpenLoopCanShowInSharedAppSurface);
  return chooseLiaOpenLoopCandidate(loops,context);
}


export type LiaOpenLoopReengagementRuntime={
  loop:LiaOpenLoop|null;
  channel:'none'|'in_app'|'notification';
  body:string|null;
  reason:'not_due'|'quiet'|'too_soon'|'ignored_too_often'|'private'|'useful_context'|'no_thread';
};

/** Connects V0.201 policy to the real persisted open-loop service. */
export async function nextLiaOpenLoopReengagement(input:{
  householdId:string|null;
  now:Date;
  quiet:boolean;
  appForeground:boolean;
  ignoredReengagements?:number;
  lastReengagementAtIso?:string|null;
  genericPrivatePreview:string;
  demo?:boolean;
}):Promise<LiaOpenLoopReengagementRuntime>{
  const history=await reconcileLiaPendingReengagement(input.now);
  const ignoredReengagements=input.ignoredReengagements??history.ignoredCount;
  const lastReengagementAtIso=input.lastReengagementAtIso===undefined?history.lastSentAtIso:input.lastReengagementAtIso;
  const loops=await listLiaOpenLoops(input.householdId,input.demo??false);
  const due=loops.filter(loop=>loop.status==='open').sort((a,b)=>Date.parse(a.dueAtIso)-Date.parse(b.dueAtIso));
  for(const loop of due){
    const decision=liaOpenLoopReengagement({
      loop,now:input.now,quiet:input.quiet,appForeground:input.appForeground,
      ignoredReengagements,lastReengagementAtIso,
    });
    if(decision.channel==='none'&&decision.reason==='not_due')continue;
    return{loop,channel:decision.channel,body:liaOpenLoopReengagementBody({decision,loop,genericPrivatePreview:input.genericPrivatePreview}),reason:decision.reason};
  }
  return{loop:null,channel:'none',body:null,reason:'no_thread'};
}


function validReengagementHistory(value:unknown):value is LiaReengagementHistory{
  return isRecord(value)&&(value.lastSentAtIso===null||typeof value.lastSentAtIso==='string')&&
    typeof value.ignoredCount==='number'&&Number.isInteger(value.ignoredCount)&&value.ignoredCount>=0&&
    (value.pendingOpenLoopId===undefined||value.pendingOpenLoopId===null||typeof value.pendingOpenLoopId==='string')&&
    (value.pendingSentAtIso===undefined||value.pendingSentAtIso===null||typeof value.pendingSentAtIso==='string');
}
export async function getLiaReengagementHistory():Promise<LiaReengagementHistory>{
  return readStoredJson<LiaReengagementHistory>(LIA_REENGAGEMENT_HISTORY_KEY,{lastSentAtIso:null,ignoredCount:0},validReengagementHistory);
}

export async function reconcileLiaPendingReengagement(now=new Date(),timeoutMs?:number):Promise<LiaReengagementHistory>{
  const history=await getLiaReengagementHistory();
  const next=liaReengagementHistoryAfterPendingTimeout({history,now,timeoutMs});
  if(next!==history)await writeStoredJson(LIA_REENGAGEMENT_HISTORY_KEY,next);
  return next;
}

export async function noteLiaReengagementEvent(event:'sent'|'opened'|'dismissed',now=new Date(),openLoopId:string|null=null):Promise<LiaReengagementHistory>{
  const history=await getLiaReengagementHistory();
  const next=liaReengagementHistoryAfterEvent({history,event,now,openLoopId});
  await writeStoredJson(LIA_REENGAGEMENT_HISTORY_KEY,next);
  return next;
}
