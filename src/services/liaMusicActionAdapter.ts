import {readStoredString,writeStoredString} from '../lib/storage';
import {Linking} from 'react-native';
import {parseLiaMusicCommand,type LiaMusicService} from '../lib/liaMusicCommand';
import {markLiaExternalHandoff} from './liaAssistantContinuity';

const SERVICE_KEY='notre-table:lia-music-service:v1';
type PendingMusic={query:string|null};
let pendingMusic:PendingMusic|null=null;

const LABELS:Record<LiaMusicService,string>={spotify:'Spotify',apple_music:'Apple Music',youtube_music:'YouTube Music'};

function isService(value:string|null):value is LiaMusicService{return value==='spotify'||value==='apple_music'||value==='youtube_music';}
export async function getPreferredLiaMusicService():Promise<LiaMusicService|null>{const value=await readStoredString(SERVICE_KEY,'', ['', 'spotify','apple_music','youtube_music'] as const);return isService(value)?value:null;}
export async function setPreferredLiaMusicService(service:LiaMusicService):Promise<void>{await writeStoredString(SERVICE_KEY,service);}
export function liaMusicClarificationPending():boolean{return pendingMusic!==null;}
export function clearLiaMusicClarification():void{pendingMusic=null;}

function serviceFromAnswer(text:string):LiaMusicService|null{
  const s=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(s.includes('spotify'))return'spotify';
  if(s.includes('apple music')||s.includes('musique apple'))return'apple_music';
  if(s.includes('youtube music'))return'youtube_music';
  return null;
}
function urlFor(service:LiaMusicService,query:string|null):string{
  if(service==='spotify')return query?`https://open.spotify.com/search/${encodeURIComponent(query)}`:'https://open.spotify.com/';
  if(service==='apple_music')return query?`https://music.apple.com/search?term=${encodeURIComponent(query)}`:'https://music.apple.com/';
  return query?`https://music.youtube.com/search?q=${encodeURIComponent(query)}`:'https://music.youtube.com/';
}
function askService(languageTag:string):string{return languageTag.toLowerCase().startsWith('fr')?'Tu veux que je la mette sur Spotify, Apple Music ou YouTube Music ?':'Do you want Spotify, Apple Music, or YouTube Music?';}
function launchedReply(service:LiaMusicService,query:string|null,languageTag:string):string{
  const label=LABELS[service];
  if(languageTag.toLowerCase().startsWith('fr'))return query?`Je lance ${query} sur ${label}.`:`Je lance la musique sur ${label}.`;
  return query?`Playing ${query} on ${label}.`:`Opening music on ${label}.`;
}

async function launch(service:LiaMusicService,query:string|null,languageTag:string):Promise<{status:'launched'|'unavailable';spokenReply:string}>{
  const url=urlFor(service,query);
  try{
    markLiaExternalHandoff('music');
    await Linking.openURL(url);
    pendingMusic=null;
    await setPreferredLiaMusicService(service);
    return{status:'launched',spokenReply:launchedReply(service,query,languageTag)};
  }catch{
    pendingMusic=null;
    return{status:'unavailable',spokenReply:languageTag.toLowerCase().startsWith('fr')?`Je n’arrive pas à ouvrir ${LABELS[service]} pour le moment.`:`I can’t open ${LABELS[service]} right now.`};
  }
}

export async function prepareLiaMusicFromSpeech(text:string,languageTag:string):Promise<{status:'not_recognized'|'needs_clarification'|'launched'|'unavailable';spokenReply:string|null}>{
  const parsed=parseLiaMusicCommand(text);
  if(!parsed.recognized)return{status:'not_recognized',spokenReply:null};
  const service=parsed.service??await getPreferredLiaMusicService();
  if(!service){pendingMusic={query:parsed.query};return{status:'needs_clarification',spokenReply:askService(languageTag)};}
  return launch(service,parsed.query,languageTag);
}

export async function continueLiaMusicClarification(text:string,languageTag:string):Promise<{status:'needs_clarification'|'launched'|'unavailable';spokenReply:string}>{
  const pending=pendingMusic;
  const service=serviceFromAnswer(text);
  if(!pending||!service)return{status:'needs_clarification',spokenReply:askService(languageTag)};
  return launch(service,pending.query,languageTag);
}
