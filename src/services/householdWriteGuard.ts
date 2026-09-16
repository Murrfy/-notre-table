import { supabase } from '../lib/supabase';

/**
 * Resolves an ambiguous household mutation against the trusted server rule.
 * RLS UPDATE/DELETE can legitimately affect zero rows without returning an error.
 * When that happens, ask the backend whether the current user is allowed to write.
 */
export async function assertHouseholdWriteAllowed(householdId:string):Promise<void>{
  if(!supabase)throw new Error('BACKEND_NOT_CONFIGURED');
  const {data,error}=await supabase.rpc('can_write_household',{p_household_id:householdId});
  if(error)throw error;
  if(data!==true)throw new Error('FAMILY_PLAN_REQUIRED');
}

export async function assertHouseholdWriteIfNoRows(householdId:string,rows:unknown[]|null|undefined):Promise<void>{
  if((rows??[]).length>0)return;
  await assertHouseholdWriteAllowed(householdId);
}

/**
 * If a direct PostgREST write fails, distinguish a Family-plan refusal from a
 * normal conflict/network/backend error. If writes are still allowed, preserve
 * the original error so callers do not lose diagnostics.
 */
export async function rethrowHouseholdMutationError(householdId:string,original:unknown):Promise<never>{
  try{await assertHouseholdWriteAllowed(householdId);}catch(gate){
    if(gate instanceof Error&&gate.message==='FAMILY_PLAN_REQUIRED')throw gate;
  }
  throw original;
}
