import {supabase} from '../lib/supabase';
import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {emitLiaContextualGuidance} from './liaContextualGuidance';
import {parseLiaFavoriteMealAnswer} from '../lib/liaProfileFacts';
import {listLiaRelationshipFacts,saveLiaRelationshipFact} from './liaRelationshipMemory';

const LEDGER_KEY='@notre-table/lia-profile-enrichment-v1';
const GLOBAL_GAP_MS=48*60*60*1000;
const TARGET_REASK_MS=14*24*60*60*1000;
const LATER_SNOOZE_MS=30*24*60*60*1000;

export type LiaProfileEnrichmentTarget={
  householdId:string;
  subjectKind:'profile'|'light_member';
  subjectId:string;
  subjectName:string;
  fact:'birthday'|'favorite_meal'|'favorite_color'|'hair_color'|'perfume'|'shampoo';
};

type TargetLedger={lastAskedAtIso?:string|null;snoozedUntilIso?:string|null;dismissed?:boolean};
type Ledger={lastPromptAtIso?:string|null;targets:Record<string,TargetLedger>};

export type LiaProfileEnrichmentContinuation=
  |{status:'not_pending';spokenReply:null}
  |{status:'needs_clarification';spokenReply:string}
  |{status:'saved';spokenReply:string}
  |{status:'skipped';spokenReply:string}
  |{status:'unavailable';spokenReply:string};

let pending:LiaProfileEnrichmentTarget|null=null;

function validLedger(value:unknown):value is Ledger{
  if(!isRecord(value)||!isRecord(value.targets))return false;
  if(value.lastPromptAtIso!==undefined&&value.lastPromptAtIso!==null&&typeof value.lastPromptAtIso!=='string')return false;
  return Object.values(value.targets).every(item=>{
    if(!isRecord(item))return false;
    return (item.lastAskedAtIso===undefined||item.lastAskedAtIso===null||typeof item.lastAskedAtIso==='string')&&
      (item.snoozedUntilIso===undefined||item.snoozedUntilIso===null||typeof item.snoozedUntilIso==='string')&&
      (item.dismissed===undefined||typeof item.dismissed==='boolean');
  });
}
function targetKey(target:LiaProfileEnrichmentTarget):string{return `${target.householdId}:${target.subjectKind}:${target.subjectId}:${target.fact}`;}
function cleanName(value:string):string{return value.trim().replace(/\s+/g,' ').slice(0,80);}
function ms(value:string|null|undefined):number{return value?Date.parse(value):0;}
function fr(languageTag:string):boolean{return languageTag.toLowerCase().startsWith('fr');}

export function liaProfileEnrichmentClarificationPending():boolean{return Boolean(pending);}
export function clearLiaProfileEnrichmentClarification():void{pending=null;}

async function profileCandidates(householdId:string):Promise<LiaProfileEnrichmentTarget[]>{
  if(!supabase)return[];
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return[];
  const [{data:profile,error:profileError},{data:members,error:memberError}]=await Promise.all([
    supabase.from('profiles').select('id,display_name,birthday_month,birthday_day,favorite_meal').eq('id',user.id).maybeSingle(),
    supabase.from('light_members').select('id,display_name,relation,active,birthday_month,birthday_day,favorite_meal,created_at').eq('household_id',householdId).eq('active',true).order('created_at',{ascending:true}),
  ]);
  if(profileError)throw profileError;
  if(memberError)throw memberError;

  const candidates:LiaProfileEnrichmentTarget[]=[];
  const profileName=cleanName(profile?.display_name||'toi')||'toi';
  if(profile&&(!profile.birthday_month||!profile.birthday_day)){
    candidates.push({householdId,subjectKind:'profile',subjectId:user.id,subjectName:profileName,fact:'birthday'});
  }
  const ranked=[...(members??[])].sort((a:any,b:any)=>{
    const score=(x:any)=>x.relation==='spouse'?0:x.relation==='child'?1:2;
    return score(a)-score(b)||String(a.created_at??'').localeCompare(String(b.created_at??''));
  });
  const relationshipFacts=await listLiaRelationshipFacts(false).catch(()=>[]);
  const knownQuickFact=(subjectName:string,factKey:string)=>relationshipFacts.some(fact=>fact.confirmed&&fact.topic==='style'&&cleanName(fact.subjectLabel??'').toLocaleLowerCase()===cleanName(subjectName).toLocaleLowerCase()&&fact.factKey===factKey);
  for(const member of ranked as any[]){
    if(member.birthday_month&&member.birthday_day)continue;
    const subjectName=cleanName(member.display_name??'');
    if(!subjectName)continue;
    candidates.push({householdId,subjectKind:'light_member',subjectId:String(member.id),subjectName,fact:'birthday'});
  }
  if(profile&&!cleanName(String(profile.favorite_meal??''))){
    candidates.push({householdId,subjectKind:'profile',subjectId:user.id,subjectName:profileName,fact:'favorite_meal'});
  }
  for(const member of ranked as any[]){
    if(cleanName(String(member.favorite_meal??'')))continue;
    const subjectName=cleanName(member.display_name??'');
    if(!subjectName)continue;
    candidates.push({householdId,subjectKind:'light_member',subjectId:String(member.id),subjectName,fact:'favorite_meal'});
  }
  const quickFacts:Array<LiaProfileEnrichmentTarget['fact']>=['favorite_color','hair_color','perfume','shampoo'];
  const subjects=[{subjectKind:'profile' as const,subjectId:user.id,subjectName:profileName},...ranked.map((member:any)=>({subjectKind:'light_member' as const,subjectId:String(member.id),subjectName:cleanName(member.display_name??'')})).filter(item=>item.subjectName)];
  for(const subject of subjects){
    for(const fact of quickFacts){
      if(knownQuickFact(subject.subjectName,fact))continue;
      candidates.push({householdId,...subject,fact});
    }
  }
  return candidates;
}

