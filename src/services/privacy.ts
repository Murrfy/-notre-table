import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '../lib/supabase';
import { runtimeConfig } from '../lib/runtimeConfig';

export type PortableAccountExport = {
  format_version: 2;
  exported_at: string;
  account: unknown;
  profile: unknown;
  membership: unknown;
  preferences: unknown;
  content_created_by_me: {
    recipes: unknown[];
    recipe_ingredients: unknown[];
    meal_plans: unknown[];
    meal_ideas: unknown[];
    shopping_items: unknown[];
    household_activity: unknown[];
    recipe_favorites: unknown[];
    recipe_feedback: unknown[];
    meal_idea_votes: unknown[];
    member_absences: unknown[];
  };
};

async function rows(table:string, configure:(query:any)=>any):Promise<any[]> {
  if(!supabase) return [];
  const query=configure(supabase.from(table).select('*'));
  const {data,error}=await query;
  if(error) throw error;
  return data??[];
}

export async function collectMyPortableData(householdId:string,demo=false):Promise<PortableAccountExport>{
  if(demo || !supabase){
    return {
      format_version:2,
      exported_at:new Date().toISOString(),
      account:{id:'demo-user',email:'demo@example.invalid'},
      profile:{display_name:'Demo'},
      membership:{household_id:householdId,role:'admin'},
      preferences:{allergies:[],diets:[],disliked_foods:[]},
      content_created_by_me:{recipes:[],recipe_ingredients:[],meal_plans:[],meal_ideas:[],shopping_items:[],household_activity:[],recipe_favorites:[],recipe_feedback:[],meal_idea_votes:[],member_absences:[]},
    };
  }
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError) throw userError;
  if(!user) throw new Error('NOT_AUTHENTICATED');

  const [profileRows,membershipRows,preferenceRows,recipes,mealPlans,mealIdeas,shoppingItems,householdActivity,recipeFavorites,recipeFeedback,mealIdeaVotes,memberAbsences]=await Promise.all([
    rows('profiles',q=>q.eq('id',user.id)),
    rows('household_members',q=>q.eq('user_id',user.id).eq('household_id',householdId)),
    rows('member_preferences',q=>q.eq('user_id',user.id)),
    rows('recipes',q=>q.eq('household_id',householdId).eq('created_by',user.id)),
    rows('meal_plans',q=>q.eq('household_id',householdId).eq('created_by',user.id)),
    rows('meal_ideas',q=>q.eq('household_id',householdId).eq('proposed_by',user.id)),
    rows('shopping_items',q=>q.eq('household_id',householdId).eq('created_by',user.id)),
    rows('household_activity',q=>q.eq('household_id',householdId).eq('actor_user_id',user.id)),
    rows('recipe_favorites',q=>q.eq('user_id',user.id)),
    rows('recipe_feedback',q=>q.eq('household_id',householdId).eq('user_id',user.id)),
    rows('meal_idea_votes',q=>q.eq('user_id',user.id)),
    rows('member_absences',q=>q.eq('household_id',householdId).eq('user_id',user.id)),
  ]);
  const recipeIds=recipes.map((r:any)=>r.id).filter(Boolean);
  const recipeIngredients=recipeIds.length?await rows('recipe_ingredients',q=>q.in('recipe_id',recipeIds)):[];

  return {
    format_version:2,
    exported_at:new Date().toISOString(),
    account:{id:user.id,email:user.email??null,created_at:user.created_at??null},
    profile:profileRows[0]??null,
    membership:membershipRows[0]??null,
    preferences:preferenceRows[0]??null,
    content_created_by_me:{recipes,recipe_ingredients:recipeIngredients,meal_plans:mealPlans,meal_ideas:mealIdeas,shopping_items:shoppingItems,household_activity:householdActivity,recipe_favorites:recipeFavorites,recipe_feedback:recipeFeedback,meal_idea_votes:mealIdeaVotes,member_absences:memberAbsences},
  };
}

export async function exportMyPortableDataFile(householdId:string,demo=false):Promise<string>{
  const payload=await collectMyPortableData(householdId,demo);
  const date=new Date().toISOString().slice(0,10);
  const file=new File(Paths.cache,`notre-table-data-${date}.json`);
  file.create({overwrite:true,intermediates:true});
  file.write(JSON.stringify(payload,null,2));
  if(!(await Sharing.isAvailableAsync())) throw new Error('SHARING_UNAVAILABLE');
  await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json',dialogTitle:'Export data'});
  return file.uri;
}

export function isAccountDeletionConfigured():boolean{
  return Boolean(runtimeConfig.accountDeletionEndpoint);
}

export async function requestAccountDeletion():Promise<void>{
  if(!supabase) throw new Error('NOT_AUTHENTICATED');
  const endpoint=runtimeConfig.accountDeletionEndpoint;
  if(!endpoint) throw new Error('ACCOUNT_DELETION_NOT_CONFIGURED');
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token) throw new Error('NOT_AUTHENTICATED');
  const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({confirm:true})});
  if(!response.ok) throw new Error(`ACCOUNT_DELETION_FAILED_${response.status}`);
  // The server has already permanently deleted the Auth user. Clear only this device's
  // cached session so the UI cannot continue under a dead token.
  try{await supabase.auth.signOut({scope:'local'});}catch{/* deletion already succeeded server-side */}
}
