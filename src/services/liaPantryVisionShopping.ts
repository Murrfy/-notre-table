import {executeLiaAssistantApprovedAction} from './liaAssistantActionExecutor';
import {focusLiaPantryVisionMatch,getLiaPantryVisionSession} from './liaPantryVisionSession';

export type LiaPantryVisionShoppingResult=
  |{status:'not_recognized';spokenReply:null}
  |{status:'needs_clarification'|'added'|'partial'|'nothing_missing'|'unavailable'|'failed';spokenReply:string};

let pending=false;
function folded(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
function addMissingCommand(text:string){
  const s=folded(text);
  return /\b(?:ajoute|mets|envoie)\b.*\b(?:manque|manquants?)\b.*\b(?:course|courses|liste)\b/.test(s)
    || /\b(?:ajoute|mets)\b.*\b(?:aux courses|sur la liste)\b.*\b(?:ce qui manque|les manquants)\b/.test(s)
    || /\b(?:add|put)\b.*\b(?:missing|what is missing)\b.*\b(?:shopping|list)\b/.test(s);
}
function normalize(value:string){return folded(value);}
function chooseMatch(text:string){
  const snapshot=getLiaPantryVisionSession();if(!snapshot)return null;
  const s=normalize(text);
  const named=snapshot.matches.find(match=>s.includes(normalize(match.title)));
  if(named)return named;
  if(snapshot.focusedMatchTitle){const focused=snapshot.matches.find(match=>match.title===snapshot.focusedMatchTitle);if(focused)return focused;}
  if(snapshot.matches.length===1)return snapshot.matches[0];
  return null;
}
export function liaPantryVisionShoppingClarificationPending(){return pending;}
export function clearLiaPantryVisionShoppingClarification(){pending=false;}

export async function prepareLiaPantryVisionShoppingFromSpeech(input:{text:string;languageTag:string;householdId?:string;weekStart?:string;demo?:boolean;continuation?:boolean}):Promise<LiaPantryVisionShoppingResult>{
  const recognized=input.continuation||addMissingCommand(input.text);
  if(!recognized)return{status:'not_recognized',spokenReply:null};
  const fr=input.languageTag.toLowerCase().startsWith('fr');
  const snapshot=getLiaPantryVisionSession();
  if(!snapshot||!snapshot.matches.length){pending=false;return{status:'unavailable',spokenReply:fr?'Je n’ai plus de recette issue du dernier scan.':'I no longer have a recipe from the last scan.'};}
  let match=chooseMatch(input.text);
  if(!match&&input.continuation){
    const s=normalize(input.text);
    match=snapshot.matches.find(candidate=>s.includes(normalize(candidate.title)))??null;
  }
  if(!match){
    pending=true;
    const names=snapshot.matches.map(item=>item.title).slice(0,3).join(', ');
    return{status:'needs_clarification',spokenReply:fr?`Pour laquelle : ${names} ?`:`For which one: ${names}?`};
  }
  pending=false;focusLiaPantryVisionMatch(match.title);
  if(!match.missing.length)return{status:'nothing_missing',spokenReply:fr?`Pour ${match.title}, tu as déjà tout ce qu’il faut.`:`For ${match.title}, you already have everything you need.`};
  const householdId=input.householdId?.trim()??'',weekStart=input.weekStart?.trim()??'';
  if(!householdId||!weekStart)return{status:'unavailable',spokenReply:fr?'Je n’ai pas le foyer ou la semaine active pour modifier les courses.':'I do not have the active household or week needed to update shopping.'};
  const result=await executeLiaAssistantApprovedAction({type:'shopping.add_items',householdId,weekStart,demo:Boolean(input.demo),confirmed:true,items:match.missing.map(item=>({label:item.name,aisle:item.aisle}))});
  if(result.status==='completed')return{status:'added',spokenReply:fr?`C’est fait, j’ai ajouté ce qui manque pour ${match.title} aux courses.`:`Done. I added what is missing for ${match.title} to shopping.`};
  if(result.status==='partial')return{status:'partial',spokenReply:fr?`J’ai ajouté ${result.resultCount} produit${result.resultCount>1?'s':''}, mais ${result.failedCount} n’ont pas pu être ajoutés.`:`I added ${result.resultCount} item${result.resultCount===1?'':'s'}, but ${result.failedCount} could not be added.`};
  return{status:'failed',spokenReply:fr?'Je n’ai pas pu modifier les courses. Je ne te dis pas que c’est fait.':'I could not update shopping, so I will not pretend it was done.'};
}
