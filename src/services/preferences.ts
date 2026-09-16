import { supabase } from '../lib/supabase';
import { canonicalAllergyKeys, canonicalDietKeys, canonicalDislikedKeys } from '../domain/preferences';

export type Preferences = { allergies:string[]; diets:string[]; disliked_foods:string[]; allergy_keys?:string[]; diet_keys?:string[]; disliked_ingredient_keys?:string[] };

export async function getMyPreferences():Promise<Preferences>{
  if(!supabase) return {allergies:[],diets:[],disliked_foods:[]};
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError) throw userError;
  if(!userData.user) throw new Error('Session expirée');
  const {data,error}=await supabase.from('member_preferences').select('allergies,diets,disliked_foods,allergy_keys,diet_keys,disliked_ingredient_keys').eq('user_id',userData.user.id).maybeSingle();
  if(error) throw error;
  return data ?? {allergies:[],diets:[],disliked_foods:[]};
}

export async function saveMyPreferences(p:Preferences){
  if(!supabase) return;
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError) throw userError;
  if(!userData.user) throw new Error('Session expirée');
  const canonical={allergy_keys:canonicalAllergyKeys(p.allergies),diet_keys:canonicalDietKeys(p.diets),disliked_ingredient_keys:canonicalDislikedKeys(p.disliked_foods)};
  const {error}=await supabase.from('member_preferences').upsert({user_id:userData.user.id,...p,...canonical,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error) throw error;
}
