import {focusLiaPantryVisionMatch,getLiaPantryVisionSession} from './liaPantryVisionSession';

export type LiaPantryVisionRecipeOpenResult=
  |{status:'not_recognized';spokenReply:null}
  |{status:'needs_recipe';spokenReply:string}
  |{status:'open_requested';recipeId:string;startCooking:boolean;spokenReply:string}
  |{status:'unavailable';spokenReply:string};

type Pending={startCooking:boolean;languageTag:string};
let pending:Pending|null=null;

function fold(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
function parse(text:string):{recognized:boolean;startCooking:boolean}{
  const s=fold(text);
  const direct=/^(?:ouvre|affiche|montre)\s+(?:la|cette recette|ce plat|la recette)\b/.test(s)||/^(?:open|show)\s+(?:it|this recipe|the recipe)\b/.test(s);
  const cook=/^(?:lance|commence|demarre|démarre|cuisine|prepare|prépare)\s+(?:la|cette recette|ce plat|la recette)\b/.test(s)||/^(?:commence|commencons|commençons)\s+(?:a |à )?(?:cuisiner|preparer|préparer)\b/.test(s)||/^(?:start|cook|make)\s+(?:it|this recipe|the recipe)\b/.test(s);
  return{recognized:direct||cook,startCooking:cook};
}
function choose(text:string){
  const snapshot=getLiaPantryVisionSession();if(!snapshot)return null;
  const s=fold(text);
  const named=snapshot.matches.find(match=>s.includes(fold(match.title)));if(named)return named;
  if(snapshot.focusedMatchTitle){const focused=snapshot.matches.find(match=>match.title===snapshot.focusedMatchTitle);if(focused)return focused;}
  if(snapshot.matches.length===1)return snapshot.matches[0];
  return null;
}
export function liaPantryVisionRecipeOpenClarificationPending(){return Boolean(pending);}
export function clearLiaPantryVisionRecipeOpenClarification(){pending=null;}

export function prepareLiaPantryVisionRecipeOpenFromSpeech(input:{text:string;languageTag:string;continuation?:boolean}):LiaPantryVisionRecipeOpenResult{
  const fr=input.languageTag.toLowerCase().startsWith('fr');
  const snapshot=getLiaPantryVisionSession();
  if(input.continuation&&pending){
    const current=pending;pending=null;
    if(!snapshot)return{status:'unavailable',spokenReply:fr?'Je n’ai plus le scan récent.':'I no longer have the recent scan.'};
    const selected=choose(input.text);
    if(!selected){pending=current;return{status:'needs_recipe',spokenReply:fr?'Dis-moi simplement laquelle.':'Just tell me which one.'};}
    focusLiaPantryVisionMatch(selected.title);
    return{status:'open_requested',recipeId:selected.recipeId,startCooking:current.startCooking,spokenReply:fr?(current.startCooking?`D’accord, on commence ${selected.title}.`:`J’ouvre ${selected.title}.`):(current.startCooking?`Okay, let’s start ${selected.title}.`:`Opening ${selected.title}.`)};
  }
  const parsed=parse(input.text);if(!parsed.recognized)return{status:'not_recognized',spokenReply:null};
  if(!snapshot||!snapshot.matches.length)return{status:'unavailable',spokenReply:fr?'Je n’ai plus de recette issue du dernier scan.':'I no longer have a recipe from the last scan.'};
  const selected=choose(input.text);
  if(!selected){pending={startCooking:parsed.startCooking,languageTag:input.languageTag};return{status:'needs_recipe',spokenReply:fr?`Laquelle : ${snapshot.matches.map(match=>match.title).join(', ')} ?`:`Which one: ${snapshot.matches.map(match=>match.title).join(', ')}?`};}
  focusLiaPantryVisionMatch(selected.title);
  return{status:'open_requested',recipeId:selected.recipeId,startCooking:parsed.startCooking,spokenReply:fr?(parsed.startCooking?`D’accord, on commence ${selected.title}.`:`J’ouvre ${selected.title}.`):(parsed.startCooking?`Okay, let’s start ${selected.title}.`:`Opening ${selected.title}.`)};
}
