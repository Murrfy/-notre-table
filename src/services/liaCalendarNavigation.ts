import {listLiaCalendarEvents,type LiaCalendarEvent} from './liaCalendar';

export type LiaCalendarNavigationResult=
  |{status:'not_recognized'}
  |{status:'requested';destination:string;event:LiaCalendarEvent;spokenReply:string}
  |{status:'not_found'|'ambiguous'|'missing_location'|'unavailable';spokenReply:string};

function fold(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
function fr(tag:string){return tag.toLowerCase().startsWith('fr');}
function eventFragment(text:string):{matched:boolean;next:boolean;fragment:string|null}{
  const s=fold(text);
  if(!/\b(rendez vous|rdv|appointment|event|evenement)\b/.test(s))return{matched:false,next:false,fragment:null};
  const next=/\b(prochain|prochaine|next)\b/.test(s);
  let value=s.replace(/^(?:emmene moi|amene moi|guide moi|conduis moi|navigue|take me|guide me|navigate|drive me)\s+(?:a|vers|to)?\s*/,'');
  value=value.replace(/^(?:a|vers|to)\s+/,'').replace(/^(?:mon|ma|le|la|my)\s+/,'');
  value=value.replace(/^(?:prochain|prochaine|next)\s+/,'').replace(/^(?:rendez vous|rdv|appointment|event|evenement)\s*/,'').replace(/^(?:de|du|pour|avec|chez)\s+/,'').trim();
  return{matched:true,next,fragment:value||null};
}
function match(rows:LiaCalendarEvent[],fragment:string|null){
  if(!fragment)return rows;
  const f=fold(fragment);
  return rows.filter(row=>{const title=fold(row.title);return title.includes(f)||f.includes(title);});
}

export async function prepareLiaCalendarNavigationFromSpeech(text:string,languageTag:string,demo=false,now=new Date()):Promise<LiaCalendarNavigationResult>{
  const parsed=eventFragment(text);if(!parsed.matched)return{status:'not_recognized'};
  try{
    const rows=await listLiaCalendarEvents({from:new Date(now.getTime()-60_000),to:new Date(now.getTime()+180*86_400_000),limit:100,demo});
    const matched=match(rows,parsed.fragment).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
    if(matched.length===0)return{status:'not_found',spokenReply:fr(languageTag)?'Je ne trouve pas ce rendez-vous dans ton calendrier.':'I cannot find that appointment in your calendar.'};
    let event:LiaCalendarEvent|null=null;
    if(parsed.next)event=matched[0]??null;
    else if(matched.length===1)event=matched[0];
    else return{status:'ambiguous',spokenReply:fr(languageTag)?`J’en trouve ${matched.length}. Dis-moi lequel.`:`I found ${matched.length}. Tell me which one.`};
    if(!event?.location)return{status:'missing_location',spokenReply:fr(languageTag)?`J’ai trouvé ${event?.title??'le rendez-vous'}, mais je n’ai pas son adresse.`:`I found ${event?.title??'the appointment'}, but I do not have its address.`};
    return{status:'requested',destination:event.location,event,spokenReply:fr(languageTag)?`J’ai l’adresse de ${event.title}. Je lance En route avec LIA.`:`I have the address for ${event.title}. I’m starting On the road with LIA.`};
  }catch{return{status:'unavailable',spokenReply:fr(languageTag)?'Je n’arrive pas à lire ton calendrier pour préparer le trajet.':'I cannot read your calendar to prepare the route.'};}
}
