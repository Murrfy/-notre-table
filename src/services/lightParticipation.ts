import { supabase } from '../lib/supabase';
import { runtimeConfig } from '../lib/runtimeConfig';
import type { MealType } from '../types';

export type LightDesire='home'|'pizza'|'pasta'|'sushi'|'chinese';
export type LightMember={
  id:string;
  household_id:string;
  display_name:string;
  phone_number:string;
  age:number|null;
  relation:'spouse'|'child'|'other';
  relation_label?:string|null;
  active:boolean;
  created_at?:string;
  updated_at?:string;
};
export type LightMealQuestion={
  id:string;
  household_id:string;
  meal_date:string;
  meal_type:MealType;
  desire_options:LightDesire[];
  expires_at:string;
  closed_at?:string|null;
  updated_at?:string;
};
export type LightMealResponse={
  member_id:string;
  member_name:string;
  presence:'yes'|'no'|'maybe';
  desire:LightDesire|null;
  note:string|null;
  takes_charge:boolean;
  responded_at:string;
};
export type LightMealRecipient={
  member_id:string;
  member_name:string;
  responded:boolean;
  presence:'yes'|'no'|'maybe'|null;
  desire:LightDesire|null;
  note:string|null;
  takes_charge:boolean;
  responded_at:string|null;
};
export type LightMealSummary={
  total:number;
  presence:{yes:number;no:number;maybe:number;take_charge:number};
  desires:Record<LightDesire,number>;
  take_charge_name:string|null;
  notes:Array<{member_name:string;note:string;responded_at:string}>;
  responses:LightMealResponse[];
  recipients:LightMealRecipient[];
};
export type LightMealDecisionSnapshot={question:LightMealQuestion;summary:LightMealSummary};

function client(){
  if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
}

export async function fetchLightMembers(householdId:string):Promise<LightMember[]>{
  const {data,error}=await client().from('light_members').select('id,household_id,display_name,phone_number,age,relation,relation_label,active,created_at,updated_at').eq('household_id',householdId).order('created_at',{ascending:true});
  if(error)throw error;
  return (data??[]).map((row:any)=>({...row,phone_number:typeof row.phone_number==='string'?row.phone_number:'',age:Number.isInteger(row.age)?Number(row.age):null,relation:row.relation==='spouse'||row.relation==='child'?row.relation:'other'})) as LightMember[];
}

export async function createLightMember(householdId:string,displayName:string,phoneNumber:string):Promise<string>{
  const {data,error}=await client().rpc('create_light_member',{p_household_id:householdId,p_display_name:displayName.trim(),p_phone_number:phoneNumber.trim()});
  if(error)throw error;
  if(typeof data!=='string'||!data)throw new Error('LIGHT_MEMBER_CREATE_FAILED');
  return data;
}

export async function updateLightMember(memberId:string,displayName:string,phoneNumber:string,active:boolean):Promise<void>{
  const {error}=await client().rpc('update_light_member',{p_light_member_id:memberId,p_display_name:displayName.trim(),p_phone_number:phoneNumber.trim(),p_active:active});
  if(error)throw error;
}

export async function fetchLightMealQuestion(householdId:string,mealDate:string,mealType:MealType):Promise<LightMealQuestion|null>{
  const {data,error}=await client().from('light_meal_questions').select('id,household_id,meal_date,meal_type,desire_options,expires_at,closed_at,updated_at').eq('household_id',householdId).eq('meal_date',mealDate).eq('meal_type',mealType).maybeSingle();
  if(error)throw error;
  return data as LightMealQuestion|null;
}

export async function saveLightMealQuestion(householdId:string,mealDate:string,mealType:MealType,desireOptions:LightDesire[],expiresAt:string):Promise<string>{
  const {data,error}=await client().rpc('upsert_light_meal_question',{p_household_id:householdId,p_meal_date:mealDate,p_meal_type:mealType,p_desire_options:desireOptions,p_expires_at:expiresAt});
  if(error)throw error;
  if(typeof data!=='string'||!data)throw new Error('LIGHT_QUESTION_SAVE_FAILED');
  return data;
}

