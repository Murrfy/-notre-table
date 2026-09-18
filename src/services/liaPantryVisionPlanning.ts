import {prepareLiaDirectAppActionFromSpeech} from './liaAssistantDirectActionExecution';
import {focusLiaPantryVisionMatch,getLiaPantryVisionSession} from './liaPantryVisionSession';

export type LiaPantryVisionPlanningResult=
  |{status:'not_recognized';spokenReply:null}
  |{status:'needs_recipe'|'completed'|'needs_clarification'|'unavailable'|'failed';spokenReply:string};

type Pending={rest:string;languageTag:string;householdId?:string;weekStart?:string;demo?:boolean};
let pending:Pending|null=null;

function fold(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
function clean(value:string){return value.replace(/^[\s,;:.-]+|[\s,;:.-]+$/g,'').replace(/\s+/g,' ').trim();}

function parseDeicticPlanning(text:string):{recognized:boolean;rest:string}{
  const raw=clean(text);
  const match=raw.match(/^(?:mets|met|planifie|planifies|prévois|prevois|programme)\s+(?:la|ça|ca|cette\s+recette|ce\s+plat)\b\s*(.*)$/i);
  if(!match)return{recognized:false,rest:''};
  const rest=clean(match[1]||'');
  const s=fold(rest);
  const hasPlanningContext=/\b(?:planning|demain|aujourd hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|soir|diner|dejeuner|petit dejeuner|midi|repas|menu)\b/.test(s);
  return{recognized:hasPlanningContext,rest};
}

function chooseMatch(text:string){
  const snapshot=getLiaPantryVisionSession();if(!snapshot)return null;
  const s=fold(text);
  const named=snapshot.matches.find(match=>s.includes(fold(match.title)));
  if(named)return named;
  if(snapshot.focusedMatchTitle){const focused=snapshot.matches.find(match=>match.title===snapshot.focusedMatchTitle);if(focused)return focused;}
  if(snapshot.matches.length===1)return snapshot.matches[0];
  return null;
}

export function liaPantryVisionPlanningClarificationPending(){return Boolean(pending);}
export function clearLiaPantryVisionPlanningClarification(){pending=null;}

async function execute(title:string,rest:string,input:{languageTag:string;householdId?:string;weekStart?:string;demo?:boolean}):Promise<LiaPantryVisionPlanningResult>{
  focusLiaPantryVisionMatch(title);
  const result=await prepareLiaDirectAppActionFromSpeech({text:`mets ${title} ${rest}`.trim(),languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo});
  if(result.status==='completed')return{status:'completed',spokenReply:result.spokenReply};
  if(result.status==='needs_clarification')return{status:'needs_clarification',spokenReply:result.spokenReply};
  if(result.status==='unavailable')return{status:'unavailable',spokenReply:result.spokenReply};
  return{status:'failed',spokenReply:result.status==='failed'?result.spokenReply:(input.languageTag.startsWith('fr')?'Je n’ai pas compris où placer cette recette.':'I could not understand where to place this recipe.')};
}

export async function prepareLiaPantryVisionPlanningFromSpeech(input:{text:string;languageTag:string;householdId?:string;weekStart?:string;demo?:boolean;continuation?:boolean}):Promise<LiaPantryVisionPlanningResult>{
  const fr=input.languageTag.toLowerCase().startsWith('fr');
  if(input.continuation&&pending){
    const current=pending;pending=null;
    const snapshot=getLiaPantryVisionSession();
    if(!snapshot)return{status:'unavailable',spokenReply:fr?'Je n’ai plus le scan récent.':'I no longer have the recent scan.'};
    const selected=chooseMatch(input.text);
    if(!selected){
      pending=current;
      return{status:'needs_recipe',spokenReply:fr?'Dis-moi simplement le nom de la recette.':'Just tell me the recipe name.'};
    }
    return execute(selected.title,current.rest,current);
  }
  const parsed=parseDeicticPlanning(input.text);
  if(!parsed.recognized)return{status:'not_recognized',spokenReply:null};
  const snapshot=getLiaPantryVisionSession();
  if(!snapshot||!snapshot.matches.length)return{status:'unavailable',spokenReply:fr?'Je n’ai plus de recette issue du dernier scan.':'I no longer have a recipe from the last scan.'};
  const selected=chooseMatch(input.text);
  if(!selected){
    pending={rest:parsed.rest,languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo};
    return{status:'needs_recipe',spokenReply:fr?`Laquelle : ${snapshot.matches.map(match=>match.title).slice(0,3).join(', ')} ?`:`Which one: ${snapshot.matches.map(match=>match.title).slice(0,3).join(', ')}?`};
  }
  return execute(selected.title,parsed.rest,input);
}
