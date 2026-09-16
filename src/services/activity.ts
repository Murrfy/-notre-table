import { supabase } from '../lib/supabase';
import { HouseholdActivity } from '../types';

export async function fetchRecentHouseholdActivity(householdId:string,limit=12):Promise<HouseholdActivity[]>{
  if(!supabase)return[];
  const {data,error}=await supabase
    .from('household_activity')
    .select('id,household_id,actor_user_id,event_type,details,created_at')
    .eq('household_id',householdId)
    .order('created_at',{ascending:false})
    .limit(limit);
  if(error)throw error;
  const rows=(data??[]) as any[];
  const actorIds=Array.from(new Set(rows.map(row=>row.actor_user_id).filter(Boolean)));
  let names=new Map<string,string>();
  if(actorIds.length){
    const {data:profiles,error:profileError}=await supabase.from('profiles').select('id,display_name').in('id',actorIds);
    if(profileError)throw profileError;
    names=new Map((profiles??[]).map((p:any)=>[p.id,p.display_name||'']));
  }
  return rows.map(row=>({
    id:row.id,
    household_id:row.household_id,
    actor_user_id:row.actor_user_id??null,
    actor_name:row.actor_user_id?names.get(row.actor_user_id)??null:null,
    event_type:row.event_type,
    details:(row.details??{}) as Record<string,unknown>,
    created_at:row.created_at,
  }));
}
