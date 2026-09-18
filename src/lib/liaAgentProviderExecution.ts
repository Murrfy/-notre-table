import type {LiaAgentRoute} from './liaAgentRouting';

export type LiaAgentProviderExecutionResult<T>=
  |{ok:true;value:T}
  |{ok:false;reason:'timed_out'|'provider_error'};

export function liaAgentDeadlineMs(route:LiaAgentRoute):number{
  if(route.execution==='model_with_tools')return 20_000;
  if(route.task==='complex_reasoning')return 15_000;
  return 8_000;
}

export async function executeLiaAgentProviderOnce<T>(input:{
  timeoutMs:number;
  run:(signal:AbortSignal)=>Promise<T>;
}):Promise<LiaAgentProviderExecutionResult<T>>{
  const timeoutMs=Math.max(1_000,Math.min(30_000,input.timeoutMs));
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  const provider:Promise<LiaAgentProviderExecutionResult<T>>=Promise.resolve()
    .then(()=>input.run(controller.signal))
    .then(value=>({ok:true,value} as const))
    .catch(()=>({ok:false,reason:'provider_error'} as const));
  const timeout=new Promise<LiaAgentProviderExecutionResult<T>>(resolve=>{
    timer=setTimeout(()=>{
      controller.abort();
      resolve({ok:false,reason:'timed_out'});
    },timeoutMs);
  });
  try{return await Promise.race([provider,timeout]);}
  finally{if(timer)clearTimeout(timer);}
}
