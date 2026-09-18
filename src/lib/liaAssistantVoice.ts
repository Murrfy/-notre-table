import {stripLiaKnownDirectName} from './liaIdentity';
export type LiaAssistantVoiceIntent='answer'|'research'|'reminder'|'timer'|'phone_call'|'message'|'music'|'navigation'|'calendar'|'pantry_vision'|'action'|'listen_only';
export type LiaAssistantVoiceRequest={directAddressed:boolean;cleanedText:string;intent:LiaAssistantVoiceIntent;target:string|null};
export type LiaMessageDraft={recipientName:string;body:string};
export type LiaPartialMessageDraft={recipientName:string|null;body:string|null};

export function parseLiaMessageDraft(text:string):LiaMessageDraft|null{
  const clean=stripLiaDirectAddress(text).cleanedText.trim();
  const patterns=[
    /^(?:envoie|écris|ecris)\s+(?:un\s+)?(?:message|sms)\s+(?:à|a)\s+(.+?)\s*(?:\s:\s|\s+-\s+|\s+pour\s+(?:lui\s+)?dire\s+|\s+en\s+disant\s+)(.+)$/i,
    /^(?:send|text)\s+(?:a\s+)?(?:message\s+)?(?:to\s+)?(.+?)\s*(?:\s:\s|\s+-\s+|\s+saying\s+)(.+)$/i,
  ];
  for(const pattern of patterns){
    const match=clean.match(pattern);
    const recipientName=match?.[1]?.trim().replace(/[,:;.!?]+$/,'').trim()??'';
    const body=match?.[2]?.trim()??'';
    if(recipientName&&body)return{recipientName,body};
  }
  return null;
}

export function parseLiaPartialMessageDraft(text:string):LiaPartialMessageDraft|null{
  const full=parseLiaMessageDraft(text);if(full)return full;
  const clean=stripLiaDirectAddress(text).cleanedText.trim();
  const recipientOnly=clean.match(/^(?:envoie|écris|ecris)\s+(?:un\s+)?(?:message|sms)\s+(?:à|a)\s+(.+?)\s*[.!?]*$/i);
  if(recipientOnly?.[1]?.trim())return{recipientName:recipientOnly[1].trim(),body:null};
  const bodyOnly=clean.match(/^(?:envoie|écris|ecris)\s+(?:un\s+)?(?:message|sms)\s*(?:\s:\s|\s+-\s+)(.+)$/i);
  if(bodyOnly?.[1]?.trim())return{recipientName:null,body:bodyOnly[1].trim()};
  if(/^(?:envoie|écris|ecris)\s+(?:un\s+)?(?:message|sms)\s*[.!?]*$/i.test(clean))return{recipientName:null,body:null};
  return null;
}

export function liaPhonePronunciationRetryReply(attempt:number,languageTag:string):string{
  const french=languageTag.toLowerCase().startsWith('fr');
  if(attempt===2)return french?'Tu peux arrêter de bafouiller ? Allez, redis-moi le prénom.':'Can you stop mumbling? Come on, tell me the first name again.';
  if(attempt>2)return french?'Allez, redis-moi doucement le prénom.':'Tell me the first name again, slowly.';
  return french?'Je n’ai pas bien compris le prénom. Redis-le-moi.':'I didn’t understand the first name. Tell me again.';
}

export function isLiaAssistantActionCancellation(text:string,directNames:ReadonlyArray<string>=['LIA']):boolean{
  const clean=stripLiaDirectAddress(text,directNames).cleanedText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.!?,;:]+/g,' ').trim().replace(/\s+/g,' ');
  return /^(?:annule|annule ca|laisse tomber|oublie|oublie ca|stop|cancel|cancel that|never mind|forget it)$/.test(clean);
}

function fold(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}

export function stripLiaDirectAddress(text:string,directNames:ReadonlyArray<string>=['LIA']):{directAddressed:boolean;cleanedText:string}{
  const result=stripLiaKnownDirectName(text,directNames);
  return{directAddressed:result.directAddressed,cleanedText:result.cleanedText};
}