export async function maybeEmitLiaProfileEnrichmentQuestion(input:{
  householdId:string;
  organizerName:string;
  now?:Date;
  demo?:boolean;
}):Promise<boolean>{
  if(input.demo||pending||!input.householdId)return false;
  const now=input.now??new Date();
  const ledger=await readStoredJson<Ledger>(LEDGER_KEY,{lastPromptAtIso:null,targets:{}},validLedger);
  if(ledger.lastPromptAtIso&&now.getTime()-ms(ledger.lastPromptAtIso)<GLOBAL_GAP_MS)return false;

  const candidates=await profileCandidates(input.householdId);
  const target=candidates.find(candidate=>{
    const entry=ledger.targets[targetKey(candidate)];
    if(!entry)return true;
    if(entry.dismissed)return false;
    if(entry.snoozedUntilIso&&ms(entry.snoozedUntilIso)>now.getTime())return false;
    return !entry.lastAskedAtIso||now.getTime()-ms(entry.lastAskedAtIso)>=TARGET_REASK_MS;
  });
  if(!target)return false;

  const key=targetKey(target);
  const next:Ledger={
    lastPromptAtIso:now.toISOString(),
    targets:{...ledger.targets,[key]:{...ledger.targets[key],lastAskedAtIso:now.toISOString()}},
  };
  await writeStoredJson(LEDGER_KEY,next);
  pending=target;
  emitLiaContextualGuidance({kind:'profile_enrichment_question',householdId:target.householdId,organizerName:cleanName(input.organizerName),subjectName:target.subjectName,fact:target.fact});
  return true;
}

const quickFactLabels:Record<'favorite_color'|'hair_color'|'perfume'|'shampoo',{fr:string;en:string}>={
  favorite_color:{fr:'couleur préférée',en:'favorite color'},
  hair_color:{fr:'couleur de cheveux',en:'hair color'},
  perfume:{fr:'parfum',en:'perfume'},
  shampoo:{fr:'shampoing',en:'shampoo'},
};

