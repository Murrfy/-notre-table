export type LiaCookingCueKind='timed'|'salt'|'next_step'|'steady';
export type LiaCookingCue={kind:LiaCookingCueKind;seconds:number|null};

/** Extracts an explicit duration from a recipe step. It never invents a timer. */
export function extractCookingDurationSeconds(step:string):number|null{
  const normalized=step.toLowerCase().replace(/,/g,'.');
  const hour=normalized.match(/(\d+(?:\.\d+)?)\s*(?:h|heure|heures|hour|hours|hora|horas|שעה|שעות)\b/i);
  const minute=normalized.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|minuto|minutos|דקה|דקות)\b/i);
  let seconds=0;
  if(hour)seconds+=Math.round(Number(hour[1])*3600);
  if(minute)seconds+=Math.round(Number(minute[1])*60);
  return seconds>0&&seconds<=24*3600?seconds:null;
}

export function liaCookingCue(step:string,index:number,total:number):LiaCookingCue{
  const seconds=extractCookingDurationSeconds(step);
  if(seconds)return{kind:'timed',seconds};
  if(/\b(sel|salt|sal|מלח)\b/i.test(step))return{kind:'salt',seconds:null};
  if(index<Math.max(0,total-1))return{kind:'next_step',seconds:null};
  return{kind:'steady',seconds:null};
}

/** A quiet cooking gap may host one relational prompt later, but never while somebody is speaking. */
export function liaCookingMayOfferConversation(input:{timerRunning:boolean;remainingSeconds:number;humanSpeechActive:boolean;sensitiveMoment:boolean;questionRecentlyAsked:boolean}):boolean{
  if(input.humanSpeechActive||input.sensitiveMoment||input.questionRecentlyAsked)return false;
  return input.timerRunning&&input.remainingSeconds>=120;
}

export function formatCookingClock(seconds:number):string{
  const safe=Math.max(0,Math.floor(seconds));
  const m=Math.floor(safe/60),s=safe%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}


export type LiaCookingGapActivity='relational_question'|'music_offer'|'quiet_company'|'none';
export type LiaCookingGapContext={
  timerRunning:boolean;
  remainingSeconds:number;
  humanSpeechActive:boolean;
  sensitiveMoment:boolean;
  questionRecentlyAsked:boolean;
  organizerEngaged:boolean;
  interventionsLast30Min:number;
  musicAlreadyOffered:boolean;
};

/**
 * Keeps LIA present during real cooking gaps without turning the kitchen into
 * an interview. The model may phrase the chosen activity naturally.
 */
export function chooseLiaCookingGapActivity(input:LiaCookingGapContext):LiaCookingGapActivity{
  if(!input.organizerEngaged||input.humanSpeechActive||input.sensitiveMoment)return'none';
  if(!input.timerRunning||input.remainingSeconds<120)return'none';
  if(input.interventionsLast30Min>=2)return'quiet_company';
  if(!input.questionRecentlyAsked)return'relational_question';
  if(!input.musicAlreadyOffered&&input.remainingSeconds>=300)return'music_offer';
  return'quiet_company';
}

export type LiaCookingQuestionDomain='today'|'family_food'|'nutrition'|'family_life'|'personal';
export type LiaCookingQuestionCandidate={
  id:string;
  domain:LiaCookingQuestionDomain;
  prompt:string;
  requiresKnownFact?:string|null;
  learnsFact:string;
  sensitive:boolean;
};

/**
 * Starter bank only: these are prompts the relationship engine may select,
 * never a questionnaire and never a fixed sequence.
 */
export const liaCookingStarterQuestions:LiaCookingQuestionCandidate[]=[
  {id:'today_plan',domain:'today',prompt:"Tu as quelque chose d’important prévu aujourd’hui ?",learnsFact:'today_plan',sensitive:false},
  {id:'family_gluten',domain:'nutrition',prompt:"Tiens, au fait… quelqu’un mange sans gluten chez vous ?",learnsFact:'family_gluten',sensitive:false},
  {id:'family_allergy',domain:'nutrition',prompt:"Il y a une allergie alimentaire dans la famille que je dois vraiment connaître ?",learnsFact:'family_allergy',sensitive:true},
  {id:'family_favorite',domain:'family_food',prompt:"Qui est le plus gourmand chez vous ?",learnsFact:'family_gourmand',sensitive:false},
  {id:'sport',domain:'nutrition',prompt:"Il y en a un qui fait beaucoup de sport dans la famille ?",learnsFact:'family_sport',sensitive:false},
  {id:'day_off',domain:'personal',prompt:"Au fait, c’est quoi ton jour de congé normalement ?",learnsFact:'organizer_day_off',sensitive:false},
];

