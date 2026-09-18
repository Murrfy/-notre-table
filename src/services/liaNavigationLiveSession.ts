export type LiaNavigationLiveState={
  active:boolean;
  destinationTitle:string|null;
  destinationPlaceId:string|null;
  destinationLatitude:number|null;
  destinationLongitude:number|null;
  etaSeconds:number|null;
  distanceMeters:number|null;
  instruction:string|null;
  stepDistanceMeters:number|null;
  navState:'enroute'|'rerouting'|'stopped'|'unknown';
  updatedAtMs:number;
};

let state:LiaNavigationLiveState={active:false,destinationTitle:null,destinationPlaceId:null,destinationLatitude:null,destinationLongitude:null,etaSeconds:null,distanceMeters:null,instruction:null,stepDistanceMeters:null,navState:'stopped',updatedAtMs:0};

export function beginLiaNavigationLiveSession(destination:{title:string;placeId?:string|null;latitude?:number|null;longitude?:number|null}|string,nowMs=Date.now()){
  const value=typeof destination==='string'?{title:destination,placeId:null,latitude:null,longitude:null}:destination;
  state={active:true,destinationTitle:value.title.trim()||null,destinationPlaceId:value.placeId?.trim()||null,destinationLatitude:typeof value.latitude==='number'&&Number.isFinite(value.latitude)?value.latitude:null,destinationLongitude:typeof value.longitude==='number'&&Number.isFinite(value.longitude)?value.longitude:null,etaSeconds:null,distanceMeters:null,instruction:null,stepDistanceMeters:null,navState:'enroute',updatedAtMs:nowMs};
}

export function updateLiaNavigationLiveSession(input:{etaSeconds:number;distanceMeters:number;instruction?:string|null;stepDistanceMeters?:number|null;navState:'enroute'|'rerouting'|'stopped'|'unknown'},nowMs=Date.now()){
  if(!state.active&&input.navState!=='stopped')state={...state,active:true};
  state={
    ...state,
    active:input.navState!=='stopped'&&state.active,
    etaSeconds:Number.isFinite(input.etaSeconds)&&input.etaSeconds>=0?input.etaSeconds:null,
    distanceMeters:Number.isFinite(input.distanceMeters)&&input.distanceMeters>=0?input.distanceMeters:null,
    instruction:input.instruction?.trim()||null,
    stepDistanceMeters:input.stepDistanceMeters!==null&&input.stepDistanceMeters!==undefined&&Number.isFinite(input.stepDistanceMeters)&&input.stepDistanceMeters>=0?input.stepDistanceMeters:null,
    navState:input.navState,
    updatedAtMs:nowMs,
  };
}

export function endLiaNavigationLiveSession(nowMs=Date.now()){
  state={active:false,destinationTitle:null,destinationPlaceId:null,destinationLatitude:null,destinationLongitude:null,etaSeconds:null,distanceMeters:null,instruction:null,stepDistanceMeters:null,navState:'stopped',updatedAtMs:nowMs};
}

export function getLiaNavigationLiveSession():LiaNavigationLiveState{return{...state};}
export function liaNavigationLiveSessionActive():boolean{return state.active;}

function fold(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
function french(languageTag:string){return languageTag.toLowerCase().startsWith('fr');}
function formatMinutes(seconds:number,languageTag:string){
  const minutes=Math.max(1,Math.round(seconds/60));
  if(french(languageTag))return minutes===1?'1 minute':`${minutes} minutes`;
  return minutes===1?'1 minute':`${minutes} minutes`;
}
function formatDistance(meters:number,languageTag:string){
  if(meters<1000){const rounded=Math.max(10,Math.round(meters/10)*10);return french(languageTag)?`${rounded} mètres`:`${rounded} meters`;}
  const km=meters/1000;const value=km<10?km.toFixed(1):km<100?km.toFixed(1):Math.round(km).toString();
  return french(languageTag)?`${value.replace('.',',')} kilomètres`:`${value} kilometers`;
}
function arrivalClock(etaSeconds:number,languageTag:string,nowMs:number){
  const date=new Date(nowMs+Math.max(0,etaSeconds)*1000);
  try{return new Intl.DateTimeFormat(languageTag,{hour:'2-digit',minute:'2-digit'}).format(date);}catch{return new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(date);}
}

export type LiaNavigationLiveReply={kind:'eta'|'distance'|'instruction'|'status';spokenReply:string};

export function liaNavigationLiveReply(text:string,languageTag:string,nowMs=Date.now()):LiaNavigationLiveReply|null{
  const current=state;
  if(!current.active)return null;
  const s=fold(text);
  const asksEta=/\b(on arrive quand|on arrive a quelle heure|a quelle heure on arrive|heure d arrivee|heure arrivee|combien de temps|temps reste|il reste combien de temps|encore combien de temps|when do we arrive|what time do we arrive|how long left|how much longer)\b/.test(s);
  const asksDistance=/\b(combien de kilometres|combien de km|quelle distance|distance reste|il reste combien de kilometres|il reste combien de km|how many kilometers|how many km|how far|distance left)\b/.test(s);
  const asksInstruction=/\b(prochaine indication|prochaine direction|je tourne ou|on tourne ou|quelle sortie|prochain virage|next direction|next turn|where do i turn)\b/.test(s);
  const asksStatus=/^(?:on en est ou|on est ou|ou en est on|where are we)$/i.test(s);
  if(!asksEta&&!asksDistance&&!asksInstruction&&!asksStatus)return null;
  const stale=nowMs-current.updatedAtMs>120_000;
  if(stale)return{kind:'status',spokenReply:french(languageTag)?'Je n’ai pas une position assez récente pour te répondre correctement.':'I do not have a recent enough position to answer reliably.'};
  if(asksInstruction){
    if(current.navState==='rerouting')return{kind:'instruction',spokenReply:french(languageTag)?'Je recalcule l’itinéraire.':'I am recalculating the route.'};
    if(current.instruction){const prefix=current.stepDistanceMeters!==null?`${french(languageTag)?'Dans':'In'} ${formatDistance(current.stepDistanceMeters,languageTag)}, `:'';return{kind:'instruction',spokenReply:`${prefix}${current.instruction}`.trim()};}
    return{kind:'instruction',spokenReply:french(languageTag)?'Je n’ai pas encore la prochaine indication.':'I do not have the next direction yet.'};
  }
  if(asksDistance&&current.distanceMeters!==null)return{kind:'distance',spokenReply:french(languageTag)?`Il reste environ ${formatDistance(current.distanceMeters,languageTag)}.`:`About ${formatDistance(current.distanceMeters,languageTag)} remaining.`};
  if(asksEta&&current.etaSeconds!==null){
    const duration=formatMinutes(current.etaSeconds,languageTag);const clock=arrivalClock(current.etaSeconds,languageTag,nowMs);
    return{kind:'eta',spokenReply:french(languageTag)?`On arrive vers ${clock}, dans environ ${duration}.`:`We should arrive around ${clock}, in about ${duration}.`};
  }
  if(asksStatus){
    if(current.etaSeconds!==null&&current.distanceMeters!==null)return{kind:'status',spokenReply:french(languageTag)?`Il reste environ ${formatDistance(current.distanceMeters,languageTag)}, soit ${formatMinutes(current.etaSeconds,languageTag)}.`:`About ${formatDistance(current.distanceMeters,languageTag)} and ${formatMinutes(current.etaSeconds,languageTag)} remaining.`};
    return{kind:'status',spokenReply:french(languageTag)?'Le guidage est bien en cours.':'Guidance is active.'};
  }
  return null;
}
