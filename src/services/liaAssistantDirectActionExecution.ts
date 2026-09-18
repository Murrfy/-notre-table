import {liaDirectAppActionClarification,liaDirectMealDisplay,liaShoppingReferenceAddRequested,liaShoppingShortageMention,parseLiaDirectAppAction,type LiaDirectAppActionDraft} from '../lib/liaAssistantDirectAction';
import {executeLiaAssistantApprovedAction} from './liaAssistantActionExecutor';

export type LiaAssistantDirectActionExecution=
  |{status:'not_recognized';spokenReply:null}
  |{status:'context_noted';spokenReply:string}
  |{status:'needs_clarification';spokenReply:string}
  |{status:'completed';spokenReply:string}
  |{status:'unavailable'|'failed';spokenReply:string};

type Pending={draft:LiaDirectAppActionDraft;languageTag:string;householdId:string;weekStart:string;demo:boolean};
type RecentShoppingShortage={label:string;languageTag:string;householdId:string;weekStart:string;demo:boolean;expiresAtMs:number};
let pending:Pending|null=null;
let recentShoppingShortage:RecentShoppingShortage|null=null;

function memoTitle(content:string):string{
  const first=content.split(/[.!?\n]/)[0]?.trim()||content.trim();
  return first.length<=72?first:`${first.slice(0,69).trim()}…`;
}
function failureReply(languageTag:string):string{return languageTag.toLowerCase().startsWith('fr')?'Je n’ai pas pu le faire. Rien n’a été modifié.':'I couldn’t do it. Nothing was changed.';}
function unavailableReply(languageTag:string):string{return languageTag.toLowerCase().startsWith('fr')?'Je ne peux pas faire cette action ici pour le moment.':'I can’t perform that action here right now.';}

async function executeDraft(input:{draft:LiaDirectAppActionDraft;languageTag:string;householdId:string;weekStart:string;demo:boolean}):Promise<LiaAssistantDirectActionExecution>{
  const{draft,languageTag,householdId,weekStart,demo}=input;
  const fr=languageTag.toLowerCase().startsWith('fr');
  if(draft.type==='shopping.add_item'){
    if(!draft.label)return{status:'needs_clarification',spokenReply:liaDirectAppActionClarification(draft,languageTag)};
    const result=await executeLiaAssistantApprovedAction({type:'shopping.add_item',householdId,weekStart,label:draft.label,confirmed:true});
    if(result.status==='completed')return{status:'completed',spokenReply:fr?`C’est fait, j’ai ajouté ${draft.label} aux courses.`:`Done. I added ${draft.label} to the shopping list.`};
    return{status:result.status==='failed'?'failed':'unavailable',spokenReply:result.status==='failed'?failureReply(languageTag):unavailableReply(languageTag)};
  }
  if(draft.type==='memo.create'){
    if(!draft.content)return{status:'needs_clarification',spokenReply:liaDirectAppActionClarification(draft,languageTag)};
    const result=await executeLiaAssistantApprovedAction({type:'memo.create',title:memoTitle(draft.content),summary:draft.content,demo,confirmed:true});
    if(result.status==='completed')return{status:'completed',spokenReply:fr?'C’est fait, je l’ai mis dans Mémos.':'Done. I saved it in Memos.'};
    return{status:result.status==='failed'?'failed':'unavailable',spokenReply:result.status==='failed'?failureReply(languageTag):unavailableReply(languageTag)};
  }
  if(!draft.customTitle||!draft.date||!draft.mealType)return{status:'needs_clarification',spokenReply:liaDirectAppActionClarification(draft,languageTag)};
  const result=await executeLiaAssistantApprovedAction({type:'planning.set_meal',householdId,date:draft.date,mealType:draft.mealType,customTitle:draft.customTitle,confirmed:true});
  if(result.status==='completed')return{status:'completed',spokenReply:fr?`C’est fait, j’ai mis ${draft.customTitle} ${liaDirectMealDisplay(draft,languageTag)} au planning.`:`Done. I planned ${draft.customTitle} ${liaDirectMealDisplay(draft,languageTag)}.`};
  return{status:result.status==='failed'?'failed':'unavailable',spokenReply:result.status==='failed'?failureReply(languageTag):unavailableReply(languageTag)};
}