export function parseLiaQuickFactAnswer(text:string):string|null{
  const raw=text.trim().replace(/^[«“"]+|[»”"]+$/g,'').replace(/\s+/g,' ');
  if(!raw||raw.length>80)return null;
  const folded=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
  if(/^(?:je ne sais pas|j sais pas|aucune idee|aucune idée|peu importe|comme tu veux|rien|none|i don t know|no idea|whatever|not sure|no se|ni idea|לא יודע|לא יודעת)$/.test(folded))return null;
  const cleaned=raw.replace(/^(?:c['’]?est|c est|j['’]?utilise|j utilise|je mets|mon|ma|mes|it['’]?s|it is|i use|i wear|my)\s+/i,'').trim();
  return cleaned.length>=1&&cleaned.length<=80?cleaned:null;
}

function normalized(value:string):string{
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
}
function laterRequested(text:string):boolean{
  const v=normalized(text);
  return /\b(plus tard|pas maintenant|une autre fois|later|not now|another time|mas tarde|ahora no|אחר כך|לא עכשיו)\b/i.test(v);
}
function refuseRequested(text:string):boolean{
  const v=normalized(text);
  return /\b(je ne veux pas|je prefere ne pas|ne te le dirai pas|i don t want|prefer not|no quiero|prefiero no|לא רוצה)\b/i.test(v);
}
const monthMap:Record<string,number>={
  janvier:1,janvier1:1,january:1,enero:1,'ינואר':1,
  fevrier:2,february:2,febrero:2,'פברואר':2,
  mars:3,march:3,marzo:3,'מרץ':3,
  avril:4,april:4,abril:4,'אפריל':4,
  mai:5,may:5,mayo:5,'מאי':5,
  juin:6,june:6,junio:6,'יוני':6,
  juillet:7,july:7,julio:7,'יולי':7,
  aout:8,august:8,agosto:8,'אוגוסט':8,
  septembre:9,september:9,septiembre:9,'ספטמבר':9,
  octobre:10,october:10,octubre:10,'אוקטובר':10,
  novembre:11,november:11,noviembre:11,'נובמבר':11,
  decembre:12,december:12,diciembre:12,'דצמבר':12,
};
export type LiaBirthdayValue={day:number;month:number;year:number|null};

function validBirthday(day:number,month:number,year:number|null,now=new Date()):boolean{
  if(!Number.isInteger(day)||!Number.isInteger(month)||month<1||month>12||day<1||day>31)return false;
  if(year!==null&&(year<1900||year>now.getFullYear()))return false;
  const testYear=year??2000;
  const date=new Date(Date.UTC(testYear,month-1,day));
  return date.getUTCFullYear()===testYear&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}

export function parseLiaBirthdayAnswer(text:string,now=new Date()):LiaBirthdayValue|null{
  const raw=text.trim();
  if(!raw)return null;
  let match=raw.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if(match){
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    return validBirthday(day,month,year,now)?{day,month,year}:null;
  }
  match=raw.match(/\b(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?\b/);
  if(match){
    const day=Number(match[1]),month=Number(match[2]);
    let year=match[3]?Number(match[3]):null;
    if(year!==null&&year<100)year+=year>=50?1900:2000;
    return validBirthday(day,month,year,now)?{day,month,year}:null;
  }
  const folded=normalized(raw);
  for(const [name,month] of Object.entries(monthMap)){
    const word=new RegExp(`\\b(\\d{1,2})\\s+${name}\\b(?:\\s+(\\d{4}))?`,'i');
    match=folded.match(word);
    if(!match)continue;
    const day=Number(match[1]),year=match[2]?Number(match[2]):null;
    return validBirthday(day,month,year,now)?{day,month,year}:null;
  }
  return null;
}

function postBirthdayJoke(subjectName:string,languageTag:string):string{
  if(!fr(languageTag))return'';
  let sum=0;for(const ch of subjectName)sum+=ch.charCodeAt(0);
  const variant=sum%3;
  if(variant===0)return' Et le poids aussi ?… Non, je plaisante 😏';
  if(variant===1)return' Et la couleur de ses cheveux aussi ?… Je plaisante 😏';
  return'';
}

function birthdayLabel(value:LiaBirthdayValue,languageTag:string):string{
  const frMonths=['','janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const enMonths=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  return fr(languageTag)?`${value.day} ${frMonths[value.month]}`:`${enMonths[value.month]} ${value.day}`;
}

async function updateLedgerForPending(mode:'snooze'|'dismiss'):Promise<void>{
  if(!pending)return;
  const now=new Date();
  const ledger=await readStoredJson<Ledger>(LEDGER_KEY,{lastPromptAtIso:null,targets:{}},validLedger);
  const key=targetKey(pending);
  const current=ledger.targets[key]??{};
  await writeStoredJson(LEDGER_KEY,{
    ...ledger,
    targets:{
      ...ledger.targets,
      [key]:mode==='dismiss'?{...current,dismissed:true}:{...current,snoozedUntilIso:new Date(now.getTime()+LATER_SNOOZE_MS).toISOString()},
    },
  });
}

export async function continueLiaProfileEnrichmentClarification(input:{
  text:string;
  languageTag:string;
  now?:Date;
}):Promise<LiaProfileEnrichmentContinuation>{
  const target=pending;
  if(!target)return{status:'not_pending',spokenReply:null};

  if(refuseRequested(input.text)){
    await updateLedgerForPending('dismiss');
    pending=null;
    return{status:'skipped',spokenReply:fr(input.languageTag)?'Bien sûr, je n’insiste pas.':'Of course. I won’t press you on it.'};
  }
  if(laterRequested(input.text)){
    await updateLedgerForPending('snooze');
    pending=null;
    return{status:'skipped',spokenReply:fr(input.languageTag)?'Pas de souci, on verra ça une autre fois.':'No problem, we can come back to it another time.'};
  }

  if(!supabase){
    pending=null;
    return{status:'unavailable',spokenReply:fr(input.languageTag)?'Je n’arrive pas à enregistrer ça pour le moment.':'I can’t save that right now.'};
  }

  if(target.fact==='favorite_color'||target.fact==='hair_color'||target.fact==='perfume'||target.fact==='shampoo'){
    const value=parseLiaQuickFactAnswer(input.text);
    if(!value){
      const label=quickFactLabels[target.fact];
      return{status:'needs_clarification',spokenReply:fr(input.languageTag)
        ?`Une réponse toute simple me suffit pour ta ${label.fr} — un mot ou un nom, et c’est bon.`
        :`A simple answer is enough for the ${label.en} — one word or a name is fine.`};
    }
    try{
      await saveLiaRelationshipFact({topic:'style',subjectLabel:target.subjectName,factKey:target.fact,factValue:value,sensitivity:'ordinary',householdSafe:false,confirmed:true},false);
    }catch{
      return{status:'unavailable',spokenReply:fr(input.languageTag)?'Je n’arrive pas à l’enregistrer pour le moment. On réessaiera plus tard.':'I can’t save it right now. We’ll try again later.'};
    }
    pending=null;
    return{status:'saved',spokenReply:fr(input.languageTag)
      ?`Parfait, je retiens ça pour ${target.subjectName}. Ça pourra me servir un de ces jours 😏.`
      :`Perfect. I’ll remember that for ${target.subjectName}. It may come in handy one day 😏.`};
  }

  if(target.fact==='favorite_meal'){
    const favoriteMeal=parseLiaFavoriteMealAnswer(input.text);
    if(!favoriteMeal){
      return{status:'needs_clarification',spokenReply:fr(input.languageTag)
        ?`Dis-moi simplement le plat que ${target.subjectName} adore vraiment. Par exemple « couscous » ou « lasagnes ».`
        :`Just tell me the dish ${target.subjectName} really loves, for example “couscous” or “lasagna”.`};
    }
    const {error}=await supabase.rpc('set_lia_family_favorite_meal',{
      p_household_id:target.householdId,
      p_subject_kind:target.subjectKind,
      p_subject_id:target.subjectId,
      p_favorite_meal:favoriteMeal,
    });
    if(error){
      return{status:'unavailable',spokenReply:fr(input.languageTag)?'Je n’arrive pas à l’enregistrer pour le moment. On réessaiera plus tard.':'I can’t save it right now. We’ll try again later.'};
    }
    pending=null;
    return{status:'saved',spokenReply:fr(input.languageTag)
      ?`Parfait, je garde en tête que ${target.subjectName} adore ${favoriteMeal}.`
      :`Perfect. I’ll remember that ${target.subjectName} loves ${favoriteMeal}.`};
  }

  const birthday=parseLiaBirthdayAnswer(input.text,input.now??new Date());
  if(!birthday){
    return{status:'needs_clarification',spokenReply:fr(input.languageTag)
      ?'Donne-moi simplement le jour et le mois, par exemple « 12 mars ». L’année est facultative.'
      :'Just give me the day and month, for example “March 12”. The year is optional.'};
  }
  const {error}=await supabase.rpc('set_lia_family_birthday',{
    p_household_id:target.householdId,
    p_subject_kind:target.subjectKind,
    p_subject_id:target.subjectId,
    p_month:birthday.month,
    p_day:birthday.day,
    p_year:birthday.year,
  });
  if(error){
    return{status:'unavailable',spokenReply:fr(input.languageTag)?'Je n’arrive pas à l’enregistrer pour le moment. On réessaiera plus tard.':'I can’t save it right now. We’ll try again later.'};
  }
  pending=null;
  const label=birthdayLabel(birthday,input.languageTag);
  const joke=postBirthdayJoke(target.subjectName,input.languageTag);
  return{status:'saved',spokenReply:fr(input.languageTag)
    ?`Parfait, je retiens que l’anniversaire de ${target.subjectName} est le ${label}.${joke}`
    :`Perfect. I’ll remember that ${target.subjectName}'s birthday is ${label}.`};
}
