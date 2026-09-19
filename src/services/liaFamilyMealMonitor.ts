import {addDays,localIsoDate} from '../lib/dates';
import {supabase} from '../lib/supabase';
import {emitLiaContextualGuidance} from './liaContextualGuidance';
import {fetchLightMealDecisionSnapshots,fetchLightMembers,subscribeLightMealResponses,type LightMealDecisionSnapshot,type LightMealRecipient} from './lightParticipation';
import {getMyDisplayName} from './profiles';

type RecipientState={desire:LightMealRecipient['desire'];takesCharge:boolean;responded:boolean;memberName:string};

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
  let favoriteByMemberId=new Map<string,string>();
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
              desire:item.desire,
              favoriteMeal:favoriteByMemberId.get(memberId)??null,
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
      const [nameResult,snapshots,lightMembers]=await Promise.all([
        organizerName?Promise.resolve(organizerName):getMyDisplayName().catch(()=>''),
        fetchLightMealDecisionSnapshots(input.householdId,today,to).catch(()=>[]),
        fetchLightMembers(input.householdId).catch(()=>[]),
      ]);
      if(!active)return;
      organizerName=nameResult;
      favoriteByMemberId=new Map(lightMembers.flatMap(member=>{
        const value=member.favorite_meal?.trim();
        return value?[[member.id,value] as [string,string]]:[];
      }));
      syncResponseSubscriptions(snapshots);
      if(emitChanges)compareAndEmit(snapshots);
      else previous=new Map(snapshots.map(snapshot=>[snapshot.question.id,recipientMap(snapshot)]));
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
