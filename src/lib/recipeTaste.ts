import type { RecipeReaction, RecipeTasteCounts } from '../types';

export const RECIPE_REACTIONS: RecipeReaction[] = ['again','ok','skip'];

export function emptyTasteCounts():RecipeTasteCounts{
  return {again:0,ok:0,skip:0,total:0};
}

export function summarizeRecipeTaste(reactions:Array<RecipeReaction|null|undefined>):RecipeTasteCounts{
  const counts=emptyTasteCounts();
  for(const reaction of reactions){
    if(!reaction)continue;
    if(reaction==='again')counts.again+=1;
    else if(reaction==='ok')counts.ok+=1;
    else if(reaction==='skip')counts.skip+=1;
    counts.total+=1;
  }
  return counts;
}

export function preferredReaction(counts:RecipeTasteCounts):RecipeReaction|null{
  if(!counts.total)return null;
  const ranked:RecipeReaction[]=['again','ok','skip'];
  return ranked.reduce<RecipeReaction>((best,current)=>counts[current]>counts[best]?current:best,'again');
}
