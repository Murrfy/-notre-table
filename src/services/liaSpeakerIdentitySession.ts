import {readStoredJson,writeStoredJson,isRecord} from '../lib/storage';

const KEY='@notre-table/lia-speaker-identities-v1';
const MAX=24;

export type LiaKnownSpeaker={
  trackId:string;
  subjectKind:'profile'|'light_member';
  subjectId:string;
  displayName:string;
  confirmedAtIso:string;
  lastHeardAtIso:string;
};

type Store={speakers:LiaKnownSpeaker[]};

function valid(value:unknown):value is Store{
  return isRecord(value)&&Array.isArray(value.speakers);
}

function clean(value:string){return value.trim().replace(/\s+/g,' ').slice(0,80);}

export async function rememberLiaSpeakerIdentity(input:{
  trackId:string;
  subjectKind:'profile'|'light_member';
  subjectId:string;
  displayName:string;
  now?:Date;
}):Promise<LiaKnownSpeaker>{
  const now=input.now??new Date();
  const speaker:LiaKnownSpeaker={
    trackId:input.trackId,
    subjectKind:input.subjectKind,
    subjectId:input.subjectId,
    displayName:clean(input.displayName),
    confirmedAtIso:now.toISOString(),
    lastHeardAtIso:now.toISOString(),
  };
  const store=await readStoredJson<Store>(KEY,{speakers:[]},valid);
  const speakers=[speaker,...store.speakers.filter(item=>item.trackId!==speaker.trackId&&!(item.subjectKind===speaker.subjectKind&&item.subjectId===speaker.subjectId))].slice(0,MAX);
  await writeStoredJson(KEY,{speakers});
  return speaker;
}

export async function knownLiaSpeaker(trackId:string,now=new Date()):Promise<LiaKnownSpeaker|null>{
  const store=await readStoredJson<Store>(KEY,{speakers:[]},valid);
  const found=store.speakers.find(item=>item.trackId===trackId)??null;
  if(!found)return null;
  const age=now.getTime()-Date.parse(found.lastHeardAtIso);
  return Number.isFinite(age)&&age<=12*60*60_000?found:null;
}

export async function forgetLiaSpeakerTrack(trackId:string):Promise<void>{
  const store=await readStoredJson<Store>(KEY,{speakers:[]},valid);
  await writeStoredJson(KEY,{speakers:store.speakers.filter(item=>item.trackId!==trackId)});
}

export async function touchLiaSpeakerTrack(trackId:string,now=new Date()):Promise<void>{
  const store=await readStoredJson<Store>(KEY,{speakers:[]},valid);
  const speakers=store.speakers.map(item=>item.trackId===trackId?{...item,lastHeardAtIso:now.toISOString()}:item);
  await writeStoredJson(KEY,{speakers});
}

export function liaSpeakerGreeting(name:string,languageTag:string):string{
  const n=clean(name);
  if(languageTag.toLowerCase().startsWith('fr'))return `Ah, salut ${n} !`;
  if(languageTag.toLowerCase().startsWith('he'))return `אה, שלום ${n}!`;
  return `Ah, hi ${n}!`;
}

export function liaIdentityAnswerName(text:string):string|null{
  const raw=clean(text).replace(/[.!?]+$/,'');
  const match=raw.match(/^(?:moi c['’]?est|c['’]?est|je suis|mon prénom c['’]?est|my name is|i['’]?m|i am)\s+(.+)$/i);
  const candidate=clean(match?.[1]??raw);
  if(!candidate||candidate.length>50||candidate.split(' ').length>4)return null;
  if(/^(oui|non|yes|no|ok|d accord|je sais pas|i don t know)$/i.test(candidate.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))return null;
  return candidate;
}


export type LiaPendingSpeakerIdentification={
  trackId:string;
  askedAtIso:string;
};

let pendingIdentity:LiaPendingSpeakerIdentification|null=null;

export function beginLiaSpeakerIdentification(trackId:string,now=new Date()):LiaPendingSpeakerIdentification{
  pendingIdentity={trackId,askedAtIso:now.toISOString()};
  return pendingIdentity;
}

export function pendingLiaSpeakerIdentification():LiaPendingSpeakerIdentification|null{
  return pendingIdentity;
}

export function consumeLiaSpeakerIdentification():LiaPendingSpeakerIdentification|null{
  const value=pendingIdentity;
  pendingIdentity=null;
  return value;
}

export function clearLiaSpeakerIdentification():void{
  pendingIdentity=null;
}


const recentlyAskedIdentity=new Map<string,number>();
const IDENTITY_ASK_COOLDOWN_MS=90_000;

