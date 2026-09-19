import {supabase} from '../lib/supabase';

export type LiaSpeakerRosterPerson={subjectKind:'profile'|'light_member';subjectId:string;displayName:string;relation:string|null};
export type LiaSpeakerRosterResolution=|{status:'matched';person:LiaSpeakerRosterPerson}|{status:'ambiguous';candidates:LiaSpeakerRosterPerson[]}|{status:'unknown';candidates:[]};

function clean(value:string):string{return value.trim().replace(/\s+/g,' ').slice(0,80);}
function folded(value:string):string{return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function first(value:string):string{return folded(value).split(' ')[0]??'';}

export function resolveLiaSpeakerFromRoster(name:string,people:LiaSpeakerRosterPerson[]):LiaSpeakerRosterResolution{
 const wanted=folded(name);
 if(!wanted)return{status:'unknown',candidates:[]};
 const exact=people.filter(person=>folded(person.displayName)===wanted);
 if(exact.length===1)return{status:'matched',person:exact[0]};
 if(exact.length>1)return{status:'ambiguous',candidates:exact};
 const byFirst=people.filter(person=>first(person.displayName)===wanted);
 if(byFirst.length===1)return{status:'matched',person:byFirst[0]};
 if(byFirst.length>1)return{status:'ambiguous',candidates:byFirst};
 return{status:'unknown',candidates:[]};
}

export async function fetchLiaSpeakerRoster(householdId:string):Promise<LiaSpeakerRosterPerson[]>{
 if(!supabase)return[];
 const {data:{user},error:userError}=await supabase.auth.getUser();
 if(userError)throw userError;
 if(!user)return[];
 const [{data:profile,error:profileError},{data:members,error:memberError}]=await Promise.all([
  supabase.from('profiles').select('id,display_name').eq('id',user.id).maybeSingle(),
  supabase.from('light_members').select('id,display_name,relation,active').eq('household_id',householdId).eq('active',true),
 ]);
 if(profileError)throw profileError;
 if(memberError)throw memberError;
 const people:LiaSpeakerRosterPerson[]=[];
 if(profile?.display_name)people.push({subjectKind:'profile',subjectId:String(profile.id),displayName:clean(profile.display_name),relation:'organizer'});
 for(const member of members??[]){
  const displayName=clean(String((member as any).display_name??''));
  if(displayName)people.push({subjectKind:'light_member',subjectId:String((member as any).id),displayName,relation:(member as any).relation??null});
 }
 return people;
}

export function liaSpeakerDisambiguationQuestion(candidates:LiaSpeakerRosterPerson[],languageTag:string):string{
 const names=candidates.map(item=>item.displayName);
 const details=candidates.map(item=>item.relation?item.displayName+' ('+item.relation+')':item.displayName);
 if(languageTag.toLowerCase().startsWith('fr'))return 'J’ai plusieurs personnes qui peuvent correspondre : '+details.join(' ou ')+'. Tu es laquelle ?';
 if(languageTag.toLowerCase().startsWith('he'))return 'יש לי כמה אנשים שמתאימים: '+names.join(' או ')+'. מי מהם זה?';
 return 'I have more than one match: '+details.join(' or ')+'. Which one are you?';
}