export async function issueLightResponseToken(questionId:string,memberId:string):Promise<string>{
  const {data,error}=await client().rpc('issue_light_response_token',{p_question_id:questionId,p_light_member_id:memberId});
  if(error)throw error;
  if(typeof data!=='string'||data.length!==64)throw new Error('LIGHT_TOKEN_ISSUE_FAILED');
  return data;
}

export async function fetchLightMealSummary(questionId:string):Promise<LightMealSummary>{
  const {data,error}=await client().rpc('get_light_meal_summary',{p_question_id:questionId});
  if(error)throw error;
  const raw=(data??{}) as any;
  return {
    total:Number(raw.total??0),
    presence:{yes:Number(raw.presence?.yes??0),no:Number(raw.presence?.no??0),maybe:Number(raw.presence?.maybe??0),take_charge:Number(raw.presence?.take_charge??0)},
    desires:{home:Number(raw.desires?.home??0),pizza:Number(raw.desires?.pizza??0),pasta:Number(raw.desires?.pasta??0),sushi:Number(raw.desires?.sushi??0),chinese:Number(raw.desires?.chinese??0)},
    take_charge_name:typeof raw.take_charge_name==='string'?raw.take_charge_name:null,
    notes:Array.isArray(raw.notes)?raw.notes.filter((x:any)=>x&&typeof x.member_name==='string'&&typeof x.note==='string').map((x:any)=>({member_name:x.member_name,note:x.note,responded_at:typeof x.responded_at==='string'?x.responded_at:''})):[],
    responses:Array.isArray(raw.responses)?raw.responses.filter((x:any)=>x&&typeof x.member_id==='string'&&typeof x.member_name==='string').map((x:any)=>({
      member_id:x.member_id,member_name:x.member_name,
      presence:x.presence==='no'||x.presence==='maybe'?x.presence:'yes',
      desire:x.desire==='home'||x.desire==='pizza'||x.desire==='pasta'||x.desire==='sushi'||x.desire==='chinese'?x.desire:null,
      note:typeof x.note==='string'?x.note:null,takes_charge:Boolean(x.takes_charge),responded_at:typeof x.responded_at==='string'?x.responded_at:'',
    })):[],
    recipients:Array.isArray(raw.recipients)?raw.recipients.filter((x:any)=>x&&typeof x.member_id==='string'&&typeof x.member_name==='string').map((x:any)=>({
      member_id:x.member_id,member_name:x.member_name,responded:Boolean(x.responded),
      presence:x.presence==='yes'||x.presence==='no'||x.presence==='maybe'?x.presence:null,
      desire:x.desire==='home'||x.desire==='pizza'||x.desire==='pasta'||x.desire==='sushi'||x.desire==='chinese'?x.desire:null,
      note:typeof x.note==='string'?x.note:null,takes_charge:Boolean(x.takes_charge),responded_at:typeof x.responded_at==='string'?x.responded_at:null,
    })):[],
  };
}

export async function fetchLightMealDecisionSnapshots(householdId:string,fromDate:string,toDate:string):Promise<LightMealDecisionSnapshot[]>{
  const {data,error}=await client().from('light_meal_questions')
    .select('id,household_id,meal_date,meal_type,desire_options,expires_at,closed_at,updated_at')
    .eq('household_id',householdId).gte('meal_date',fromDate).lte('meal_date',toDate)
    .is('closed_at',null).order('meal_date',{ascending:true}).limit(8);
  if(error)throw error;
  const questions=(data??[]) as LightMealQuestion[];
  const settled=await Promise.allSettled(questions.map(async question=>({question,summary:await fetchLightMealSummary(question.id)})));
  return settled.filter((item):item is PromiseFulfilledResult<LightMealDecisionSnapshot>=>item.status==='fulfilled').map(item=>item.value);
}

export function lightResponseLink(token:string):string{
  const base=runtimeConfig.supabase.url;
  if(!base)throw new Error('SUPABASE_NOT_CONFIGURED');
  return `${base.replace(/\/$/,'')}/functions/v1/light-response#${token}`;
}

export function subscribeLightMealResponses(questionId:string,onChange:()=>void):()=>void{
  const client=supabase;
  if(!client)return()=>{};
  const channel=client.channel(`light-meal-${questionId}`).on('postgres_changes',{event:'*',schema:'public',table:'light_meal_responses',filter:`question_id=eq.${questionId}`},onChange).subscribe();
  return()=>{void client.removeChannel(channel);};
}
