import {composeLiaDeviceMessage,liaDeviceMessageComposerAvailable} from '../../modules/lia-device-contacts';
import {parseLiaMessageDraft,parseLiaPartialMessageDraft,type LiaMessageDraft,type LiaPartialMessageDraft} from '../lib/liaAssistantVoice';
import {liaPhoneLabelMatchesAnswer,normalizeLiaContactName,resolveLiaPhoneContact,sanitizeLiaPhoneNumber,type LiaPhoneContact,type LiaPhoneNumber} from '../lib/liaPhoneContactResolver';
import {getLiaPhoneContactsAdapter} from './liaPhoneContactsAdapter';

export type LiaMessagePreparation={status:'prepared'|'needs_clarification';message?:string};
export interface LiaMessageActionAdapter{
  isAvailable():boolean;
  prepareFromSpeech(text:string):Promise<LiaMessagePreparation>;
}
type PendingMessageClarification={draft:LiaMessageDraft;kind:'recipient'|'confirm'|'ambiguous'|'number';contact?:LiaPhoneContact;contacts?:LiaPhoneContact[];phoneNumbers?:LiaPhoneNumber[]};
let pendingMessage:PendingMessageClarification|null=null;
let pendingIncompleteMessage:LiaPartialMessageDraft|null=null;

async function openMessageDraft(draft:LiaMessageDraft,contact:LiaPhoneContact,phoneNumber:LiaPhoneNumber):Promise<LiaMessagePreparation>{
  const phone=sanitizeLiaPhoneNumber(phoneNumber.number);
  if(!phone){pendingMessage=null;return{status:'needs_clarification',message:'Le numéro trouvé n’est pas utilisable.'};}
  const opened=await composeLiaDeviceMessage({recipients:[phone],body:draft.body});
  pendingMessage=null;
  return opened?{status:'prepared',message:`Le SMS pour ${contact.displayName} est prêt. Vérifie-le et appuie toi-même sur Envoyer.`}:{status:'needs_clarification',message:'Je n’arrive pas à ouvrir Messages sur ce téléphone.'};
}

