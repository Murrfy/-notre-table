import {supabase} from '../lib/supabase';
import {isArray,isRecord,readStoredJson,writeStoredJson} from '../lib/storage';

export type LiaCalendarEvent={
  id:string;
  title:string;
  starts_at:string;
  ends_at:string|null;
  all_day:boolean;
  location:string|null;
  notes:string|null;
  reminder_minutes_before:number|null;
  recurrence_series_id:string|null;
  recurrence_index:number|null;
  created_at:string;
  updated_at:string;
};

const DEMO_KEY='@notre-table/lia-calendar-demo-v1';
function valid(value:unknown):value is LiaCalendarEvent{
  if(!isRecord(value))return false;
  return typeof value.id==='string'&&typeof value.title==='string'&&typeof value.starts_at==='string'&&
    (value.ends_at===null||typeof value.ends_at==='string')&&typeof value.all_day==='boolean'&&
    (value.location===null||typeof value.location==='string')&&(value.notes===null||typeof value.notes==='string')&&
    (value.reminder_minutes_before===null||(typeof value.reminder_minutes_before==='number'&&Number.isInteger(value.reminder_minutes_before)&&value.reminder_minutes_before>=0&&value.reminder_minutes_before<=10080))&&
    (value.recurrence_series_id===null||typeof value.recurrence_series_id==='string')&&
    (value.recurrence_index===null||(typeof value.recurrence_index==='number'&&Number.isInteger(value.recurrence_index)&&value.recurrence_index>=0))&&
    typeof value.created_at==='string'&&typeof value.updated_at==='string';
}
function validList(value:unknown):value is LiaCalendarEvent[]{return isArray(value)&&value.every(valid);}
async function localList(){
  const raw=await readStoredJson<unknown[]>(DEMO_KEY,[],value=>Array.isArray(value));
  // Backward compatibility for V0.264 demo events created before reminders existed.
  return raw.map(value=>{if(!isRecord(value))return value;return{...value,reminder_minutes_before:value.reminder_minutes_before===undefined?null:value.reminder_minutes_before,recurrence_series_id:value.recurrence_series_id===undefined?null:value.recurrence_series_id,recurrence_index:value.recurrence_index===undefined?null:value.recurrence_index};}).filter(valid);
}
async function localWrite(rows:LiaCalendarEvent[]){await writeStoredJson(DEMO_KEY,rows);}
function localId(){return`cal-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;}
function validReminder(value:number|null|undefined){
  if(value===undefined||value===null)return value??null;
  if(!Number.isInteger(value)||value<0||value>10080)throw new Error('CALENDAR_REMINDER_INVALID');
  return value;
}
const fields='id,title,starts_at,ends_at,all_day,location,notes,reminder_minutes_before,recurrence_series_id,recurrence_index,created_at,updated_at';

export async function listLiaCalendarEvents(input:{from?:Date;to?:Date;limit?:number;demo?:boolean}={}):Promise<LiaCalendarEvent[]>{
  const from=(input.from??new Date()).toISOString();const to=input.to?.toISOString()??null;const limit=Math.max(1,Math.min(200,input.limit??50));
  if(input.demo||!supabase){
    const rows=await localList();return rows.filter(row=>row.starts_at>=from&&(!to||row.starts_at<to)).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,limit);
  }
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  let query=supabase.from('lia_calendar_events').select(fields).eq('user_id',user.id).gte('starts_at',from).order('starts_at',{ascending:true}).limit(limit);
  if(to)query=query.lt('starts_at',to);
  const {data,error}=await query;if(error)throw error;return(data??[]) as LiaCalendarEvent[];
}

export async function createLiaCalendarEvent(input:{title:string;startsAt:Date;endsAt?:Date|null;allDay?:boolean;location?:string|null;notes?:string|null;reminderMinutesBefore?:number|null;recurrenceSeriesId?:string|null;recurrenceIndex?:number|null;demo?:boolean}):Promise<LiaCalendarEvent>{
  const title=input.title.trim();if(!title)throw new Error('CALENDAR_TITLE_REQUIRED');
  if(Number.isNaN(input.startsAt.getTime()))throw new Error('CALENDAR_START_REQUIRED');
  const endsAt=input.endsAt??null;if(endsAt&&Number.isNaN(endsAt.getTime()))throw new Error('CALENDAR_END_INVALID');
  if(endsAt&&endsAt.getTime()<=input.startsAt.getTime())throw new Error('CALENDAR_END_BEFORE_START');
  const location=input.location?.trim()||null,notes=input.notes?.trim()||null,reminderMinutesBefore=validReminder(input.reminderMinutesBefore),recurrenceSeriesId=input.recurrenceSeriesId?.trim()||null,recurrenceIndex=input.recurrenceIndex??null;
  if((recurrenceSeriesId===null)!=(recurrenceIndex===null)||recurrenceIndex!==null&&(!Number.isInteger(recurrenceIndex)||recurrenceIndex<0))throw new Error('CALENDAR_RECURRENCE_INVALID');
  if(input.demo||!supabase){
    const now=new Date().toISOString();const row:LiaCalendarEvent={id:localId(),title,starts_at:input.startsAt.toISOString(),ends_at:endsAt?.toISOString()??null,all_day:Boolean(input.allDay),location,notes,reminder_minutes_before:reminderMinutesBefore,recurrence_series_id:recurrenceSeriesId,recurrence_index:recurrenceIndex,created_at:now,updated_at:now};
    const rows=await localList();await localWrite([...rows,row].sort((a,b)=>a.starts_at.localeCompare(b.starts_at)));return row;
  }
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('lia_calendar_events').insert({user_id:user.id,title,starts_at:input.startsAt.toISOString(),ends_at:endsAt?.toISOString()??null,all_day:Boolean(input.allDay),location,notes,reminder_minutes_before:reminderMinutesBefore,recurrence_series_id:recurrenceSeriesId,recurrence_index:recurrenceIndex}).select(fields).single();
  if(error)throw error;return data as LiaCalendarEvent;
}

export async function updateLiaCalendarEvent(id:string,input:{title?:string;startsAt?:Date;endsAt?:Date|null;location?:string|null;notes?:string|null;reminderMinutesBefore?:number|null},demo=false):Promise<LiaCalendarEvent>{
  const cleanId=id.trim();if(!cleanId)throw new Error('CALENDAR_EVENT_REQUIRED');
  const patch:Record<string,unknown>={updated_at:new Date().toISOString()};
  if(input.title!==undefined){const title=input.title.trim();if(!title)throw new Error('CALENDAR_TITLE_REQUIRED');patch.title=title;}
  if(input.startsAt!==undefined){if(Number.isNaN(input.startsAt.getTime()))throw new Error('CALENDAR_START_REQUIRED');patch.starts_at=input.startsAt.toISOString();}
  if(input.endsAt!==undefined){if(input.endsAt&&Number.isNaN(input.endsAt.getTime()))throw new Error('CALENDAR_END_INVALID');patch.ends_at=input.endsAt?.toISOString()??null;}
  if(input.location!==undefined)patch.location=input.location?.trim()||null;
  if(input.notes!==undefined)patch.notes=input.notes?.trim()||null;
  if(input.reminderMinutesBefore!==undefined)patch.reminder_minutes_before=validReminder(input.reminderMinutesBefore);
  if(demo||!supabase){
    const rows=await localList();const index=rows.findIndex(row=>row.id===cleanId);if(index<0)throw new Error('CALENDAR_EVENT_NOT_FOUND');
    const next={...rows[index],...patch} as LiaCalendarEvent;const all=rows.slice();all[index]=next;await localWrite(all.sort((a,b)=>a.starts_at.localeCompare(b.starts_at)));return next;
  }
  const {data,error}=await supabase.from('lia_calendar_events').update(patch).eq('id',cleanId).select(fields).single();if(error)throw error;return data as LiaCalendarEvent;
}

export async function deleteLiaCalendarEvent(id:string,demo=false):Promise<void>{
  const clean=id.trim();if(!clean)return;
  if(demo||!supabase){const rows=await localList();await localWrite(rows.filter(row=>row.id!==clean));return;}
  const {error}=await supabase.from('lia_calendar_events').delete().eq('id',clean);if(error)throw error;
}


export async function createLiaCalendarSeries(input:{title:string;startsAt:Date;endsAt?:Date|null;count:number;stepDays?:number;location?:string|null;notes?:string|null;reminderMinutesBefore?:number|null;demo?:boolean}):Promise<LiaCalendarEvent[]>{
  const title=input.title.trim(),count=Math.trunc(input.count),stepDays=Math.trunc(input.stepDays??7);if(!title)throw new Error('CALENDAR_TITLE_REQUIRED');if(count<2||count>24||stepDays<1||stepDays>31)throw new Error('CALENDAR_RECURRENCE_INVALID');
  if(Number.isNaN(input.startsAt.getTime()))throw new Error('CALENDAR_START_REQUIRED');const baseEnd=input.endsAt??null;if(baseEnd&&Number.isNaN(baseEnd.getTime()))throw new Error('CALENDAR_END_INVALID');const duration=baseEnd?baseEnd.getTime()-input.startsAt.getTime():null;if(duration!==null&&duration<=0)throw new Error('CALENDAR_END_BEFORE_START');
  const location=input.location?.trim()||null,notes=input.notes?.trim()||null,reminderMinutesBefore=validReminder(input.reminderMinutesBefore),seriesId=`series-${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
  const specs=Array.from({length:count},(_,index)=>{const startsAt=new Date(input.startsAt);startsAt.setDate(startsAt.getDate()+index*stepDays);const endsAt=duration===null?null:new Date(startsAt.getTime()+duration);return{index,startsAt,endsAt};});
  if(input.demo||!supabase){const now=new Date().toISOString(),rows=await localList();const created:LiaCalendarEvent[]=specs.map(spec=>({id:localId(),title,starts_at:spec.startsAt.toISOString(),ends_at:spec.endsAt?.toISOString()??null,all_day:false,location,notes,reminder_minutes_before:reminderMinutesBefore,recurrence_series_id:seriesId,recurrence_index:spec.index,created_at:now,updated_at:now}));await localWrite([...rows,...created].sort((a,b)=>a.starts_at.localeCompare(b.starts_at)));return created;}
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const payload=specs.map(spec=>({user_id:user.id,title,starts_at:spec.startsAt.toISOString(),ends_at:spec.endsAt?.toISOString()??null,all_day:false,location,notes,reminder_minutes_before:reminderMinutesBefore,recurrence_series_id:seriesId,recurrence_index:spec.index}));
  const {data,error}=await supabase.from('lia_calendar_events').insert(payload).select(fields);if(error)throw error;return(data??[]) as LiaCalendarEvent[];
}


export async function listLiaCalendarSeriesEvents(seriesId:string,input:{from?:Date;demo?:boolean}={}):Promise<LiaCalendarEvent[]>{
  const clean=seriesId.trim();if(!clean)return[];const from=(input.from??new Date()).toISOString();
  if(input.demo||!supabase){const rows=await localList();return rows.filter(row=>row.recurrence_series_id===clean&&row.starts_at>=from).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));}
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('lia_calendar_events').select(fields).eq('user_id',user.id).eq('recurrence_series_id',clean).gte('starts_at',from).order('starts_at',{ascending:true});if(error)throw error;return(data??[]) as LiaCalendarEvent[];
}

export async function deleteLiaCalendarSeries(seriesId:string,demo=false,from=new Date()):Promise<number>{
  const clean=seriesId.trim();if(!clean)return 0;
  if(demo||!supabase){const rows=await localList(),cut=from.toISOString();const kept=rows.filter(row=>row.recurrence_series_id!==clean||row.starts_at<cut);const removed=rows.length-kept.length;await localWrite(kept);return removed;}
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('lia_calendar_events').delete().eq('user_id',user.id).eq('recurrence_series_id',clean).gte('starts_at',from.toISOString()).select('id');if(error)throw error;return(data??[]).length;
}