export function extractLiaPhoneCallTarget(text:string,directNames:ReadonlyArray<string>=['LIA']):string|null{
  const clean=stripLiaDirectAddress(text,directNames).cleanedText.trim();
  const patterns=[
    /^(?:appelle|telephone\s+a|telephone|passe(?:-moi)?\s+un\s+coup\s+de\s+fil\s+a)\s+(.+)$/i,
    /^(?:call|phone)\s+(.+)$/i,
    /^(?:llama\s+a|llama)\s+(.+)$/i,
    /^(?:התקשר(?:י)?\s+(?:אל|ל))\s*(.+)$/i,
  ];
  for(const pattern of patterns){const match=clean.match(pattern);if(match?.[1])return match[1].trim().replace(/[.!?]+$/,'').trim()||null;}
  return null;
}

export function routeLiaAssistantVoiceRequest(text:string,directNames:ReadonlyArray<string>=['LIA']):LiaAssistantVoiceRequest{
  const addressed=stripLiaDirectAddress(text,directNames);
  if(!addressed.directAddressed)return{...addressed,intent:'listen_only',target:null};
  const target=extractLiaPhoneCallTarget(text,directNames);
  if(target)return{...addressed,intent:'phone_call',target};
  const s=fold(addressed.cleanedText);
  if(/^(?:appelle|telephone(?:\s+a)?|call|phone|llama(?:\s+a)?|התקשר(?:י)?)\s*[.!?]*$/.test(s))return{...addressed,intent:'phone_call',target:null};
  if(/^(?:envoie|ecris|écris)\s+(?:un\s+)?(?:message|sms)|^(?:send|text)\s+/.test(s))return{...addressed,intent:'message',target:null};
  if(/\b(calendrier|agenda|rendez[- ]vous|rdv|calendar|appointment)\b/.test(s)||/^(?:qu est ce que j ai|j ai quoi|qu est ce qui est prevu|fais[- ]?moi le point sur (?:ma )?(?:journee|journée|semaine)|mon prochain rendez vous|c est quoi mon prochain rendez vous)\b/.test(s))return{...addressed,intent:'calendar',target:null};
  if(/^(?:regarde|montre|scanne|scan)\b.*\b(?:frigo|refrigerateur|réfrigérateur|placard|garde manger|ingredients?|ingrédients?)\b/.test(s)||/^(?:regarde|dis moi|dis-moi)\s+(?:ce que|qu est ce que)\s+j ai\b/.test(s)||/^(?:je te montre)\b.*\b(?:frigo|placard|ingredients?|ingrédients?)\b/.test(s))return{...addressed,intent:'pantry_vision',target:null};
  if(/\b(rappelle[- ]moi|rappelle nous|remind me|recuerdame|תזכיר)/.test(s))return{...addressed,intent:'reminder',target:null};
  if(/\b(minuteur|chrono|timer|temporizador|טיימר)\b/.test(s))return{...addressed,intent:'timer',target:null};
  if(/^(?:emmene[- ]?moi|amene[- ]?moi|guide[- ]?moi|conduis[- ]?moi|navigue)\b|^(?:take me|guide me|navigate|drive me)\b|^(?:llevame|guiame)\b|^(?:קחי אותי|קח אותי|נווטי|נווט)\b/.test(s))return{...addressed,intent:'navigation',target:null};
  if(/^(?:(?:tu\s+me\s+)?(?:mets|met|lance|joue)|(?:peux\s+tu|est\s+ce\s+que\s+tu)\s+(?:me\s+)?(?:mettre|lancer|jouer))\s+(?:moi\s+)?(?:de\s+)?(?:la\s+)?musique\b|^(?:mets|met|lance|joue)\s+(?:moi\s+)?(?:la\s+chanson|le\s+morceau|l['’]album|la\s+playlist)\b|^(?:play)\s+(?:some\s+)?music\b|\b(?:spotify|apple music|musique apple|youtube music)\b/.test(s))return{...addressed,intent:'music',target:null};
  if(/\b(cherche|recherche|trouve|verifie|vérifie|look up|search|busca|cherche sur internet)\b/.test(s))return{...addressed,intent:'research',target:null};
  if(/\b(prepare|prépare|ajoute|mets|garde|note|enregistre|planifie|prévois|prevois|programme|commande|reserve|réserve)\b/.test(s))return{...addressed,intent:'action',target:null};
  return{...addressed,intent:'answer',target:null};
}