async function resolveMessageDraft(draft:LiaMessageDraft,requestedName=draft.recipientName):Promise<LiaMessagePreparation>{
  const contacts=getLiaPhoneContactsAdapter();
  if(!contacts){pendingMessage=null;return{status:'needs_clarification',message:'Je ne peux pas accéder aux contacts du téléphone pour le moment.'};}
  if(contacts.permissionStatus()!=='granted'&&!await contacts.requestPermission()){pendingMessage=null;return{status:'needs_clarification',message:'J’ai besoin de ton autorisation pour chercher le destinataire dans tes contacts.'};}
  const resolution=resolveLiaPhoneContact(requestedName,await contacts.search(requestedName));
  if(resolution.status==='no_match'||resolution.status==='invalid_target'){
    pendingMessage={draft,kind:'recipient'};
    return{status:'needs_clarification',message:`Je ne trouve pas ${requestedName} dans tes contacts. Redis-moi seulement le prénom.`};
  }
  if(resolution.status==='ambiguous_contact'){
    pendingMessage={draft,kind:'ambiguous',contacts:resolution.contacts};
    return{status:'needs_clarification',message:`J’en trouve plusieurs : ${resolution.contacts.map(contact=>contact.displayName).join(', ')}. Dis-moi lequel tu veux.`};
  }
  if(resolution.status==='confirm_contact'){
    pendingMessage={draft,kind:'confirm',contact:resolution.contact};
    return{status:'needs_clarification',message:`Tu parles bien de ${resolution.contact.displayName} ?`};
  }
  if(resolution.status==='no_number'){pendingMessage=null;return{status:'needs_clarification',message:`${resolution.contact.displayName} n’a pas de numéro utilisable dans tes contacts.`};}
  if(resolution.status==='choose_number'){
    pendingMessage={draft,kind:'number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers};
    const labels=resolution.phoneNumbers.map((phone,index)=>phone.label?.trim()||`numéro ${index+1}`);
    return{status:'needs_clarification',message:`${resolution.contact.displayName} a plusieurs numéros : ${labels.join(', ')}. Dis-moi lequel utiliser.`};
  }
  return openMessageDraft(draft,resolution.contact,resolution.phoneNumber);
}

const nativeAdapter:LiaMessageActionAdapter={
  isAvailable:()=>liaDeviceMessageComposerAvailable()&&Boolean(getLiaPhoneContactsAdapter()),
  prepareFromSpeech:async text=>{
    pendingMessage=null;
    pendingIncompleteMessage=null;
    const draft=parseLiaMessageDraft(text);
    if(!draft){
      const partial=parseLiaPartialMessageDraft(text);
      if(!partial)return{status:'needs_clarification',message:'Dis-moi à qui écrire et le message exact.'};
      pendingIncompleteMessage=partial;
      if(partial.recipientName&&!partial.body)return{status:'needs_clarification',message:`Qu’est-ce que tu veux écrire à ${partial.recipientName} ?`};
      if(!partial.recipientName&&partial.body)return{status:'needs_clarification',message:'À qui veux-tu envoyer ce message ?'};
      return{status:'needs_clarification',message:'Dis-moi le destinataire et le message exact.'};
    }
    return resolveMessageDraft(draft);
  },
};
let adapter:LiaMessageActionAdapter|null=null;
export function registerLiaMessageActionAdapter(value:LiaMessageActionAdapter|null):void{adapter=value;}
export function getLiaMessageActionAdapter():LiaMessageActionAdapter|null{const candidate=adapter??nativeAdapter;return candidate.isAvailable()?candidate:null;}
export async function prepareLiaMessageFromSpeech(text:string):Promise<LiaMessagePreparation|{status:'unavailable'}>{
  const current=getLiaMessageActionAdapter();
  if(!current)return{status:'unavailable'};
  return current.prepareFromSpeech(text);
}

export function liaMessageClarificationPending():boolean{return pendingMessage!==null||pendingIncompleteMessage!==null;}
export function clearLiaMessageClarification():void{pendingMessage=null;pendingIncompleteMessage=null;}
export async function continueLiaMessageClarification(answer:string):Promise<LiaMessagePreparation|{status:'unavailable'}>{
  const incomplete=pendingIncompleteMessage;
  if(incomplete){
    const clean=answer.trim();
    if(!clean)return{status:'needs_clarification',message:'Je n’ai rien entendu. Redis-moi seulement l’information manquante.'};
    if(incomplete.recipientName&&!incomplete.body){pendingIncompleteMessage=null;return resolveMessageDraft({recipientName:incomplete.recipientName,body:clean});}
    if(!incomplete.recipientName&&incomplete.body){pendingIncompleteMessage=null;return resolveMessageDraft({recipientName:clean,body:incomplete.body});}
    const completed=parseLiaMessageDraft(clean);
    if(completed){pendingIncompleteMessage=null;return resolveMessageDraft(completed);}
    return{status:'needs_clarification',message:'Dis-moi par exemple : à Raphaël, je rentre à 19 heures.'};
  }
  const pending=pendingMessage;
  if(!pending)return{status:'unavailable'};
  const clean=answer.trim();
  const normalized=normalizeLiaContactName(clean);
  if(!clean)return{status:'needs_clarification',message:'Redis-moi simplement ton choix.'};
  if(pending.kind==='confirm'&&pending.contact){
    if(['oui','yes','si','כן'].includes(normalized)){
      const resolution=resolveLiaPhoneContact(pending.contact.displayName,[pending.contact]);
      if(resolution.status==='resolved')return openMessageDraft(pending.draft,resolution.contact,resolution.phoneNumber);
      if(resolution.status==='choose_number'){pendingMessage={...pending,kind:'number',phoneNumbers:resolution.phoneNumbers};return{status:'needs_clarification',message:'Quel numéro veux-tu utiliser ?'};}
    }
    pendingMessage={draft:pending.draft,kind:'recipient'};
    return{status:'needs_clarification',message:'D’accord. Redis-moi seulement le prénom.'};
  }
  if(pending.kind==='ambiguous'&&pending.contacts){
    const matches=pending.contacts.filter(contact=>{const name=normalizeLiaContactName(contact.displayName);return name===normalized||name.includes(normalized);});
    if(matches.length===1)return resolveMessageDraft({...pending.draft,recipientName:matches[0].displayName},matches[0].displayName);
    return{status:'needs_clarification',message:`Je ne sais pas encore lequel. Choisis entre ${pending.contacts.map(contact=>contact.displayName).join(', ')}.`};
  }
  if(pending.kind==='number'&&pending.contact&&pending.phoneNumbers){
    const digits=sanitizeLiaPhoneNumber(clean);
    const matches=pending.phoneNumbers.filter(phone=>liaPhoneLabelMatchesAnswer(phone.label,clean)||(digits&&sanitizeLiaPhoneNumber(phone.number)===digits));
    if(matches.length===1)return openMessageDraft(pending.draft,pending.contact,matches[0]);
    return{status:'needs_clarification',message:'Dis-moi le libellé du numéro, par exemple portable ou travail.'};
  }
  return resolveMessageDraft({...pending.draft,recipientName:clean},clean);
}
