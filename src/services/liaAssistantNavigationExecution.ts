let pendingNavigation=false;

function stripLead(value:string):string{return value.trim().replace(/^[,:;.!?\s]+/,'').replace(/[.!?]+$/,'').trim();}

export function liaNavigationClarificationPending():boolean{return pendingNavigation;}
export function clearLiaNavigationClarification(){pendingNavigation=false;}

export function extractLiaNavigationDestination(text:string):string|null{
  const clean=text.trim();
  const patterns=[
    /^(?:emm[eè]ne[- ]?moi|am[eè]ne[- ]?moi|guide[- ]?moi|conduis[- ]?moi|navigue)\s+(?:à|a|vers|jusqu['’]à|jusqu['’]a)?\s*(.+)$/i,
    /^(?:take me|guide me|navigate|drive me)\s+(?:to\s+)?(.+)$/i,
    /^(?:ll[eé]vame|gu[ií]ame)\s+(?:a\s+)?(.+)$/i,
    /^(?:קחי אותי|קח אותי|נווטי|נווט)\s+(?:אל|ל)?\s*(.+)$/i,
  ];
  for(const pattern of patterns){const match=clean.match(pattern);const destination=stripLead(match?.[1]??'');if(destination)return destination;}
  return null;
}

function clarification(languageTag:string):string{return languageTag.toLowerCase().startsWith('fr')?'Où veux-tu aller ?':'Where do you want to go?';}
function opened(destination:string,languageTag:string):string{return languageTag.toLowerCase().startsWith('fr')?`J’ouvre En route avec LIA pour ${destination}.`:`I’m opening On the road with LIA for ${destination}.`;}

export function prepareLiaNavigationFromSpeech(text:string,languageTag:string):{status:'requested';destination:string;spokenReply:string}|{status:'needs_clarification';spokenReply:string}|{status:'not_recognized'}{
  const destination=extractLiaNavigationDestination(text);
  const looksLikeNavigation=/\b(?:emm[eè]ne|am[eè]ne|guide|conduis|navigue|take me|guide me|navigate|drive me|ll[eé]vame|gu[ií]ame|קחי אותי|קח אותי|נווטי|נווט)\b/i.test(text);
  if(destination){pendingNavigation=false;return{status:'requested',destination,spokenReply:opened(destination,languageTag)};}
  if(looksLikeNavigation){pendingNavigation=true;return{status:'needs_clarification',spokenReply:clarification(languageTag)};}
  return{status:'not_recognized'};
}

export function continueLiaNavigationClarification(text:string,languageTag:string):{status:'requested';destination:string;spokenReply:string}|{status:'needs_clarification';spokenReply:string}{
  const destination=stripLead(text.replace(/^(?:à|a|vers|pour|to)\s+/i,''));
  if(!destination){pendingNavigation=true;return{status:'needs_clarification',spokenReply:clarification(languageTag)};}
  pendingNavigation=false;
  return{status:'requested',destination,spokenReply:opened(destination,languageTag)};
}
