import { supabase } from '../lib/supabase';
import { HouseholdMember } from '../types';
import { createAvatarSignedUrl } from './profiles';

export async function fetchHouseholdMembers(householdId:string):Promise<HouseholdMember[]> {
  if(!supabase) return [];
  const {data:members,error:memberError}=await supabase
    .from('household_members')
    .select('user_id,role')
    .eq('household_id',householdId)
    .order('joined_at');
  if(memberError) throw memberError;
  const ids=(members??[]).map((m:any)=>m.user_id);
  if(!ids.length) return [];

  const [{data:profiles,error:profileError},{data:prefs,error:prefError}]=await Promise.all([
    supabase.from('profiles').select('id,display_name,avatar_url,avatar_path').in('id',ids),
    supabase.from('member_preferences').select('user_id,allergies,diets,disliked_foods,allergy_keys,diet_keys,disliked_ingredient_keys').in('user_id',ids),
  ]);
  if(profileError) throw profileError;
  if(prefError) throw prefError;
  const resolvedProfiles=await Promise.all((profiles??[]).map(async(p:any)=>({
    ...p,
    avatar_url:p.avatar_path?await createAvatarSignedUrl(p.avatar_path):p.avatar_url??null,
  })));
  const profileMap=new Map(resolvedProfiles.map((p:any)=>[p.id,p]));
  const prefMap=new Map((prefs??[]).map((p:any)=>[p.user_id,p]));
  return (members??[]).map((m:any)=>{
    const p:any=profileMap.get(m.user_id)??{};
    const pref:any=prefMap.get(m.user_id)??{};
    return {
      user_id:m.user_id,
      role:m.role,
      display_name:p.display_name || 'Member',
      avatar_url:p.avatar_url??null,
      avatar_path:p.avatar_path??null,
      allergies:pref.allergies??[],
      diets:pref.diets??[],
      disliked_foods:pref.disliked_foods??[],
      allergy_keys:pref.allergy_keys??[],
      diet_keys:pref.diet_keys??[],
      disliked_ingredient_keys:pref.disliked_ingredient_keys??[],
    } as HouseholdMember;
  });
}
