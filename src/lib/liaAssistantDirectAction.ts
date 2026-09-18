import type {MealType} from '../types';

export type LiaDirectAppActionDraft=
  |{type:'shopping.add_item';label:string|null}
  |{type:'memo.create';content:string|null}
  |{type:'planning.set_meal';date:string|null;displayDay:string|null;mealType:MealType|null;customTitle:string|null};

export type LiaDirectAppActionParse=
  |{recognized:false}
  |{recognized:true;draft:LiaDirectAppActionDraft;missing:'label'|'content'|'date'|'meal_type'|'meal_title'|null};

function fold(value:string):string{
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
}
function clean(value:string):string{return value.replace(/^[\s,;:.-]+|[\s,;:.-]+$/g,'').replace(/\s+/g,' ').trim();}
function stripArticle(value:string):string{
  return clean(value.replace(/^(?:(?:du|de la|des|le|la|les|un|une)\b\s*|(?:de l['’]|d['’])\s*)/i,''));
}
function localIsoDate(value:Date):string{
  return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
}
function startOfDay(value:Date):Date{const d=new Date(value);d.setHours(0,0,0,0);return d;}
function nextWeekday(now:Date,weekday:number):Date{
  const day=startOfDay(now);const delta=(weekday-day.getDay()+7)%7;day.setDate(day.getDate()+delta);return day;
}
function parseDay(text:string,now:Date):{date:string|null;displayDay:string|null;remainder:string}{
  let remainder=text;
  const normalized=fold(text);
  const relative:Array<[RegExp,number,string]>=[
    [/\bdemain\b/i,1,'demain'],
    [/\baujourd(?:['’])?hui\b/i,0,'aujourd’hui'],
  ];
  for(const [pattern,days,label] of relative){
    const match=remainder.match(pattern);if(!match)continue;
    const date=startOfDay(now);date.setDate(date.getDate()+days);
    return{date:localIsoDate(date),displayDay:label,remainder:clean(remainder.replace(match[0],' '))};
  }
  const weekdays:Array<[RegExp,number,string]>=[
    [/\blundi\b/i,1,'lundi'],[/\bmardi\b/i,2,'mardi'],[/\bmercredi\b/i,3,'mercredi'],[/\bjeudi\b/i,4,'jeudi'],[/\bvendredi\b/i,5,'vendredi'],[/\bsamedi\b/i,6,'samedi'],[/\bdimanche\b/i,0,'dimanche'],
  ];
  for(const [pattern,weekday,label] of weekdays){
    const match=remainder.match(pattern);if(!match)continue;
    const date=nextWeekday(now,weekday);
    return{date:localIsoDate(date),displayDay:label,remainder:clean(remainder.replace(match[0],' '))};
  }
  const iso=remainder.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if(iso){
    const date=new Date(Number(iso[1]),Number(iso[2])-1,Number(iso[3]));
    if(date.getFullYear()===Number(iso[1])&&date.getMonth()===Number(iso[2])-1&&date.getDate()===Number(iso[3]))return{date:localIsoDate(date),displayDay:iso[0],remainder:clean(remainder.replace(iso[0],' '))};
  }
  const numeric=remainder.match(/\b(?:le\s+)?(\d{1,2})[\/.](\d{1,2})(?:[\/.](20\d{2}))?\b/i);
  if(numeric){
    const year=Number(numeric[3]||now.getFullYear()),month=Number(numeric[2]),day=Number(numeric[1]);
    const date=new Date(year,month-1,day);
    if(date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day)return{date:localIsoDate(date),displayDay:`le ${day}/${month}`,remainder:clean(remainder.replace(numeric[0],' '))};
  }
  if(/\bce soir\b/.test(normalized))return{date:localIsoDate(now),displayDay:'ce soir',remainder:clean(remainder.replace(/\bce soir\b/i,' '))};
  return{date:null,displayDay:null,remainder};
}
function parseMealType(text:string):{mealType:MealType|null;remainder:string}{
  const patterns:Array<[RegExp,MealType]>=[
    [/\b(?:petit[- ]dejeuner|petit déjeuner|breakfast)\b/i,'breakfast'],
    [/\b(?:dejeuner|déjeuner|midi|lunch)\b/i,'lunch'],
    [/\b(?:diner|dîner|souper|soir|dinner)\b/i,'dinner'],
    [/\b(?:gouter|goûter|collation|snack)\b/i,'snack'],
  ];
  for(const [pattern,type] of patterns){const match=text.match(pattern);if(match)return{mealType:type,remainder:clean(text.replace(match[0],' '))};}
  return{mealType:null,remainder:text};
}
function planningFields(value:string,now:Date):{date:string|null;displayDay:string|null;mealType:MealType|null;customTitle:string|null}{
  let work=clean(value);
  const day=parseDay(work,now);work=day.remainder;
  const meal=parseMealType(work);work=meal.remainder;
  const mealType=meal.mealType??(day.displayDay==='ce soir'?'dinner':null);
  work=work
    .replace(/\b(?:dans|sur|au)\s+(?:le\s+)?planning\b/ig,' ')
    .replace(/\b(?:au|pour le|pour)\s+(?:repas|menu)\b/ig,' ')
    .replace(/\b(?:au|pour le)\b/ig,' ')
    .replace(/\b(?:ce soir)\b/ig,' ');
  return{date:day.date,displayDay:day.displayDay,mealType,customTitle:stripArticle(work)||null};
}
function missingFor(draft:LiaDirectAppActionDraft):'label'|'content'|'date'|'meal_type'|'meal_title'|null{
  if(draft.type==='shopping.add_item')return draft.label?null:'label';
  if(draft.type==='memo.create')return draft.content?null:'content';
  if(!draft.customTitle)return'meal_title';
  if(!draft.date)return'date';
  if(!draft.mealType)return'meal_type';
  return null;
}

export function liaShoppingShortageMention(text:string):string|null{
  const raw=clean(text);
  if(!raw)return null;
  if(/\b(?:ajoute|mets|add|put|añade|anade|agrega|pon)\b.*\b(?:courses|shopping|grocery|compras|supermercado)\b/i.test(fold(raw)))return null;
  const patterns=[
    /^(?:il\s+me\s+manque|je\s+n['’]?ai\s+plus|j['’]?ai\s+besoin\s+de)\s+(.+?)\s*[.!?]*$/i,
    /^(?:i(?:'|’)m\s+out\s+of|i\s+need)\s+(.+?)\s*[.!?]*$/i,
    /^(?:me\s+falta|necesito)\s+(.+?)\s*[.!?]*$/i,
  ];
  for(const pattern of patterns){
    const match=raw.match(pattern);if(!match)continue;
    return stripArticle(match[1])||null;
  }
  return null;
}

export function liaShoppingReferenceAddRequested(text:string):boolean{
  const raw=clean(text);
  const patterns=[
    /^(?:ajoute|mets)(?:-?(?:le|la|les)|\s+(?:le|la|les|ça|ca|ceci))\s+(?:aux\s+courses|dans\s+(?:la\s+)?liste\s+de\s+courses)\s*[.!?]*$/i,
    /^(?:add|put)\s+(?:it|them)\s+(?:to|on)\s+(?:the\s+)?(?:shopping|grocery)\s+list\s*[.!?]*$/i,
    /^(?:añade|anade|agrega|pon)(?:lo|la|los|las|\s+eso)\s+(?:a|en)\s+(?:la\s+)?lista\s+(?:de\s+)?(?:compras|supermercado)\s*[.!?]*$/i,
  ];
  return patterns.some(pattern=>pattern.test(raw));
}

export function parseLiaDirectAppAction(text:string,now=new Date(),seed:LiaDirectAppActionDraft|null=null):LiaDirectAppActionParse{
  const raw=clean(text);
  if(seed){
    if(seed.type==='shopping.add_item'){
      const draft:{type:'shopping.add_item';label:string|null}={...seed,label:seed.label??(stripArticle(raw)||null)};
      return{recognized:true,draft,missing:missingFor(draft)};
    }
    if(seed.type==='memo.create'){
      const draft:{type:'memo.create';content:string|null}={...seed,content:seed.content??(clean(raw)||null)};
      return{recognized:true,draft,missing:missingFor(draft)};
    }
    const extra=planningFields(raw,now);
    const draft:LiaDirectAppActionDraft={type:'planning.set_meal',date:seed.date??extra.date,displayDay:seed.displayDay??extra.displayDay,mealType:seed.mealType??extra.mealType,customTitle:seed.customTitle??extra.customTitle};
    return{recognized:true,draft,missing:missingFor(draft)};
  }

  const shoppingPatterns=[
    /^(?:il\s+me\s+manque|je\s+n['’]?ai\s+plus|j['’]?ai\s+besoin\s+de)\s+(.+?)(?:\s*[,;:]\s*|\s+)(?:ajoute|mets)(?:-?(?:le|la|les)|\s+(?:le|la|les|ça|ca|ceci))?\s+(?:aux\s+courses|dans\s+(?:la\s+)?liste\s+de\s+courses)\s*[.!?]*$/i,
    /^(?:i(?:'|’)m\s+out\s+of|i\s+need)\s+(.+?)(?:\s*[,;:]\s*|\s+)(?:add|put)(?:\s+it)?\s+(?:to|on)\s+(?:the\s+)?(?:shopping|grocery)\s+list\s*[.!?]*$/i,
    /^(?:me\s+falta|necesito)\s+(.+?)(?:\s*[,;:]\s*|\s+)(?:añade|agrega|pon)(?:lo|la|los|las|\s+eso)?\s+(?:a|en)\s+(?:la\s+)?lista\s+(?:de\s+)?(?:compras|supermercado)\s*[.!?]*$/i,
    /^(?:ajoute|mets)\s+(.+?)\s+(?:aux\s+courses|dans\s+(?:la\s+)?liste\s+de\s+courses)\s*[.!?]*$/i,
    /^(?:ajoute|mets)\s+(?:aux\s+courses|dans\s+(?:la\s+)?liste\s+de\s+courses)\s+(.+?)\s*[.!?]*$/i,
    /^(?:add|put)\s+(.+?)\s+(?:to|on)\s+(?:the\s+)?(?:shopping|grocery)\s+list\s*[.!?]*$/i,
  ];
  for(const pattern of shoppingPatterns){const match=raw.match(pattern);if(match){const draft:LiaDirectAppActionDraft={type:'shopping.add_item',label:stripArticle(match[1])||null};return{recognized:true,draft,missing:missingFor(draft)};}}
  if(/^(?:ajoute|mets)\s+(?:aux\s+courses|dans\s+(?:la\s+)?liste\s+de\s+courses)\s*[.!?]*$/i.test(raw)){
    const draft:LiaDirectAppActionDraft={type:'shopping.add_item',label:null};return{recognized:true,draft,missing:'label'};
  }

  const memoPatterns=[
    /^(?:mets|garde(?:-moi)?|note|enregistre)\s+(.+?)\s+(?:dans|en)\s+(?:les?\s+)?m[eé]mos?\s*[.!?]*$/i,
    /^(?:mets|garde(?:-moi)?|note|enregistre)\s+(?:dans|en)\s+(?:les?\s+)?m[eé]mos?\s*[:,-]?\s*(.*?)\s*[.!?]*$/i,
    /^(?:save|keep)\s+(.+?)\s+(?:in|to)\s+(?:my\s+)?memos?\s*[.!?]*$/i,
  ];
  for(const pattern of memoPatterns){
    const match=raw.match(pattern);if(!match)continue;
    let content=clean(match[1]||'');
    if(/^(?:ça|ca|ceci|cela|le|la|it|this)$/i.test(content))content='';
    const draft:LiaDirectAppActionDraft={type:'memo.create',content:content||null};return{recognized:true,draft,missing:missingFor(draft)};
  }

  const planningMatch=raw.match(/^(?:mets|ajoute|planifie|planifies|prévois|prevois|programme)\s+(.+)$/i);
  if(planningMatch&&/\b(?:planning|demain|aujourd|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|soir|d[iî]ner|d[eé]jeuner|petit[- ]d[eé]jeuner|midi|repas)\b/i.test(planningMatch[1])){
    const fields=planningFields(planningMatch[1],now);
    const draft:LiaDirectAppActionDraft={type:'planning.set_meal',...fields};
    return{recognized:true,draft,missing:missingFor(draft)};
  }
  return{recognized:false};
}

export function liaDirectAppActionClarification(draft:LiaDirectAppActionDraft,languageTag:string):string{
  const fr=languageTag.toLowerCase().startsWith('fr');
  const missing=missingFor(draft);
  if(missing==='label')return fr?'Qu’est-ce que tu veux que j’ajoute aux courses ?':'What should I add to the shopping list?';
  if(missing==='content')return fr?'Qu’est-ce que tu veux que je mette dans Mémos ?':'What should I save in Memos?';
  if(missing==='meal_title')return fr?'Qu’est-ce que tu veux prévoir comme repas ?':'What meal should I plan?';
  if(missing==='date')return fr?'Pour quel jour ?':'For which day?';
  return fr?'Pour quel repas : petit-déjeuner, déjeuner ou dîner ?':'Which meal: breakfast, lunch or dinner?';
}

export function liaDirectMealDisplay(draft:Extract<LiaDirectAppActionDraft,{type:'planning.set_meal'}>,languageTag:string):string{
  const fr=languageTag.toLowerCase().startsWith('fr');
  const meal=fr?(draft.mealType==='breakfast'?'au petit-déjeuner':draft.mealType==='lunch'?'au déjeuner':draft.mealType==='snack'?'au goûter':'au dîner'):(draft.mealType==='breakfast'?'for breakfast':draft.mealType==='lunch'?'for lunch':draft.mealType==='snack'?'for snack':'for dinner');
  return `${draft.displayDay??draft.date??''} ${meal}`.trim();
}
