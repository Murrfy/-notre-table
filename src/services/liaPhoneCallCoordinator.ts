import {liaPhoneLabelMatchesAnswer,normalizeLiaContactName,resolveLiaPhoneContact,sanitizeLiaPhoneNumber,type LiaPhoneContact,type LiaPhoneNumber} from '../lib/liaPhoneContactResolver';
import {getLiaPhoneContactsAdapter} from './liaPhoneContactsAdapter';
import {openLiaPhoneDialer} from './liaPhoneDialer';

export type LiaPhoneCallResult=
  |{status:'ignored'}
  |{status:'contacts_unavailable'}
  |{status:'permission_denied'}
  |{status:'invalid_target'}
  |{status:'no_match';requestedName:string}
  |{status:'no_number';contact:LiaPhoneContact}
  |{status:'confirm_contact';contact:LiaPhoneContact}
  |{status:'ambiguous_contact';contacts:LiaPhoneContact[]}
  |{status:'choose_number';contact:LiaPhoneContact;phoneNumbers:LiaPhoneNumber[]}
  |{status:'dialer_unavailable';contact:LiaPhoneContact}
  |{status:'dialer_opened';contact:LiaPhoneContact;phoneNumber:string};

type PendingPhoneCallClarification={
  requestedName:string;
  kind:'recipient'|'confirm'|'ambiguous'|'number';
  contact?:LiaPhoneContact;
  contacts?:LiaPhoneContact[];
  phoneNumbers?:LiaPhoneNumber[];
  openDialer?:(phone:string)=>Promise<boolean>;
};
let pendingPhoneCall:PendingPhoneCallClarification|null=null;

async function openResolvedPhone(contact:LiaPhoneContact,phone:LiaPhoneNumber,openDialer?:(phone:string)=>Promise<boolean>):Promise<LiaPhoneCallResult>{
  const clean=sanitizeLiaPhoneNumber(phone.number);
  if(!clean){pendingPhoneCall=null;return{status:'no_number',contact};}
  const opened=await (openDialer??openLiaPhoneDialer)(clean);
  pendingPhoneCall=null;
  return opened?{status:'dialer_opened',contact,phoneNumber:clean}:{status:'dialer_unavailable',contact};
}

