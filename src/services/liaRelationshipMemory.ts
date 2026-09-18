import {supabase} from '../lib/supabase';
import {isArray,isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import type {LiaRelationshipMemorySensitivity,LiaRelationalTopic} from '../lib/liaRelationship';

export type LiaRelationshipFact={
  id:string;
  topic:LiaRelationalTopic;
  subjectLabel:string|null;
  factKey:string;
  factValue:string;
  sensitivity:LiaRelationshipMemorySensitivity;
  householdSafe:boolean;
  confirmed:boolean;
  createdAt:string;
  updatedAt:string;
};

const LOCAL_KEY='@notre-table/lia-relationship-facts-v1';
function validFact(value:unknown):value is LiaRelationshipFact{
  return isRecord(value)&&typeof value.id==='string'&&
    (value.topic==='food'||value.topic==='family'||value.topic==='personal_history'||value.topic==='plans'||value.topic==='leisure'||value.topic==='style'||value.topic==='travel')&&
    (value.subjectLabel===null||typeof value.subjectLabel==='string')&&typeof value.factKey==='string'&&typeof value.factValue==='string'&&
    (value.sensitivity==='ordinary'||value.sensitivity==='personal'||value.sensitivity==='sensitive')&&typeof value.householdSafe==='boolean'&&typeof value.confirmed==='boolean'&&typeof value.createdAt==='string'&&typeof value.updatedAt==='string';
}
function validList(value:unknown):value is LiaRelationshipFact[]{return isArray(value)&&value.every(validFact);}
function id(){return `lia-fact-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;}
async function localList(){return readStoredJson<LiaRelationshipFact[]>(LOCAL_KEY,[],validList);}

export async function listLiaRelationshipFacts(demo=false):Promise<LiaRelationshipFact[]>{
  if(demo||!supabase)return localList();
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('lia_relationship_facts').select('id,topic,subject_label,fact_key,fact_value,sensitivity,household_safe,confirmed,created_at,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false});
  if(error)throw error;
  return (data??[]).map((row:any)=>({id:row.id,topic:row.topic,subjectLabel:row.subject_label?row.subject_label:null,factKey:row.fact_key,factValue:row.fact_value,sensitivity:row.sensitivity,householdSafe:Boolean(row.household_safe),confirmed:Boolean(row.confirmed),createdAt:row.created_at,updatedAt:row.updated_at}));
}

export async function saveLiaRelationshipFact(input:{topic:LiaRelationalTopic;subjectLabel?:string|null;factKey:string;factValue:string;sensitivity:LiaRelationshipMemorySensitivity;householdSafe:boolean;confirmed?:boolean},demo=false):Promise<LiaRelationshipFact>{
  const factKey=input.factKey.trim();const factValue=input.factValue.trim();if(!factKey||!factValue)throw new Error('RELATIONSHIP_FACT_REQUIRED');
  const now=new Date().toISOString();
  if(demo||!supabase){
    const rows=await localList();const existing=rows.find(row=>row.topic===input.topic&&row.subjectLabel===(input.subjectLabel?.trim()||null)&&row.factKey===factKey);
    const next:LiaRelationshipFact=existing?{...existing,factValue,sensitivity:input.sensitivity,householdSafe:input.householdSafe,confirmed:input.confirmed??true,updatedAt:now}:{id:id(),topic:input.topic,subjectLabel:input.subjectLabel?.trim()||null,factKey,factValue,sensitivity:input.sensitivity,householdSafe:input.householdSafe,confirmed:input.confirmed??true,createdAt:now,updatedAt:now};
    await writeStoredJson(LOCAL_KEY,[next,...rows.filter(row=>row.id!==next.id)]);return next;
  }
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const row={user_id:user.id,topic:input.topic,subject_label:input.subjectLabel?.trim()||'',fact_key:factKey,fact_value:factValue,sensitivity:input.sensitivity,household_safe:input.householdSafe,confirmed:input.confirmed??true,updated_at:now};
  const {data,error}=await supabase.from('lia_relationship_facts').upsert(row,{onConflict:'user_id,topic,subject_label,fact_key'}).select('id,topic,subject_label,fact_key,fact_value,sensitivity,household_safe,confirmed,created_at,updated_at').single();
  if(error)throw error;
  return {id:data.id,topic:data.topic,subjectLabel:data.subject_label?data.subject_label:null,factKey:data.fact_key,factValue:data.fact_value,sensitivity:data.sensitivity,householdSafe:Boolean(data.household_safe),confirmed:Boolean(data.confirmed),createdAt:data.created_at,updatedAt:data.updated_at};
}

export async function deleteLiaRelationshipFact(idValue:string,demo=false):Promise<void>{
  if(demo||!supabase){const rows=await localList();await writeStoredJson(LOCAL_KEY,rows.filter(row=>row.id!==idValue));return;}
  const {error}=await supabase.from('lia_relationship_facts').delete().eq('id',idValue);if(error)throw error;
}