export function liaDirectAppActionClarificationPending():boolean{return Boolean(pending);}
export function clearLiaDirectAppActionClarification():void{pending=null;}
export function liaShoppingShortageFollowupActive(nowMs=Date.now()):boolean{
  if(recentShoppingShortage&&recentShoppingShortage.expiresAtMs<nowMs)recentShoppingShortage=null;
  return Boolean(recentShoppingShortage);
}
export function clearLiaShoppingShortageFollowup():void{recentShoppingShortage=null;}

export function noteLiaShoppingShortageFromSpeech(input:{text:string;languageTag:string;householdId?:string;weekStart?:string;demo?:boolean;nowMs?:number}):LiaAssistantDirectActionExecution{
  const label=liaShoppingShortageMention(input.text);
  if(!label)return{status:'not_recognized',spokenReply:null};
  const nowMs=input.nowMs??Date.now();
  recentShoppingShortage={
    label,
    languageTag:input.languageTag,
    householdId:input.householdId?.trim()??'',
    weekStart:input.weekStart?.trim()??'',
    demo:Boolean(input.demo),
    expiresAtMs:nowMs+120_000,
  };
  const fr=input.languageTag.toLowerCase().startsWith('fr');
  return{status:'context_noted',spokenReply:fr?`D’accord, je garde ${label} en tête un moment. Si tu veux, dis-moi de l’ajouter aux courses.`:`Okay, I’ll keep ${label} in mind for a moment. If you want, tell me to add it to the shopping list.`};
}

export async function continueLiaShoppingShortageFollowup(text:string,nowMs=Date.now()):Promise<LiaAssistantDirectActionExecution>{
  if(!liaShoppingShortageFollowupActive(nowMs))return{status:'not_recognized',spokenReply:null};
  if(!liaShoppingReferenceAddRequested(text))return{status:'not_recognized',spokenReply:null};
  const current=recentShoppingShortage;
  recentShoppingShortage=null;
  if(!current)return{status:'not_recognized',spokenReply:null};
  if(!current.householdId||!current.weekStart)return{status:'unavailable',spokenReply:unavailableReply(current.languageTag)};
  return executeDraft({draft:{type:'shopping.add_item',label:current.label},languageTag:current.languageTag,householdId:current.householdId,weekStart:current.weekStart,demo:current.demo});
}

export async function prepareLiaDirectAppActionFromSpeech(input:{text:string;languageTag:string;householdId?:string;weekStart?:string;demo?:boolean;now?:Date}):Promise<LiaAssistantDirectActionExecution>{
  const parsed=parseLiaDirectAppAction(input.text,input.now??new Date());
  if(!parsed.recognized)return{status:'not_recognized',spokenReply:null};
  const householdId=input.householdId?.trim()??'',weekStart=input.weekStart?.trim()??'';
  if((parsed.draft.type==='shopping.add_item'||parsed.draft.type==='planning.set_meal')&&(!householdId||!weekStart))return{status:'unavailable',spokenReply:unavailableReply(input.languageTag)};
  if(parsed.missing){pending={draft:parsed.draft,languageTag:input.languageTag,householdId,weekStart,demo:Boolean(input.demo)};return{status:'needs_clarification',spokenReply:liaDirectAppActionClarification(parsed.draft,input.languageTag)};}
  pending=null;
  return executeDraft({draft:parsed.draft,languageTag:input.languageTag,householdId,weekStart,demo:Boolean(input.demo)});
}

export async function continueLiaDirectAppActionClarification(text:string,now=new Date()):Promise<LiaAssistantDirectActionExecution>{
  if(!pending)return{status:'not_recognized',spokenReply:null};
  const current=pending;
  const parsed=parseLiaDirectAppAction(text,now,current.draft);
  if(!parsed.recognized){pending=null;return{status:'not_recognized',spokenReply:null};}
  if(parsed.missing){pending={...current,draft:parsed.draft};return{status:'needs_clarification',spokenReply:liaDirectAppActionClarification(parsed.draft,current.languageTag)};}
  pending=null;
  return executeDraft({...current,draft:parsed.draft});
}
