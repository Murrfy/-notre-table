import {addDays,localIsoDate} from '../lib/dates';
import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {liaFamilyRepliesReady} from '../lib/liaFamilyFollowthrough';
import {supabase} from '../lib/supabase';
import {emitLiaContextualGuidance} from './liaContextualGuidance';
import {fetchLightMealDecisionSnapshots,subscribeLightMealResponses,type LightMealDecisionSnapshot,type LightMealRecipient} from './lightParticipation';
import {getMyDisplayName} from './profiles';

type RecipientState={desire:LightMealRecipient['desire'];takesCharge:boolean;responded:boolean;memberName:string};

const FOLLOWTHROUGH_SEEN_KEY='@notre-table/lia-family-followthrough-seen-v1';

function validFollowthroughSeen(value:unknown):value is Record<string,boolean>{
  return isRecord(value)&&Object.values(value).every(item=>typeof item==='boolean');
}

async function emitReadyRepliesOnce(input:{snapshots:LightMealDecisionSnapshot[];householdId:string;organizerName:string}):Promise<void>{
  const seen=await readStoredJson<Record<string,boolean>>(FOLLOWTHROUGH_SEEN_KEY,{},validFollowthroughSeen);
  const next={...seen};
  let changed=false;
  for(const snapshot of input.snapshots){
    const key=snapshot.question.id;
    const recipients=snapshot.summary.recipients;
    const complete=recipients.length>0&&recipients.every(item=>item.responded);
    if(!complete){
      if(next[key]){delete next[key];changed=true;}
      continue;
    }
    if(!liaFamilyRepliesReady({recipients:recipients.map(item=>({responded:item.responded,takesCharge:item.takes_charge})),takeChargeName:snapshot.summary.take_charge_name}))continue;
    if(next[key])continue;
    emitLiaContextualGuidance({
      kind:'family_replies_ready',
      householdId:input.householdId,
      organizerName:input.organizerName,
      questionId:snapshot.question.id,
      mealDate:snapshot.question.meal_date,
      mealType:snapshot.question.meal_type,
      homeStyle:snapshot.question.lia_home_style??null,
      choices:recipients.map(item=>({memberName:item.member_name,presence:item.presence,desire:item.desire})),
    });
    next[key]=true;changed=true;
  }
  const keys=Object.keys(next);
  if(keys.length>60){for(const key of keys.slice(0,keys.length-60)){delete next[key];changed=true;}}
  if(changed)await writeStoredJson(FOLLOWTHROUGH_SEEN_KEY,next);
}

function recipientMap(snapshot:LightMealDecisionSnapshot):Map<string,RecipientState>{
  return new Map(snapshot.summary.recipients.map(item=>[
    item.member_id,
    {desire:item.desire,takesCharge:item.takes_charge,responded:item.responded,memberName:item.member_name},
  ]));
}

export function startLiaFamilyMealDecisionMonitor(input:{householdId:string;demo?:boolean}):()=>void{
  if(input.demo||!supabase||!input.householdId)return()=>{};
  let active=true;
  let previous:Map<string,Map<string,RecipientState>>|null=null;
  let organizerName='';
  let responseUnsubs:Array<()=>void>=[];
  let subscribedQuestionIds='';
  let running=false;
  let rerun=false;

  const syncResponseSubscriptions=(snapshots:LightMealDecisionSnapshot[])=>{
    const ids=snapshots.map(item=>item.question.id).sort();
    const signature=ids.join('|');
    if(signature===subscribedQuestionIds)return;
    for(const unsubscribe of responseUnsubs)unsubscribe();
    responseUnsubs=ids.map(id=>subscribeLightMealResponses(id,()=>{void refresh(true);}));
    subscribedQuestionIds=signature;
  };

  const compareAndEmit=(snapshots:LightMealDecisionSnapshot[])=>{
    const current=new Map<string,Map<string,RecipientState>>();
    for(const snapshot of snapshots){
      const recipients=recipientMap(snapshot);
      current.set(snapshot.question.id,recipients);
      if(previous){
        const beforeQuestion=previous.get(snapshot.question.id);
        for(const [memberId,item] of recipients){
          if(!item.responded)continue;
          const before=beforeQuestion?.get(memberId);
          if(item.desire&&before?.desire!==item.desire){
            emitLiaContextualGuidance({
              kind:'family_choice_changed',
              householdId:input.householdId,
              organizerName,
              memberName:item.memberName,
              mealDate:snapshot.question.meal_date,
              mealType:snapshot.question.meal_type,
              questionId:snapshot.question.id,
              desire:item.desire,
              homeStyle:snapshot.question.lia_home_style??null,
            });
          }
          if(Boolean(before?.takesCharge)!==item.takesCharge){
            emitLiaContextualGuidance({
              kind:'family_take_charge_changed',
              householdId:input.householdId,
              organizerName,
              memberName:item.memberName,
              mealDate:snapshot.question.meal_date,
              mealType:snapshot.question.meal_type,
              active:item.takesCharge,
            });
          }
        }
      }
    }
    previous=current;
  };

  const refresh=async(emitChanges:boolean)=>{
    if(running){rerun=true;return;}
    running=true;
    try{
      const today=localIsoDate(new Date());
      const to=localIsoDate(addDays(new Date(),7));
      const [nameResult,snapshots]=await Promise.all([
        organizerName?Promise.resolve(organizerName):getMyDisplayName().catch(()=>''),
        fetchLightMealDecisionSnapshots(input.householdId,today,to).catch(()=>[]),
      ]);
      if(!active)return;
      organizerName=nameResult;
      syncResponseSubscriptions(snapshots);
      if(emitChanges)compareAndEmit(snapshots);
      else previous=new Map(snapshots.map(snapshot=>[snapshot.question.id,recipientMap(snapshot)]));
      await emitReadyRepliesOnce({snapshots,householdId:input.householdId,organizerName});
    }finally{
      running=false;
      if(rerun&&active){rerun=false;void refresh(true);}
    }
  };

  void refresh(false);

  const questionChannel=supabase
    .channel(`lia-family-meal-questions-${input.householdId}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'light_meal_questions',filter:`household_id=eq.${input.householdId}`},()=>{void refresh(true);})
    .subscribe();

  return()=>{
    active=false;
    for(const unsubscribe of responseUnsubs)unsubscribe();
    responseUnsubs=[];
    void supabase?.removeChannel(questionChannel);
  };
}
