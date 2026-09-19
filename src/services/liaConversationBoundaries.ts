import {readStoredJson,writeStoredJson} from '../lib/storage';

type BoundaryState={recentInputs:{text:string;at:number}[];recentReplies:string[];cooldownUntil:number|null};
const KEY='@notre-table/lia-conversation-boundaries-v1';
const EMPTY:BoundaryState={recentInputs:[],recentReplies:[],cooldownUntil:null};

function fold(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s'-]/g,' ').replace(/\s+/g,' ').trim();}
function valid(v:any):v is BoundaryState{return !!v&&Array.isArray(v.recentInputs)&&Array.isArray(v.recentReplies)&&(v.cooldownUntil===null||typeof v.cooldownUntil==='number');}
const insults=/\b(?:con(?:ne)?|connard|connasse|abruti|idiot|idiote|debile|imbecile|merde|putain|encule|salope|batard|ferme ta gueule|ta gueule)\b/i;
const shout=(raw:string)=>raw.length>=8&&/[A-ZÀ-ÖØ-Þ]/.test(raw)&&((raw.match(/[A-ZÀ-ÖØ-Þ]/g)?.length??0)/Math.max(1,(raw.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g)?.length??1)))>.72;

const light=[
  "J'ai compris. Pas besoin de me le répéter, laisse-moi juste une seconde.",
  "Oui, j'ai entendu. Laisse-moi le temps de m'en occuper.",
  "Doucement avec mes oreilles. J'ai compris ce que tu me demandes.",
];
const firm=[
  "Me crie pas dans les oreilles ! J'ai compris. Laisse-moi le temps.",
  "Oui, j'ai compris ! Pas besoin de me le répéter quatre fois. Laisse-moi deux secondes.",
  "Je suis là et j'ai entendu. Laisse-moi juste répondre avant de recommencer.",
];
const pause=[
  "OK, je vais te laisser quelques minutes de réflexion parce que là, ça va plus. On reprend après.",
  "Là, je préfère me taire quelques minutes. On reprendra quand ce sera plus calme.",
  "Je vais te laisser quelques minutes. On reprend après, tranquillement.",
];

function pick(rows:string[],recent:string[]){return rows.find(row=>!recent.includes(row))??rows[0]!;}

export async function evaluateLiaConversationBoundary(rawText:string,now=Date.now()):Promise<{reply:string|null;pauseUntil:number|null}>{
  const state=await readStoredJson<BoundaryState>(KEY,EMPTY,valid);
  if(state.cooldownUntil&&state.cooldownUntil>now)return {reply:null,pauseUntil:state.cooldownUntil};
  const text=fold(rawText);
  const recent=state.recentInputs.filter(row=>now-row.at<45_000);
  const repeated=recent.filter(row=>row.text===text).length>=1;
  const insult=insults.test(text);
  const yelling=shout(rawText);
  const priorHostility=recent.filter(row=>insults.test(row.text)).length;
  let rows:string[]|null=null,pauseUntil:number|null=null;
  if(insult&&priorHostility>=1){rows=pause;pauseUntil=now+3*60_000;}
  else if(insult||yelling||(repeated&&recent.length>=2))rows=firm;
  else if(repeated)rows=light;
  const reply=rows?pick(rows,state.recentReplies):null;
  await writeStoredJson(KEY,{recentInputs:[...recent,{text,at:now}].slice(-8),recentReplies:reply?[...state.recentReplies,reply].slice(-6):state.recentReplies.slice(-6),cooldownUntil:pauseUntil});
  return {reply,pauseUntil};
}

export async function liaBoundaryCooldownActive(now=Date.now()):Promise<boolean>{
  const state=await readStoredJson<BoundaryState>(KEY,EMPTY,valid);
  return Boolean(state.cooldownUntil&&state.cooldownUntil>now);
}
