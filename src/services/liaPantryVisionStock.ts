import {executeLiaAssistantApprovedAction} from './liaAssistantActionExecutor';
import {getLiaPantryVisionSession} from './liaPantryVisionSession';

export type LiaPantryVisionStockResult=
  |{status:'not_recognized';spokenReply:null}
  |{status:'saved'|'partial'|'unavailable'|'failed';spokenReply:string};

function folded(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}

function isSaveCommand(text:string):boolean{
  const s=folded(text);
  return /\b(?:garde|enregistre|ajoute|mets)\b.*\b(?:stock|placard|garde manger)\b/.test(s)
    || /\b(?:garde|enregistre)\b.*\b(?:ce que tu as vu|ces produits|tout ca)\b/.test(s)
    || /\b(?:save|add|keep)\b.*\b(?:pantry|stock|these products|what you saw)\b/.test(s);
}

export async function prepareLiaPantryVisionStockFromSpeech(input:{text:string;languageTag:string;householdId?:string;demo?:boolean}):Promise<LiaPantryVisionStockResult>{
  if(!isSaveCommand(input.text))return{status:'not_recognized',spokenReply:null};
  const fr=input.languageTag.toLowerCase().startsWith('fr');
  const snapshot=getLiaPantryVisionSession();
  if(!snapshot||!snapshot.items.length)return{status:'unavailable',spokenReply:fr?'Je n’ai plus de scan récent à enregistrer.':'I no longer have a recent scan to save.'};
  const householdId=input.householdId?.trim()??'';
  if(!householdId)return{status:'unavailable',spokenReply:fr?'Je n’ai pas le foyer actif pour enregistrer ce stock.':'I do not have the active household needed to save this pantry.'};
  const result=await executeLiaAssistantApprovedAction({
    type:'pantry.add_items',householdId,demo:Boolean(input.demo),confirmed:true,
    items:snapshot.items.map(item=>({label:item.label,quantity:item.quantity,unit:item.unit,aisle:item.aisle})),
  });
  if(result.status==='completed'){
    const count=result.resultCount??snapshot.items.length;
    return{status:'saved',spokenReply:fr?`C’est fait, j’ai gardé ${count} produit${count>1?'s':''} dans ton stock.`:`Done. I saved ${count} item${count===1?'':'s'} to your pantry.`};
  }
  if(result.status==='partial')return{status:'partial',spokenReply:fr?`J’en ai enregistré ${result.resultCount}, mais ${result.failedCount} n’ont pas pu être ajoutés.`:`I saved ${result.resultCount}, but ${result.failedCount} could not be added.`};
  return{status:'failed',spokenReply:fr?'Je n’ai pas pu enregistrer ce stock. Je ne te dis pas que c’est fait.':'I could not save this pantry, so I will not pretend it was done.'};
}