export async function executeLiaPhoneCall(input:{
  directAddressed:boolean;
  requestedName:string;
  confirmedContactId?:string|null;
  selectedPhoneNumber?:string|null;
  openDialer?:(phone:string)=>Promise<boolean>;
}):Promise<LiaPhoneCallResult>{
  if(!input.directAddressed)return{status:'ignored'};
  pendingPhoneCall=null;
  const adapter=getLiaPhoneContactsAdapter();
  if(!adapter)return{status:'contacts_unavailable'};
  if(adapter.permissionStatus()!=='granted'){
    const granted=await adapter.requestPermission();
    if(!granted)return{status:'permission_denied'};
  }
  const contacts=await adapter.search(input.requestedName);
  let resolution=resolveLiaPhoneContact(input.requestedName,contacts);
  if(resolution.status==='invalid_target')return{status:'invalid_target'};
  if(resolution.status==='no_match')return{status:'no_match',requestedName:input.requestedName};
  if(resolution.status==='ambiguous_contact'){
    if(input.confirmedContactId){
      const chosen=resolution.contacts.find(contact=>contact.id===input.confirmedContactId);
      if(chosen)resolution=resolveLiaPhoneContact(chosen.displayName,[chosen]); else return resolution;
    }else{
      pendingPhoneCall={requestedName:input.requestedName,kind:'ambiguous',contacts:resolution.contacts,openDialer:input.openDialer};
      return{status:'ambiguous_contact',contacts:resolution.contacts};
    }
  }
  if(resolution.status==='confirm_contact'){
    if(input.confirmedContactId!==resolution.contact.id){
      pendingPhoneCall={requestedName:input.requestedName,kind:'confirm',contact:resolution.contact,openDialer:input.openDialer};
      return{status:'confirm_contact',contact:resolution.contact};
    }
    resolution=resolveLiaPhoneContact(resolution.contact.displayName,[resolution.contact]);
  }
  if(resolution.status==='no_number')return{status:'no_number',contact:resolution.contact};
  let contact:LiaPhoneContact;
  let phone:LiaPhoneNumber;
  if(resolution.status==='choose_number'){
    if(!input.selectedPhoneNumber){
      pendingPhoneCall={requestedName:input.requestedName,kind:'number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers,openDialer:input.openDialer};
      return{status:'choose_number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers};
    }
    const selected=sanitizeLiaPhoneNumber(input.selectedPhoneNumber);
    const matching=resolution.phoneNumbers.find(value=>sanitizeLiaPhoneNumber(value.number)===selected);
    if(!selected||!matching){
      pendingPhoneCall={requestedName:input.requestedName,kind:'number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers,openDialer:input.openDialer};
      return{status:'choose_number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers};
    }
    contact=resolution.contact;phone=matching;
  }else if(resolution.status==='resolved'){
    contact=resolution.contact;phone=resolution.phoneNumber;
  }else return{status:'invalid_target'};
  return openResolvedPhone(contact,phone,input.openDialer);
}

export function liaPhoneCallClarificationPending():boolean{return pendingPhoneCall!==null;}
export function clearLiaPhoneCallClarification():void{pendingPhoneCall=null;}
export async function continueLiaPhoneCallClarification(answer:string):Promise<LiaPhoneCallResult>{
  const pending=pendingPhoneCall;
  if(!pending)return{status:'invalid_target'};
  const clean=answer.trim();
  const normalized=normalizeLiaContactName(clean);
  if(!clean)return pending.kind==='number'&&pending.contact&&pending.phoneNumbers
    ?{status:'choose_number',contact:pending.contact,phoneNumbers:pending.phoneNumbers}
    :pending.kind==='ambiguous'&&pending.contacts
      ?{status:'ambiguous_contact',contacts:pending.contacts}
      :pending.kind==='confirm'&&pending.contact
        ?{status:'confirm_contact',contact:pending.contact}
        :{status:'invalid_target'};
  if(pending.kind==='confirm'&&pending.contact){
    if(['oui','yes','si','כן'].includes(normalized)){
      const resolution=resolveLiaPhoneContact(pending.contact.displayName,[pending.contact]);
      if(resolution.status==='resolved')return openResolvedPhone(resolution.contact,resolution.phoneNumber,pending.openDialer);
      if(resolution.status==='choose_number'){
        pendingPhoneCall={...pending,kind:'number',phoneNumbers:resolution.phoneNumbers};
        return{status:'choose_number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers};
      }
    }
    pendingPhoneCall={requestedName:'',kind:'recipient',openDialer:pending.openDialer};
    return{status:'invalid_target'};
  }
  if(pending.kind==='ambiguous'&&pending.contacts){
    const matches=pending.contacts.filter(contact=>{const name=normalizeLiaContactName(contact.displayName);return name===normalized||name.includes(normalized);});
    if(matches.length===1){
      const resolution=resolveLiaPhoneContact(matches[0].displayName,[matches[0]]);
      if(resolution.status==='resolved')return openResolvedPhone(resolution.contact,resolution.phoneNumber,pending.openDialer);
      if(resolution.status==='choose_number'){
        pendingPhoneCall={...pending,kind:'number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers};
        return{status:'choose_number',contact:resolution.contact,phoneNumbers:resolution.phoneNumbers};
      }
      pendingPhoneCall=null;
      return resolution.status==='no_number'?{status:'no_number',contact:resolution.contact}:{status:'invalid_target'};
    }
    return{status:'ambiguous_contact',contacts:pending.contacts};
  }
  if(pending.kind==='number'&&pending.contact&&pending.phoneNumbers){
    const digits=sanitizeLiaPhoneNumber(clean);
    const matches=pending.phoneNumbers.filter(phone=>liaPhoneLabelMatchesAnswer(phone.label,clean)||(digits&&sanitizeLiaPhoneNumber(phone.number)===digits));
    if(matches.length===1)return openResolvedPhone(pending.contact,matches[0],pending.openDialer);
    return{status:'choose_number',contact:pending.contact,phoneNumbers:pending.phoneNumbers};
  }
  return executeLiaPhoneCall({directAddressed:true,requestedName:clean,openDialer:pending.openDialer});
}

export function liaPhoneCallReply(result:LiaPhoneCallResult,languageTag:string):string|null{
  const lang=languageTag.split('-')[0]?.toLowerCase();
  const fr=lang==='fr';
  switch(result.status){
    case'ignored':return null;
    case'contacts_unavailable':return fr?'Je ne peux pas accéder aux contacts du téléphone pour le moment.':'I can’t access the phone contacts right now.';
    case'permission_denied':return fr?'J’ai besoin de ton autorisation pour chercher dans tes contacts.':'I need your permission to search your contacts.';
    case'invalid_target':return fr?'Dis-moi simplement qui tu veux appeler.':'Just tell me who you want to call.';
    case'no_match':return fr?`Je ne trouve pas ${result.requestedName} dans tes contacts.`:`I can’t find ${result.requestedName} in your contacts.`;
    case'no_number':return fr?`${result.contact.displayName} n’a pas de numéro utilisable dans tes contacts.`:`${result.contact.displayName} has no usable phone number in your contacts.`;
    case'confirm_contact':return fr?`Tu parles bien de ${result.contact.displayName} ?`:`Do you mean ${result.contact.displayName}?`;
    case'ambiguous_contact':return fr?`J’en trouve plusieurs : ${result.contacts.map(contact=>contact.displayName).join(', ')}. Lequel veux-tu appeler ?`:`I found several matches: ${result.contacts.map(contact=>contact.displayName).join(', ')}. Which one do you want to call?`;
    case'choose_number':{const labels=result.phoneNumbers.map((phone,index)=>phone.label?.trim()||`numéro ${index+1}`);return fr?`${result.contact.displayName} a plusieurs numéros : ${labels.join(', ')}. Lequel tu veux ?`:`${result.contact.displayName} has several numbers: ${labels.join(', ')}. Which one do you want?`;}
    case'dialer_unavailable':return fr?`Je n’arrive pas à ouvrir le téléphone pour ${result.contact.displayName}.`:`I can’t open the phone for ${result.contact.displayName}.`;
    case'dialer_opened':return fr?`J’appelle ${result.contact.displayName}.`:`Calling ${result.contact.displayName}.`;
  }
}
