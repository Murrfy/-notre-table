import {runtimeConfig} from '../lib/runtimeConfig';
import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {supabase} from '../lib/supabase';

export const LIA_NAVIGATION_MONTHLY_TRIP_LIMIT=30;

export type LiaNavigationQuotaState={
  limit:number;
  used:number;
  remaining:number;
  monthStart:string;
  resetsAtIso:string;
};

export type LiaNavigationTripReservation=
  |{status:'reserved';quota:LiaNavigationQuotaState;notice:string|null}
  |{status:'exhausted';quota:LiaNavigationQuotaState;notice:string}
  |{status:'family_plan_required'}
  |{status:'unavailable'};

type ServerQuotaRow={allowed?:unknown;limit?:unknown;used?:unknown;remaining?:unknown;month_start?:unknown;resets_at?:unknown};
type LocalQuotaRecord={monthStart:string;used:number};

const LOCAL_KEY_PREFIX='notre-table:lia-navigation-quota:v1:';

function currentMonthStart(date=new Date()):string{return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-01`;}
function nextMonthIso(date=new Date()):string{return new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1,0,0,0,0)).toISOString();}
function clampInt(value:unknown,fallback:number,min=0,max=1_000_000):number{const parsed=typeof value==='number'&&Number.isFinite(value)?Math.trunc(value):fallback;return Math.max(min,Math.min(max,parsed));}
function parseServerQuota(value:unknown):{allowed:boolean;quota:LiaNavigationQuotaState}|null{
  if(!isRecord(value))return null;
  const row=value as ServerQuotaRow;
  const monthStart=typeof row.month_start==='string'?row.month_start:'';
  const resetsAtIso=typeof row.resets_at==='string'?row.resets_at:'';
  if(!monthStart||!resetsAtIso)return null;
  const limit=clampInt(row.limit,LIA_NAVIGATION_MONTHLY_TRIP_LIMIT,1,1000);
  const used=clampInt(row.used,0,0,limit);
  const remaining=clampInt(row.remaining,Math.max(0,limit-used),0,limit);
  return{allowed:row.allowed===true,quota:{limit,used,remaining,monthStart,resetsAtIso}};
}

function quotaNoticeFr(remaining:number):string|null{
  if(remaining===5)return 'Petit avertissement : on a pas mal roulé ensemble ce mois-ci 😏. Il nous reste 5 trajets.';
  if(remaining===2)return 'Je te préviens : il nous reste 2 trajets avec moi ce mois-ci.';
  if(remaining===1)return 'Dernier trajet disponible avec moi ce mois-ci. Après celui-ci, le quota se remettra à zéro le mois prochain.';
  if(remaining===0)return 'On a utilisé nos 30 trajets ce mois-ci. La navigation avec moi reprendra automatiquement le mois prochain.';
  return null;
}
function quotaNoticeEn(remaining:number):string|null{
  if(remaining===5)return 'Quick heads-up: we have been driving quite a bit together this month 😏. We have 5 trips left.';
  if(remaining===2)return 'Just so you know, we have 2 trips left together this month.';
  if(remaining===1)return 'This is our last available trip this month. The quota resets automatically next month.';
  if(remaining===0)return 'We have used our 30 trips this month. Navigation with me will be available again automatically next month.';
  return null;
}
export function liaNavigationQuotaNotice(remaining:number,languageTag:string):string|null{return languageTag.toLowerCase().startsWith('fr')?quotaNoticeFr(remaining):quotaNoticeEn(remaining);}

async function readLocal(householdId:string):Promise<LocalQuotaRecord>{
  const monthStart=currentMonthStart();
  const key=`${LOCAL_KEY_PREFIX}${householdId}`;
  const stored=await readStoredJson<Record<string,unknown>>(key,{},isRecord);
  if(stored.monthStart!==monthStart)return{monthStart,used:0};
  return{monthStart,used:clampInt(stored.used,0,0,LIA_NAVIGATION_MONTHLY_TRIP_LIMIT)};
}
async function reserveLocal(householdId:string,languageTag:string):Promise<LiaNavigationTripReservation>{
  const key=`${LOCAL_KEY_PREFIX}${householdId}`;
  const current=await readLocal(householdId);
  if(current.used>=LIA_NAVIGATION_MONTHLY_TRIP_LIMIT){
    const quota:LiaNavigationQuotaState={limit:LIA_NAVIGATION_MONTHLY_TRIP_LIMIT,used:current.used,remaining:0,monthStart:current.monthStart,resetsAtIso:nextMonthIso()};
    return{status:'exhausted',quota,notice:liaNavigationQuotaNotice(0,languageTag)??''};
  }
  const used=current.used+1;
  await writeStoredJson(key,{monthStart:current.monthStart,used});
  const quota:LiaNavigationQuotaState={limit:LIA_NAVIGATION_MONTHLY_TRIP_LIMIT,used,remaining:LIA_NAVIGATION_MONTHLY_TRIP_LIMIT-used,monthStart:current.monthStart,resetsAtIso:nextMonthIso()};
  return{status:'reserved',quota,notice:liaNavigationQuotaNotice(quota.remaining,languageTag)};
}

export async function reserveLiaNavigationTrip(input:{householdId:string;languageTag:string;demo?:boolean}):Promise<LiaNavigationTripReservation>{
  if(!input.householdId)return{status:'unavailable'};
  if(input.demo||runtimeConfig.environment!=='production'||!supabase)return reserveLocal(input.householdId,input.languageTag);
  try{
    const {data,error}=await supabase.rpc('reserve_lia_navigation_trip',{p_household_id:input.householdId});
    if(error){
      const message=String(error.message??error);
      if(message.includes('FAMILY_PLAN_REQUIRED'))return{status:'family_plan_required'};
      return{status:'unavailable'};
    }
    const parsed=parseServerQuota(data);
    if(!parsed)return{status:'unavailable'};
    const notice=liaNavigationQuotaNotice(parsed.quota.remaining,input.languageTag);
    return parsed.allowed?{status:'reserved',quota:parsed.quota,notice}:{status:'exhausted',quota:parsed.quota,notice:notice??(input.languageTag.toLowerCase().startsWith('fr')?'On a utilisé nos 30 trajets ce mois-ci.':'We have used our 30 trips this month.')};
  }catch{return{status:'unavailable'};}
}