export function mayAskLiaSpeakerIdentityAgain(trackId:string,now=Date.now()):boolean{
  const last=recentlyAskedIdentity.get(trackId);
  return last===undefined||now-last>=IDENTITY_ASK_COOLDOWN_MS;
}

export function noteLiaSpeakerIdentityAsked(trackId:string,now=Date.now()):void{
  recentlyAskedIdentity.set(trackId,now);
}

export function clearLiaSpeakerIdentityAskCooldown(trackId?:string):void{
  if(trackId)recentlyAskedIdentity.delete(trackId);
  else recentlyAskedIdentity.clear();
}



const GUEST_KEY='@notre-table/lia-known-guests-v1';
const MAX_GUESTS=80;
export type LiaKnownGuest={displayName:string;relationshipLabel:string|null;firstMetAtIso:string;lastMetAtIso:string};
type GuestStore={guests:LiaKnownGuest[]};
function validGuests(value:unknown):value is GuestStore{return isRecord(value)&&Array.isArray(value.guests);}
function guestNameKey(value:string){return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}

export async function rememberLiaKnownGuest(input:{displayName:string;relationshipLabel?:string|null;now?:Date}):Promise<LiaKnownGuest>{
  const now=input.now??new Date();
  const store=await readStoredJson<GuestStore>(GUEST_KEY,{guests:[]},validGuests);
  const key=guestNameKey(input.displayName);
  const previous=store.guests.find(item=>guestNameKey(item.displayName)===key);
  const guest:LiaKnownGuest={
    displayName:clean(input.displayName),
    relationshipLabel:input.relationshipLabel?clean(input.relationshipLabel):previous?.relationshipLabel??null,
    firstMetAtIso:previous?.firstMetAtIso??now.toISOString(),
    lastMetAtIso:now.toISOString(),
  };
  await writeStoredJson(GUEST_KEY,{guests:[guest,...store.guests.filter(item=>guestNameKey(item.displayName)!==key)].slice(0,MAX_GUESTS)});
  return guest;
}

export async function knownLiaGuestByName(displayName:string):Promise<LiaKnownGuest|null>{
  const store=await readStoredJson<GuestStore>(GUEST_KEY,{guests:[]},validGuests);
  const key=guestNameKey(displayName);
  return store.guests.find(item=>guestNameKey(item.displayName)===key)??null;
}

export type LiaSessionGuest={trackId:string;displayName:string;identifiedAtIso:string};
const sessionGuests=new Map<string,LiaSessionGuest>();

export function rememberLiaSessionGuest(trackId:string,displayName:string,now=new Date()):LiaSessionGuest{
  const guest={trackId,displayName:clean(displayName),identifiedAtIso:now.toISOString()};
  sessionGuests.set(trackId,guest);
  return guest;
}

export function knownLiaSessionGuest(trackId:string):LiaSessionGuest|null{
  return sessionGuests.get(trackId)??null;
}

export function clearLiaSessionGuests():void{
  sessionGuests.clear();
}


export function liaUnknownGuestIntroductionQuestion(name:string,languageTag:string,variantSeed=0):string{
  const n=clean(name);
  const fr=[
    `${n} ? On se connaît ?`,
    `${n}… je crois qu’on ne s’est pas encore présentés, non ?`,
    `Ah, ${n} ! Première fois qu’on discute tous les deux ?`,
    `${n} ? Ton prénom me plaît bien, mais je ne crois pas t’avoir encore rencontré.`,
    `${n}… attends, tu me dis quelque chose ou on fait connaissance maintenant ?`,
    `Salut ${n}. Aide-moi un peu : on s’est déjà parlé ou je t’adopte à partir d’aujourd’hui ?`,
  ];
  const en=[
    `${n}? Do we know each other?`,
    `${n}… I don't think we've been introduced yet, have we?`,
    `Ah, ${n}! Is this our first chat together?`,
    `${n}? Nice name, but I don't think we've met yet.`,
    `${n}… wait, do you ring a bell or are we meeting right now?`,
    `Hi ${n}. Help me out: have we spoken before, or do I get to know you starting today?`,
  ];
  const he=[
    `${n}? אנחנו מכירים?`,
    `${n}… נראה לי שעוד לא הכרנו, נכון?`,
    `אה, ${n}! זאת הפעם הראשונה שאנחנו מדברים?`,
    `${n}? שם יפה, אבל נראה לי שעוד לא נפגשנו.`,
    `${n}… רגע, אתה מוכר לי או שאנחנו מכירים עכשיו?`,
    `שלום ${n}. תעזור לי רגע: כבר דיברנו פעם או שמכאן מתחילים להכיר?`,
  ];
  const list=languageTag.toLowerCase().startsWith('fr')?fr:languageTag.toLowerCase().startsWith('he')?he:en;
  return list[Math.abs(variantSeed)%list.length];
}


