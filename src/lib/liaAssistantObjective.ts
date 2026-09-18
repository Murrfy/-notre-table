export type LiaAssistantReadCapability='pantry.read'|'recipes.read'|'planning.read'|'shopping.read'|'memos.read'|'family.read';
export type LiaAssistantProposedAction='shopping.add_missing'|'planning.set_meal'|'memo.create'|'family.prepare_message';

export type LiaAssistantObjectivePlan={
  reads:LiaAssistantReadCapability[];
  proposedActions:Array<{action:LiaAssistantProposedAction;requiresConfirmation:true}>;
  multiStep:boolean;
  reason:'pantry_meal'|'meal_planning'|'shopping'|'memos'|'general';
};

function fold(value:string):string{
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
}
function addRead(list:LiaAssistantReadCapability[],value:LiaAssistantReadCapability){if(!list.includes(value))list.push(value);}
function addAction(list:LiaAssistantObjectivePlan['proposedActions'],action:LiaAssistantProposedAction){
  if(!list.some(item=>item.action===action))list.push({action,requiresConfirmation:true});
}

const PANTRY=/(?:\b(?:placards?|stock|frigo|refrigerateur|ingredients? (?:qu['’]?on|que nous) (?:a|avons)|avec ce qu['’]?on a|pantry|fridge|cupboard|what we have|despensa|nevera|lo que tenemos)\b|(?:מזווה|מקרר|מה יש לנו))/i;
const RECIPE=/(?:\b(?:recettes?|cuisiner|cuisine|manger|repas|diner|dejeuner|petit[- ]dejeuner|menu|recipe|cook|eat|meal|dinner|lunch|breakfast|receta|cocinar|comer|comida|cena)\b|(?:מתכון|לבשל|לאכול|ארוחה|ארוחת ערב))/i;
const PLANNING=/(?:\b(?:planning|programme|organise|organiser|planifie|planifier|prevu|demain|ce soir|cette semaine|semaine prochaine|schedule|plan|organize|organise|tomorrow|tonight|this week|next week|planificar|organizar|manana|esta noche|esta semana)\b|(?:תכנון|לתכנן|מחר|הערב|השבוע))/i;
const SHOPPING=/(?:\b(?:courses|liste de courses|a acheter|acheter|manquants?|shopping|grocery|groceries|buy|missing ingredients|compras|lista de compras|comprar|faltan)\b|(?:קניות|רשימת קניות|לקנות|חסר))/i;
const MEMOS=/(?:\b(?:memos?|memo|garde[- ]moi ca|mets ca dans memos|souviens[- ]toi|notes?|remember this|save this|memo|guardalo|recuerdalo)\b|(?:ממו|תזכור|שמור את זה))/i;
const FAMILY_MESSAGE=/(?:\b(?:previens?|prevenir|dis a (?:la )?famille|message famille|envoie.*famille|tell the family|family message|let the family know|avisa.*familia|mensaje.*familia)\b|(?:תודיע.*משפחה|הודעה.*משפחה))/i;
const MISSING=/(?:\b(?:manquants?|ce qu['’]?il manque|missing|faltan|lo que falta)\b|(?:חסר|מה חסר))/i;

/**
 * Local, deterministic intent-to-capability planner for LIA. It never mutates
 * Notre Table. Read context may be gathered automatically; every proposed
 * write remains an explicit confirmation-bound next step.
 */
export function planLiaAssistantObjective(text:string):LiaAssistantObjectivePlan{
  const clean=fold(text);
  const reads:LiaAssistantReadCapability[]=[];
  const proposedActions:LiaAssistantObjectivePlan['proposedActions']=[];
  const pantry=PANTRY.test(clean);
  const recipe=RECIPE.test(clean);
  const planning=PLANNING.test(clean);
  const shopping=SHOPPING.test(clean);
  const memos=MEMOS.test(clean);

  if(pantry)addRead(reads,'pantry.read');
  if(recipe)addRead(reads,'recipes.read');
  if(planning)addRead(reads,'planning.read');
  if(shopping)addRead(reads,'shopping.read');
  if(memos)addRead(reads,'memos.read');

  // “What can we eat with what we have?” needs recipes + pantry even when one
  // side was implicit in the sentence.
  if(pantry&&recipe){addRead(reads,'pantry.read');addRead(reads,'recipes.read');}

  // Organising a meal is a multi-source objective: current plan, available
  // food and recipes are useful before proposing any write.
  if(planning&&recipe){
    addRead(reads,'planning.read');addRead(reads,'pantry.read');addRead(reads,'recipes.read');
    addAction(proposedActions,'planning.set_meal');
    if(shopping||MISSING.test(clean)){addRead(reads,'shopping.read');addAction(proposedActions,'shopping.add_missing');}
  }else if(shopping&&MISSING.test(clean)){
    addRead(reads,'pantry.read');addRead(reads,'recipes.read');addAction(proposedActions,'shopping.add_missing');
  }

  if(memos)addAction(proposedActions,'memo.create');
  if(FAMILY_MESSAGE.test(clean)){addRead(reads,'family.read');addAction(proposedActions,'family.prepare_message');}

  const reason:LiaAssistantObjectivePlan['reason']=pantry&&recipe?'pantry_meal':planning?'meal_planning':shopping?'shopping':memos?'memos':'general';
  return{reads,proposedActions,multiStep:reads.length+proposedActions.length>=3,reason};
}