/**
 * Knowledge gaps drive curiosity. LIA never asks for a fact already confirmed,
 * and personal/sensitive prompts are excluded when the context is not private.
 */
export function chooseLiaCookingQuestion(input:{
  knownFactKeys:string[];
  recentlyAskedIds:string[];
  privateContext:boolean;
  preferredDomains?:LiaCookingQuestionDomain[];
}):LiaCookingQuestionCandidate|null{
  const known=new Set(input.knownFactKeys);
  const recent=new Set(input.recentlyAskedIds);
  const preferred=new Set(input.preferredDomains??[]);
  const candidates=liaCookingStarterQuestions.filter(q=>
    !known.has(q.learnsFact)&&
    !recent.has(q.id)&&
    (!q.sensitive||input.privateContext)&&
    (!q.requiresKnownFact||known.has(q.requiresKnownFact))
  );
  candidates.sort((a,b)=>{
    const ap=preferred.has(a.domain)?1:0,bp=preferred.has(b.domain)?1:0;
    return bp-ap;
  });
  return candidates[0]??null;
}


export type LiaHandsFreeCookingIntent='start_timer'|'cancel_timer'|'timer_remaining'|'step_status'|'go_to_step'|'next_step'|'complete_step'|'finish_recipe'|'previous_step'|'repeat_step'|'show_ingredients'|'hide_ingredients'|'list_ingredients'|'music'|'stop_voice'|'unknown';

