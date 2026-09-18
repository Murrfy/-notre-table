export type LiaPhoneNumber={label:string|null;number:string};
export type LiaPhoneContact={id:string;displayName:string;phoneNumbers:LiaPhoneNumber[]};
export type LiaPhoneContactResolution=
  |{status:'invalid_target'}
  |{status:'no_match'}
  |{status:'no_number';contact:LiaPhoneContact}
  |{status:'confirm_contact';contact:LiaPhoneContact;confidence:number}
  |{status:'ambiguous_contact';contacts:LiaPhoneContact[]}
  |{status:'choose_number';contact:LiaPhoneContact;phoneNumbers:LiaPhoneNumber[]}
  |{status:'resolved';contact:LiaPhoneContact;phoneNumber:LiaPhoneNumber;confidence:number};

export function normalizeLiaContactName(value:string):string{
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g,' ').trim().replace(/\s+/g,' ');
}
export function sanitizeLiaPhoneNumber(value:string):string|null{
  const trimmed=value.trim();
  if(!trimmed)return null;
  const plus=trimmed.startsWith('+');
  const digits=trimmed.replace(/\D/g,'');
  if(digits.length<6||digits.length>15)return null;
  return `${plus?'+':''}${digits}`;
}
export function liaPhoneLabelMatchesAnswer(label:string|null,answer:string):boolean{
  const normalizedLabel=normalizeLiaContactName(label??'');
  const normalizedAnswer=normalizeLiaContactName(answer);
  if(!normalizedLabel||!normalizedAnswer)return false;
  if(normalizedLabel.includes(normalizedAnswer)||normalizedAnswer.includes(normalizedLabel))return true;
  const groups=[
    ['mobile','cell','cellular','portable'],
    ['work','office','business','travail','bureau','professionnel'],
    ['home','house','maison','domicile'],
    ['other','autre'],
  ];
  return groups.some(group=>group.some(value=>normalizedLabel.includes(value))&&group.some(value=>normalizedAnswer.includes(value)));
}
function validPhones(contact:LiaPhoneContact):LiaPhoneNumber[]{
  const seen=new Set<string>();
  return contact.phoneNumbers.filter(phone=>{const normalized=sanitizeLiaPhoneNumber(phone.number);if(!normalized||seen.has(normalized))return false;seen.add(normalized);return true;});
}
export function resolveLiaPhoneContact(requestedName:string,contacts:LiaPhoneContact[]):LiaPhoneContactResolution{
  const requested=normalizeLiaContactName(requestedName);
  if(requested.length<2)return{status:'invalid_target'};
  const usable=contacts.filter(contact=>normalizeLiaContactName(contact.displayName));
  const exact=usable.filter(contact=>normalizeLiaContactName(contact.displayName)===requested);
  if(exact.length>1)return{status:'ambiguous_contact',contacts:exact};
  if(exact.length===1){
    const contact=exact[0];const phones=validPhones(contact);
    if(!phones.length)return{status:'no_number',contact};
    if(phones.length>1)return{status:'choose_number',contact,phoneNumbers:phones};
    return{status:'resolved',contact,phoneNumber:phones[0],confidence:1};
  }
  const fuzzy=usable.filter(contact=>{const name=normalizeLiaContactName(contact.displayName);return name.startsWith(requested)||requested.startsWith(name)||name.split(' ').includes(requested);});
  if(!fuzzy.length)return{status:'no_match'};
  if(fuzzy.length>1)return{status:'ambiguous_contact',contacts:fuzzy};
  const contact=fuzzy[0];const phones=validPhones(contact);
  if(!phones.length)return{status:'no_number',contact};
  if(phones.length>1)return{status:'choose_number',contact,phoneNumbers:phones};
  return{status:'confirm_contact',contact,confidence:.82};
}
