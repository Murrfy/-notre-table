import { supabase } from '../lib/supabase';
import { assertHouseholdWriteIfNoRows, rethrowHouseholdMutationError } from './householdWriteGuard';
import { MealIdea } from '../types';

export async function fetchMealIdeas(householdId:string):Promise<MealIdea[]> {
  if(!supabase) return [];
  const {data,error}=await supabase
    .from('meal_ideas')
    .select('id,household_id,title,recipe_id,proposed_by,created_at,profiles(display_name)')
    .eq('household_id',householdId)
    .order('created_at',{ascending:false});
  if(error) throw error;
  const ids=(data??[]).map((x:any)=>x.id);
  let votes:any[]=[];
  let me:string|undefined;
  if(ids.length){
    const [{data:voteData,error:voteError},{data:userData}]=await Promise.all([
      supabase.from('meal_idea_votes').select('idea_id,user_id').in('idea_id',ids),
      supabase.auth.getUser(),
    ]);
    if(voteError) throw voteError;
    votes=voteData??[];me=userData.user?.id;
  }
  return (data??[]).map((row:any)=>({
    id:row.id,household_id:row.household_id,title:row.title,recipe_id:row.recipe_id??null,proposed_by:row.proposed_by??null,
    proposer_name:row.profiles?.display_name??null,created_at:row.created_at,
    vote_count:votes.filter(v=>v.idea_id===row.id).length,
    voted_by_me:Boolean(me&&votes.some(v=>v.idea_id===row.id&&v.user_id===me)),
  })).sort((a,b)=>b.vote_count-a.vote_count || String(b.created_at??'').localeCompare(String(a.created_at??'')));
}

export async function createMealIdea(householdId:string,title:string,recipeId?:string|null):Promise<void>{
  if(!supabase) throw new Error('Mode démo');
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError||!userData.user) throw userError??new Error('Utilisateur non connecté');
  const clean=title.trim();
  if(clean.length<2) throw new Error('Écris une idée de repas.');
  const {error}=await supabase.from('meal_ideas').insert({household_id:householdId,title:clean,recipe_id:recipeId??null,proposed_by:userData.user.id});
  if(error)return rethrowHouseholdMutationError(householdId,error);
}

export async function toggleMealIdeaVote(householdId:string,ideaId:string,voted:boolean):Promise<void>{
  if(!supabase) throw new Error('Mode démo');
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError||!userData.user) throw userError??new Error('Utilisateur non connecté');
  if(voted){
    const {data,error}=await supabase.from('meal_idea_votes').delete().eq('idea_id',ideaId).eq('user_id',userData.user.id).select('idea_id');
    if(error)return rethrowHouseholdMutationError(householdId,error);
    await assertHouseholdWriteIfNoRows(householdId,data);
  }else{
    const {error}=await supabase.from('meal_idea_votes').upsert({idea_id:ideaId,user_id:userData.user.id});
    if(error)return rethrowHouseholdMutationError(householdId,error);
  }
}