export function liaHandsFreeCookingStepNumber(text:string):number|null{
  const folded=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'");
  const match=folded.match(/(?:etape|step|paso|שלב)\s*(?:numero|number|n[oº°]?\.?|מספר)?\s*([\p{L}\d'-]+)/iu);
  if(!match)return null;
  if(/^\d{1,2}$/.test(match[1])){const value=Number(match[1]);return value>=1&&value<=99?value:null;}
  const words:Record<string,number>={un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,treize:13,quatorze:14,quinze:15,seize:16,dixsept:17,dixhuit:18,dixneuf:19,vingt:20,one:1,two:2,three:3,four:4,five:5,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,veinte:20,'אחד':1,'אחת':1,'שניים':2,'שתיים':2,'שלוש':3,'ארבע':4,'חמש':5,'שש':6,'שבע':7,'שמונה':8,'תשע':9,'עשר':10};
  const token=match[1].replace(/[-']/g,'');
  return words[token]??null;
}

export function liaHandsFreeCookingIntent(text:string):LiaHandsFreeCookingIntent{
  const value=text.trim().toLowerCase();
  const folded=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  // A recipe-timer cancellation wins over the generic stop-speaking command.
  if(/\b(annule|arr[eê]te|stoppe|stop|cancel)\b.*\b(minuteur|timer|chrono)\b/i.test(value))return'cancel_timer';
  if(/(?:va|vas|passe|reviens|retourne|go|jump|ve|vuelve|עבור|חזור).*(?:etape|step|paso|שלב)\s*(?:numero|number|n[oº°]?\.?|מספר)?\s*[\p{L}\d'-]+/iu.test(folded)&&liaHandsFreeCookingStepNumber(text)!==null)return'go_to_step';
  // Recipe progress must win over the generic « il reste combien ? » timer shortcut.
  if(/(?:ou\s+(?:est[- ]?ce\s+qu['’]?|en\s+)?on\s+en\s+est|on\s+en\s+est\s+ou|(?:je\s+suis|on\s+est)\s+a\s+quelle\s+etape|quelle\s+etape|il\s+reste\s+combien\s+d['’]?etapes?|combien\s+d['’]?etapes?\s+(?:il\s+)?reste|combien\s+d['’]?etapes?\s+restent|recipe\s+progress|what\s+step\s+are\s+we\s+on)/i.test(folded))return'step_status';
  if(/\b(?:il\s+reste\s+combien|reste\s+combien)\b/i.test(value)||/\b(combien|reste|remaining|left)\b.*\b(min|minute|temps|time)\b/i.test(value))return'timer_remaining';
  if(/\b(lance|mets|d[eé]marre|start)\b.*\b(min|minute|timer|chrono)/i.test(value))return'start_timer';
  if(/\b(r[eé]p[eè]te|redis|repeat)\b/i.test(value))return'repeat_step';
  if(/(?:(?:j['’]?ai|on\s+a)\s+(?:fini|termine)\s+(?:la\s+)?recette|(?:finis?|termine|ferme|quitte)\s+(?:la\s+)?recette|(?:quitte|ferme)\s+(?:le\s+)?mode\s+cuisine|finish\s+(?:the\s+)?recipe|exit\s+cooking\s+mode)/i.test(folded))return'finish_recipe';
  if(/(?:j['’]?ai\s+(?:fini|termine)\s+(?:(?:cette|l['’])\s*)?etape|(?:cette\s+)?etape\s+(?:est\s+)?(?:finie|terminee)|done\s+with\s+(?:this\s+)?step|this\s+step\s+is\s+done)/i.test(folded))return'complete_step';
  if(/(?:etape\s+precedente|precedente\s+etape|previous\s+step|go\s+back)/i.test(folded))return'previous_step';
  if(/\b(suite|apr[eè]s|prochaine [eé]tape|next step)\b/i.test(value))return'next_step';
  if(/(?:lis(?:-?moi)?|donne(?:-?moi)?|quels?\s+sont|c['’]?est\s+quoi|what\s+are|read)\s+(?:les\s+|the\s+)?(?:ingredients?)/i.test(folded))return'list_ingredients';
  if(/(?:montre|affiche|ouvre|voir|show|display|open)(?:-?moi)?\s+(?:les\s+|the\s+)?(?:ingredients?)/i.test(folded))return'show_ingredients';
  if(/(?:cache|masque|ferme|hide|close)(?:-?moi)?\s+(?:les\s+|the\s+)?(?:ingredients?)/i.test(folded))return'hide_ingredients';
  if(/\b(arr[eê]te|stop|tais[- ]toi|silence)\b/i.test(value))return'stop_voice';
  if(/\b(musique|music|playlist)\b/i.test(value))return'music';
  return'unknown';
}

export function liaHandsFreeTimerSeconds(text:string):number|null{
  const normalized=text.toLowerCase().replace(/,/g,'.');
  const min=normalized.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\b/i);
  const sec=normalized.match(/(\d+)\s*(?:sec|seconde|secondes|seconds)\b/i);
  let total=0;
  if(min)total+=Math.round(Number(min[1])*60);
  if(sec)total+=Number(sec[1]);
  return total>0&&total<=24*3600?total:null;
}


export type LiaHandsFreeCookingAction={
  kind:LiaHandsFreeCookingIntent;
  timerSeconds:number|null;
  stepNumber?:number|null;
  needsStreamingIntegration:boolean;
  safeToExecuteLocally:boolean;
};

/**
 * Turns a recognized kitchen phrase into a bounded action plan. Local recipe
 * navigation/timers are executable; music is only a request until a provider
 * integration exists.
 */
export function liaHandsFreeCookingAction(text:string):LiaHandsFreeCookingAction{
  const kind=liaHandsFreeCookingIntent(text);
  const timerSeconds=kind==='start_timer'?liaHandsFreeTimerSeconds(text):null;
  const stepNumber=kind==='go_to_step'?liaHandsFreeCookingStepNumber(text):null;
  if(kind==='start_timer')return{kind,timerSeconds,needsStreamingIntegration:false,safeToExecuteLocally:timerSeconds!==null};
  if(kind==='go_to_step')return{kind,timerSeconds:null,stepNumber,needsStreamingIntegration:false,safeToExecuteLocally:stepNumber!==null};
  if(kind==='music')return{kind,timerSeconds:null,needsStreamingIntegration:true,safeToExecuteLocally:false};
  if(kind==='next_step'||kind==='complete_step'||kind==='finish_recipe'||kind==='previous_step'||kind==='repeat_step'||kind==='timer_remaining'||kind==='step_status'||kind==='cancel_timer'||kind==='show_ingredients'||kind==='hide_ingredients'||kind==='list_ingredients'||kind==='stop_voice')return{kind,timerSeconds:null,needsStreamingIntegration:false,safeToExecuteLocally:true};
  return{kind:'unknown',timerSeconds:null,needsStreamingIntegration:false,safeToExecuteLocally:false};
}


export type LiaCookingRuntimeState={
  stepIndex:number;
  stepCount:number;
  timerEndsAtMs:number|null;
  voiceShouldStop:boolean;
};

export function applyLiaHandsFreeCookingAction(input:{
  state:LiaCookingRuntimeState;
  action:LiaHandsFreeCookingAction;
  nowMs:number;
}):LiaCookingRuntimeState{
  const state={...input.state};
  if(!input.action.safeToExecuteLocally)return state;
  if(input.action.kind==='start_timer'&&input.action.timerSeconds!==null){
    state.timerEndsAtMs=input.nowMs+input.action.timerSeconds*1000;
  }else if(input.action.kind==='cancel_timer'){
    state.timerEndsAtMs=null;
  }else if(input.action.kind==='go_to_step'&&input.action.stepNumber!==null&&input.action.stepNumber!==undefined){
    if(input.action.stepNumber>=1&&input.action.stepNumber<=state.stepCount)state.stepIndex=input.action.stepNumber-1;
  }else if(input.action.kind==='next_step'||input.action.kind==='complete_step'){
    state.stepIndex=Math.min(Math.max(0,state.stepCount-1),state.stepIndex+1);
  }else if(input.action.kind==='previous_step'){
    state.stepIndex=Math.max(0,state.stepIndex-1);
  }else if(input.action.kind==='stop_voice'){
    state.voiceShouldStop=true;
  }
  return state;
}


export type LiaCookingVoiceReplyKind='none'|'repeat_step'|'step_status'|'timer_remaining'|'timer_not_running'|'timer_cancelled'|'last_step'|'first_step';

export function liaCookingVoiceReply(input:{
  action:LiaHandsFreeCookingAction;
  currentStep:string;
  stepIndex:number;
  stepCount:number;
  timerRemainingSeconds:number|null;
}):{kind:LiaCookingVoiceReplyKind;textValue:string|null}{
  if(input.action.kind==='repeat_step')return{kind:'repeat_step',textValue:input.currentStep.trim()||null};
  if(input.action.kind==='step_status')return{kind:'step_status',textValue:input.currentStep.trim()||null};
  if(input.action.kind==='timer_remaining'){
    if(input.timerRemainingSeconds===null)return{kind:'timer_not_running',textValue:null};
    return{kind:'timer_remaining',textValue:formatCookingClock(input.timerRemainingSeconds)};
  }
  if(input.action.kind==='cancel_timer')return input.timerRemainingSeconds===null?{kind:'timer_not_running',textValue:null}:{kind:'timer_cancelled',textValue:null};
  if((input.action.kind==='next_step'||input.action.kind==='complete_step')&&input.stepIndex>=Math.max(0,input.stepCount-1))return{kind:'last_step',textValue:null};
  if(input.action.kind==='previous_step'&&input.stepIndex<=0)return{kind:'first_step',textValue:null};
  return{kind:'none',textValue:null};
}


export type LiaCookingTimerCompletionDecision='silent'|'announce';

export function liaCookingTimerCompletionDecision(input:{
  timerWasRunning:boolean;
  remainingSeconds:number;
  humanSpeechActive:boolean;
  liaSpeaking:boolean;
  sessionActive:boolean;
}):LiaCookingTimerCompletionDecision{
  if(!input.sessionActive||!input.timerWasRunning||input.remainingSeconds>0)return'silent';
  if(input.humanSpeechActive||input.liaSpeaking)return'silent';
  return'announce';
}
