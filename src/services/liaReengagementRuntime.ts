import {getLiaQuietState,liaQuietNow} from './liaProactivity';
import {nextLiaOpenLoopReengagement,noteLiaOpenLoopSurfaced} from './liaOpenLoops';
import {deliverLiaOpenLoopReengagement} from './notifications';

export type LiaReengagementRunResult={
  channel:'none'|'in_app'|'notification';
  delivery:'none'|'in-app'|'scheduled'|'permission-denied';
  reason:string;
  openLoopId:string|null;
  body:string|null;
};

export async function runLiaOpenLoopReengagement(input:{
  householdId:string|null;
  appForeground:boolean;
  genericPrivatePreview:string;
  title:string;
  channelName:string;
  now?:Date;
  demo?:boolean;
}):Promise<LiaReengagementRunResult>{
  const now=input.now??new Date();
  const quietState=await getLiaQuietState(now);
  const decision=await nextLiaOpenLoopReengagement({
    householdId:input.householdId,
    now,
    quiet:liaQuietNow(quietState,now),
    appForeground:input.appForeground,
    genericPrivatePreview:input.genericPrivatePreview,
    demo:input.demo,
  });
  if(!decision.loop||decision.channel==='none'||!decision.body){
    return{channel:decision.channel,delivery:'none',reason:decision.reason,openLoopId:decision.loop?.id??null,body:null};
  }
  const delivery=await deliverLiaOpenLoopReengagement({
    loop:decision.loop,
    decision:{channel:decision.channel,bodyMode:decision.reason==='private'?'generic_private':'contextual',reason:decision.reason as Exclude<typeof decision.reason,'no_thread'>},
    body:decision.body,
    title:input.title,
    channelName:input.channelName,
  });
  // Count a surface only if LIA actually surfaced something.
  if(delivery==='scheduled'||delivery==='in-app'){
    await noteLiaOpenLoopSurfaced(decision.loop.id,input.demo??false,now);
  }
  return{channel:decision.channel,delivery,reason:decision.reason,openLoopId:decision.loop.id,body:delivery==='in-app'?decision.body:null};
}
