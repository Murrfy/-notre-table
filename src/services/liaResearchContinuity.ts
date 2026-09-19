import type {LiaOpenLoopSensitivity} from '../lib/liaOpenLoops';

export type LiaResearchContinuationInput={
  householdId:string|null;
  topic:string;
  subjectLabel?:string|null;
  summary:string;
  resumePrompt:string;
  sensitivity:LiaOpenLoopSensitivity;
  promisingResult?:{label:string;url:string}|null;
};

export type LiaResearchContinuationPlan={
  openLoop:{
    householdId:string|null;
    kind:'follow_up';
    topic:string;
    subjectLabel:string|null;
    summary:string;
    appPrompt:string;
    sensitivity:LiaOpenLoopSensitivity;
    action:'search';
    dueAt:Date;
    expiresAt:Date;
    notificationPreview:string|null;
    notificationPreviewSafe:boolean;
  };
  memoSuggestion:{title:string;summary:string;link:{kind:'other';ref:string;label:string}|null}|null;
};

function clean(value:string,max:number){return value.trim().replace(/\s+/g,' ').slice(0,max);}

/**
 * Turns an interrupted user-requested research task into a bounded continuation.
 * This is continuity state, not permission to persist arbitrary conversation.
 * Mémos remain voluntary: a useful result is only returned as a suggestion.
 */
export function planLiaResearchContinuation(input:LiaResearchContinuationInput,now=new Date()):LiaResearchContinuationPlan{
  const topic=clean(input.topic,80);
  const summary=clean(input.summary,500);
  const resumePrompt=clean(input.resumePrompt,500);
  if(!topic||!summary||!resumePrompt)throw new Error('LIA_RESEARCH_CONTINUATION_REQUIRED');
  const dueAt=new Date(now.getTime()+30*60*1000);
  const expiresAt=new Date(now.getTime()+14*24*60*60*1000);
  const result=input.promisingResult;
  const safeOrdinary=input.sensitivity==='ordinary';
  const notificationPreview=result&&safeOrdinary?clean(`${input.subjectLabel??topic} : piste potentiellement trouvée`,180):null;
  const link=result?.url.trim()||'';
  const memoSuggestion=result?{
    title:clean(input.subjectLabel??topic,120),
    summary:clean(`${summary} — Piste : ${result.label}`,500),
    link:link?{kind:'other' as const,ref:link,label:clean(result.label,160)}:null,
  }:null;
  return{
    openLoop:{
      householdId:input.householdId,kind:'follow_up',topic,
      subjectLabel:clean(input.subjectLabel??'',80)||null,
      summary,appPrompt:resumePrompt,sensitivity:input.sensitivity,action:'search',
      dueAt,expiresAt,notificationPreview,notificationPreviewSafe:Boolean(notificationPreview),
    },
    memoSuggestion,
  };
}

export function liaResearchContinuationCanAutoPersistMemo():false{return false;}
