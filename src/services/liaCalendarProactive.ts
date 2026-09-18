import {liaDayBriefMaySurface} from '../lib/liaRightHand';
import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {buildLiaCalendarRightHandBrief} from './liaCalendarBrief';
import {liaNavigationLiveSessionActive} from './liaNavigationLiveSession';

const KEY='@notre-table/lia-calendar-proactive-v1';
type State={day:string;count:number;lastThreadId:string|null};
function valid(value:unknown):value is State{return isRecord(value)&&typeof value.day==='string'&&typeof value.count==='number'&&(value.lastThreadId===null||typeof value.lastThreadId==='string');}
function localDay(now:Date){return`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
function timeLabel(date:Date,tag:string){return date.toLocaleTimeString(tag,{hour:'2-digit',minute:'2-digit'});}

export async function maybeLiaCalendarForegroundNudge(input:{now?:Date;demo?:boolean;quiet:boolean;languageTag:string}):Promise<string|null>{
  const now=input.now??new Date();if(input.quiet||liaNavigationLiveSessionActive())return null;
  const hour=now.getHours();if(hour<7||hour>=22)return null;
  const brief=await buildLiaCalendarRightHandBrief({now,demo:input.demo});
  if(!liaDayBriefMaySurface({brief,quiet:input.quiet,humanSpeechActive:false,mode:'idle'})||!brief.nextThread?.timeIso)return null;
  const at=new Date(brief.nextThread.timeIso);const delta=at.getTime()-now.getTime();if(!Number.isFinite(delta)||delta<10*60_000||delta>3*60*60_000)return null;
  const day=localDay(now),stored=await readStoredJson<State>(KEY,{day,count:0,lastThreadId:null},valid),state=stored.day===day?stored:{day,count:0,lastThreadId:null};
  if(state.count>=2||state.lastThreadId===brief.nextThread.id)return null;
  await writeStoredJson(KEY,{day,count:state.count+1,lastThreadId:brief.nextThread.id});
  return input.languageTag.toLowerCase().startsWith('fr')?`Petit rappel : ${brief.nextThread.label} à ${timeLabel(at,input.languageTag)}.`:`Quick reminder: ${brief.nextThread.label} at ${timeLabel(at,input.languageTag)}.`;
}
