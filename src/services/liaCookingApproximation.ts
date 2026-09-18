import type {LiaAgentConfirmedFact} from '../lib/liaAgentRequest';
import type {LiaCookingApproximationRequest} from './liaCookingSession';
import {generateLiaTableResponse} from './liaTableResponseRuntime';

function unavailableReply(request:LiaCookingApproximationRequest,languageTag:string):string{
  const lang=languageTag.toLowerCase();
  if(request.reason==='missing_base_servings'){
    if(lang.startsWith('fr'))return`Je n’arrive pas à faire une approximation assez fiable maintenant. Si tu me dis pour combien de personnes la recette de base est prévue, je te calcule ça exactement.`;
    if(lang.startsWith('es'))return`No consigo hacer una aproximación suficientemente fiable ahora. Si me dices para cuántas personas es la receta base, te lo calculo exactamente.`;
    if(lang.startsWith('he'))return`אני לא מצליחה לתת עכשיו הערכה מספיק אמינה. אם תגיד לי לכמה אנשים מיועד המתכון הבסיסי, אני אחשב את זה בדיוק.`;
    return`I can't make a reliable enough approximation right now. If you tell me how many people the base recipe serves, I can calculate it exactly.`;
  }
  if(lang.startsWith('fr'))return`Je n’arrive pas à faire une approximation assez fiable maintenant. Si tu me donnes la quantité de base de ${request.ingredientName}, je pourrai l’adapter exactement.`;
  if(lang.startsWith('es'))return`No consigo hacer una aproximación suficientemente fiable ahora. Si me das la cantidad base de ${request.ingredientName}, podré adaptarla exactamente.`;
  if(lang.startsWith('he'))return`אני לא מצליחה לתת עכשיו הערכה מספיק אמינה. אם תגיד לי את כמות הבסיס של ${request.ingredientName}, אוכל להתאים אותה בדיוק.`;
  return`I can't make a reliable enough approximation right now. If you give me the base amount of ${request.ingredientName}, I can scale it exactly.`;
}

export async function generateLiaCookingApproximation(request:LiaCookingApproximationRequest,languageTag:string):Promise<string>{
  const facts:LiaAgentConfirmedFact[]=[
    {key:'cooking.recipe_title',value:request.recipeTitle,scope:'session',confirmed:true,relevant:true,sensitive:false},
    {key:'cooking.ingredient',value:request.ingredientName,scope:'session',confirmed:true,relevant:true,sensitive:false},
    {key:'cooking.missing_fact',value:request.reason,scope:'session',confirmed:true,relevant:true,sensitive:false},
  ];
  if(request.targetServings!==null)facts.push({key:'cooking.target_servings',value:String(request.targetServings),scope:'session',confirmed:true,relevant:true,sensitive:false});
  if(request.baseServings!==null)facts.push({key:'cooking.base_servings',value:String(request.baseServings),scope:'session',confirmed:true,relevant:true,sensitive:false});
  if(request.recordedQuantity!==null)facts.push({key:'cooking.recorded_quantity',value:`${request.recordedQuantity}${request.recordedUnit?` ${request.recordedUnit}`:''}`,scope:'session',confirmed:true,relevant:true,sensitive:false});

  const target=request.targetServings!==null?` for ${request.targetServings} people`:'';
  const prompt=`The user explicitly approved an approximation for a cooking quantity. Give one short practical estimate for ${request.ingredientName}${target}. Clearly say it is an approximation and not a quantity written in the recipe. Use the confirmed facts provided. You may use ordinary culinary knowledge, but do not present uncertain assumptions as facts. If the estimate would still be too speculative, say so and ask for the single missing anchor instead.`;
  const result=await generateLiaTableResponse({
    turn:{text:prompt,speakerTrackId:'cooking',memberId:null,identityConfidence:0,speechConfidence:1,mayUseMemberName:false},
    context:{
      mode:'cooking',
      languageTag,
      topicKey:'cooking_ingredient_approximation',
      memberId:null,
      mayUseMemberName:false,
      agentTask:'complex_reasoning',
      essential:true,
      sensitiveInput:false,
      confirmedFacts:facts,
    },
  });
  return result.status==='ready'?result.text:unavailableReply(request,languageTag);
}