export function liaReturningGuestGreeting(name:string,languageTag:string,variantSeed=0):string{
  const n=clean(name);
  const fr=[
    `David`===n?`${n}, ça fait plaisir de te revoir !`:`${n}, ça fait plaisir de te revoir !`,
    `Ah, ${n} ! Contente de te retrouver.`,
    `Tiens, ${n} ! Ça me fait plaisir de te revoir par ici.`,
    `Salut ${n} ! Cette fois, je sais très bien qui tu es.`,
    `Ah ${n}, te revoilà ! Bienvenue à la maison.`,
    `${n} ! Ça faisait un petit moment. Contente de te revoir.`,
  ];
  const en=[
    `${n}, it's good to see you again!`,
    `Ah, ${n}! Nice to have you back.`,
    `Well, ${n}! Good to see you around again.`,
    `Hi ${n}! This time I know exactly who you are.`,
    `Ah ${n}, you're back! Welcome.`,
    `${n}! It's been a little while. Good to see you again.`,
  ];
  const he=[
    `${n}, כיף לראות אותך שוב!`,
    `אה, ${n}! שמחה לראות אותך שוב.`,
    `הנה ${n}! כיף שחזרת.`,
    `שלום ${n}! הפעם אני כבר יודעת מצוין מי אתה.`,
    `אה ${n}, חזרת! ברוך הבא.`,
    `${n}! עבר קצת זמן. כיף לראות אותך שוב.`,
  ];
  const list=languageTag.toLowerCase().startsWith('fr')?fr:languageTag.toLowerCase().startsWith('he')?he:en;
  return list[Math.abs(variantSeed)%list.length];
}


export function liaFamilyMemberGreeting(name:string,languageTag:string,variantSeed=0):string{
  const n=clean(name);
  const fr=[`Salut ${n} !`,`Coucou ${n} !`,`Bonjour ${n} !`,`Ah, salut ${n} !`,`Hello ${n} !`,`Tiens, salut ${n} !`];
  const en=[`Hi ${n}!`,`Hey ${n}!`,`Hello ${n}!`,`Ah, hi ${n}!`,`Hey there, ${n}!`,`Hi again, ${n}!`];
  const he=[`שלום ${n}!`,`היי ${n}!`,`אה, שלום ${n}!`,`היי ${n}, מה נשמע?`,`שלום לך ${n}!`,`אהלן ${n}!`];
  const list=languageTag.toLowerCase().startsWith('fr')?fr:languageTag.toLowerCase().startsWith('he')?he:en;
  return list[Math.abs(variantSeed)%list.length];
}


export function liaBirthdayGreeting(name:string,languageTag:string,variantSeed=0):string{
  const n=clean(name);
  const fr=[`Joyeux anniversaire ${n} ! Je te souhaite une magnifique journée.`,`Très joyeux anniversaire ${n} ! Profite bien de ta journée.`,`Bon anniversaire ${n} ! Plein de belles choses pour cette nouvelle année.`,`${n}, aujourd’hui c’est ta journée ! Très joyeux anniversaire.`,`Joyeux anniversaire ${n} ! J’espère que cette journée sera aussi belle que possible.`,`Bon anniversaire ${n} ! Une très belle journée à toi, et profite-en bien.`];
  const en=[`Happy birthday ${n}! Have a wonderful day.`,`A very happy birthday, ${n}! Enjoy your day.`,`Happy birthday ${n}! Wishing you lots of good things this year.`,`${n}, today's your day! Happy birthday.`,`Happy birthday ${n}! I hope you have a beautiful day.`,`Happy birthday ${n}! Have a great day and enjoy it.`];
  const he=[`יום הולדת שמח ${n}! שיהיה לך יום נפלא.`,`${n}, יום הולדת שמח מאוד! שיהיה יום מקסים.`,`יום הולדת שמח ${n}! המון דברים טובים בשנה החדשה שלך.`,`${n}, היום זה היום שלך! יום הולדת שמח.`,`יום הולדת שמח ${n}! מקווה שיהיה לך יום נהדר.`,`מזל טוב ${n}! שיהיה לך יום יפה ומהנה.`];
  const list=languageTag.toLowerCase().startsWith('fr')?fr:languageTag.toLowerCase().startsWith('he')?he:en;
  return list[Math.abs(variantSeed)%list.length];
}

export function liaBirthdayNotification(name:string,languageTag:string):string{
  const n=clean(name);
  if(languageTag.toLowerCase().startsWith('fr'))return `Aujourd’hui, c’est l’anniversaire de ${n} 🎂`;
  if(languageTag.toLowerCase().startsWith('he'))return `היום יום ההולדת של ${n} 🎂`;
  return `Today is ${n}'s birthday 🎂`;
}
