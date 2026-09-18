import type {PantryVisionItem} from '../lib/pantryVision';
import type {RecipePantryMatch} from '../lib/cookWithPantry';
import type {AisleCode} from '../domain/catalog';

export type LiaPantryVisionSnapshot={
  updatedAt:number;
  items:Array<{label:string;ingredientKey:string;quantity:number|null;unit:string|null;aisle:AisleCode}>;
  matches:Array<{recipeId:string;title:string;missing:Array<{name:string;aisle:AisleCode}>}>;
  focusedMatchTitle:string|null;
};

const TTL_MS=30*60_000;
let current:LiaPantryVisionSnapshot|null=null;

function cleanText(value:string,max=80){return value.trim().replace(/\s+/g,' ').slice(0,max);}

export function clearLiaPantryVisionSession(){current=null;}

export function updateLiaPantryVisionSession(input:{items:PantryVisionItem[];matches:RecipePantryMatch[];now?:number}){
  const items=input.items.filter(item=>!item.needsConfirmation).map(item=>({
    label:cleanText(item.label),
    ingredientKey:cleanText(item.ingredientKey,64),
    quantity:item.quantity!=null&&item.quantityConfidence!=null&&item.quantityConfidence>=.7?item.quantity:null,
    unit:item.quantity!=null&&item.quantityConfidence!=null&&item.quantityConfidence>=.7?(item.unit?.trim()||null):null,
    aisle:item.aisle,
  })).filter(item=>item.label&&item.ingredientKey).slice(0,24);
  const matches=input.matches.map(match=>({
    recipeId:cleanText(match.recipe.id,120),
    title:cleanText(match.recipe.title),
    missing:[...match.missing,...match.insufficient].map(item=>({name:cleanText(item.name),aisle:item.aisle??'other'})).filter(item=>item.name).slice(0,8),
  })).filter(match=>match.recipeId&&match.title).slice(0,3);
  const previousFocus=current?.focusedMatchTitle??null;
  const focusedMatchTitle=previousFocus&&matches.some(match=>match.title===previousFocus)?previousFocus:null;
  current={updatedAt:input.now??Date.now(),items,matches,focusedMatchTitle};
}

export function focusLiaPantryVisionMatch(title:string):void{
  if(!current)return;
  const clean=title.trim();
  if(current.matches.some(match=>match.title===clean))current={...current,focusedMatchTitle:clean};
}

export function getLiaPantryVisionSession(now=Date.now()):LiaPantryVisionSnapshot|null{
  if(!current)return null;
  if(now-current.updatedAt>TTL_MS){current=null;return null;}
  return current;
}

function folded(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}

export function liaPantryVisionFollowupReply(text:string,languageTag:string,now=Date.now()):string|null{
  const snapshot=getLiaPantryVisionSession(now);if(!snapshot)return null;
  const s=folded(text);
  const fr=languageTag.toLowerCase().startsWith('fr');
  const asksSeen=/\b(qu est ce que tu vois|tu vois quoi|qu est ce que j ai|tu as vu quoi|what do you see|what did you see)\b/.test(s);
  const asksIdeas=/\b(qu est ce que je peux (?:faire|cuisiner)|je peux faire quoi|on peut faire quoi|quoi cuisiner|avec ca|what can i (?:make|cook)|what can we (?:make|cook))\b/.test(s);
  const asksMissing=/\b(il manque quoi|qu est ce qu il manque|quoi acheter|what is missing|what do i need)\b/.test(s);
  if(!asksSeen&&!asksIdeas&&!asksMissing)return null;
  if(asksSeen){
    if(!snapshot.items.length)return fr?'Je n’ai encore rien identifié avec assez de certitude.':'I have not identified anything confidently yet.';
    return fr?`Je vois ${snapshot.items.map(item=>item.label).slice(0,10).join(', ')}${snapshot.items.length>10?'…':''}.`:`I can see ${snapshot.items.map(item=>item.label).slice(0,10).join(', ')}${snapshot.items.length>10?'…':''}.`;
  }
  const best=snapshot.matches[0];
  if(asksMissing){
    if(!best)return fr?'Je n’ai pas encore une recette assez proche pour te donner une liste fiable.':'I do not have a close enough recipe yet to give you a reliable list.';
    focusLiaPantryVisionMatch(best.title);
    if(!best.missing.length)return fr?`Pour ${best.title}, tu as déjà tout ce qu’il faut.`:`For ${best.title}, you already have everything you need.`;
    const missing=best.missing.map(item=>item.name).join(', ');
    return fr?`Pour ${best.title}, il manque ${missing}.`:`For ${best.title}, you still need ${missing}.`;
  }
  if(!snapshot.matches.length)return fr?'Je vois bien les produits, mais je n’ai pas encore une recette assez proche pour te proposer quelque chose de sérieux.':'I can see the products, but I do not have a close enough recipe to suggest something reliably yet.';
  focusLiaPantryVisionMatch(best.title);
  const labels=snapshot.matches.map(match=>match.title).join(', ');
  const missing=best.missing.map(item=>item.name).join(', ');
  const suffix=best.missing.length?(fr?` Pour ${best.title}, il manque ${missing}.`:` For ${best.title}, you still need ${missing}.`):(fr?` Pour ${best.title}, tu as déjà tout.`:` For ${best.title}, you already have everything.`);
  return(fr?`Avec ce que j’ai vu, les meilleures idées sont ${labels}.`:`From what I saw, the best matches are ${labels}.`)+suffix;
}
