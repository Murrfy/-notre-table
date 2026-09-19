import {supabase} from '../lib/supabase';
import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {emitLiaContextualGuidance} from './liaContextualGuidance';
import {liaDaysUntilBirthday} from '../lib/liaBirthdayAwareness';

const LEDGER_KEY='@notre-table/lia-birthday-awareness-v1';
const UPCOMING_DAYS=7;

type BirthdayPerson={
  kind:'profile'|'light_member';
  id:string;
  name:string;
  relation:'self'|'spouse'|'child'|'other';
  month:number;
  day:number;
  favoriteMeal:string|null;
};
type Ledger={shown:Record<string,string>};

function validLedger(value:unknown):value is Ledger{
  return isRecord(value)&&isRecord(value.shown)&&Object.values(value.shown).every(v=>typeof v==='string');
}
function cleanName(value:string):string{return value.trim().replace(/\s+/g,' ').slice(0,80);}
function priority(person:BirthdayPerson):number{
  return person.relation==='spouse'?0:person.relation==='child'?1:person.relation==='self'?2:3;
}
async function loadPeople(householdId:string):Promise<BirthdayPerson[]>{
  if(!supabase)return[];
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return[];
  const [{data:profile,error:profileError},{data:members,error:memberError}]=await Promise.all([
    supabase.from('profiles').select('id,display_name,birthday_month,birthday_day,favorite_meal').eq('id',user.id).maybeSingle(),
    supabase.from('light_members').select('id,display_name,relation,active,birthday_month,birthday_day,favorite_meal').eq('household_id',householdId).eq('active',true),
  ]);
  if(profileError)throw profileError;
  if(memberError)throw memberError;
  const people:BirthdayPerson[]=[];
  if(profile?.birthday_month&&profile?.birthday_day){
    const name=cleanName(profile.display_name||'');
    if(name)people.push({kind:'profile',id:user.id,name,relation:'self',month:Number(profile.birthday_month),day:Number(profile.birthday_day),favoriteMeal:cleanName(String(profile.favorite_meal??''))||null});
  }
  for(const row of (members??[]) as any[]){
    if(!row.birthday_month||!row.birthday_day)continue;
    const name=cleanName(row.display_name??'');if(!name)continue;
    const relation=row.relation==='spouse'?'spouse':row.relation==='child'?'child':'other';
    people.push({kind:'light_member',id:String(row.id),name,relation,month:Number(row.birthday_month),day:Number(row.birthday_day),favoriteMeal:cleanName(String(row.favorite_meal??''))||null});
  }
  return people;
}

export async function maybeEmitLiaBirthdayAwareness(input:{
  householdId:string;
  organizerName:string;
  now?:Date;
  demo?:boolean;
}):Promise<boolean>{
  if(input.demo||!input.householdId)return false;
  const now=input.now??new Date();
  const people=await loadPeople(input.householdId);
  const candidates=people.map(person=>({person,when:liaDaysUntilBirthday(person.month,person.day,now)}))
    .filter((row):row is {person:BirthdayPerson;when:{days:number;year:number}}=>Boolean(row.when)&&row.when!.days<=UPCOMING_DAYS)
    .sort((a,b)=>a.when.days-b.when.days||priority(a.person)-priority(b.person));
  if(!candidates.length)return false;

  const ledger=await readStoredJson<Ledger>(LEDGER_KEY,{shown:{}},validLedger);
  for(const candidate of candidates){
    const stage=candidate.when.days===0?'today':'upcoming';
    const key=`${input.householdId}:${candidate.person.kind}:${candidate.person.id}:${candidate.when.year}:${stage}`;
    if(ledger.shown[key])continue;
    await writeStoredJson(LEDGER_KEY,{shown:{...ledger.shown,[key]:now.toISOString()}});
    emitLiaContextualGuidance({
      kind:'birthday_awareness',
      householdId:input.householdId,
      organizerName:cleanName(input.organizerName),
      subjectName:candidate.person.name,
      daysUntil:candidate.when.days,
      favoriteMeal:candidate.person.favoriteMeal,
    });
    return true;
  }
  return false;
}
