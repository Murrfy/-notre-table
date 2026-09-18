import {LiaResolvedTableTurn} from './liaTableSpeechAdapter';
import {getLiaTableResponseAdapter,LiaTableResponseContext} from './liaTableResponseAdapter';
import {selectLiaAgentRoute} from '../lib/liaAgentRouting';
import {classifyLiaAgentTurn} from '../lib/liaAgentTurnClassifier';
import {buildLiaAgentRequest} from '../lib/liaAgentRequest';
import {executeLiaAgentProviderOnce,liaAgentDeadlineMs} from '../lib/liaAgentProviderExecution';
import type {LiaAgentTask} from '../lib/liaAgentRouting';
import {planLiaAssistantObjective} from '../lib/liaAssistantObjective';
import {collectLiaAssistantAppFacts} from './liaAssistantAppContext';

type LiaTableResponseFailureStatus='unavailable'|'deferred_cost_guard'|'empty'|'unverified'|'local_action_required'|'timed_out'|'provider_error';

export type LiaTableResponseRuntimeResult=
  |{status:LiaTableResponseFailureStatus;sensitive:boolean;task:LiaAgentTask}
  |{status:'ready';text:string;sensitive:boolean};

export async function generateLiaTableResponse(input:{
  turn:LiaResolvedTableTurn;
  context:LiaTableResponseContext;
}):Promise<LiaTableResponseRuntimeResult>{
  const classification=classifyLiaAgentTurn(input.turn.text);
  const task=input.context.agentTask??classification.task;
  const sensitive=Boolean(input.context.sensitiveInput)||classification.sensitive;
  const route=selectLiaAgentRoute({
    task,
    monthToDateUsd:input.context.monthToDateUsd??0,
    essential:input.context.essential??true,
    sensitive,
  });
  const failure=(status:LiaTableResponseFailureStatus):LiaTableResponseRuntimeResult=>({status,sensitive,task});
  if(route.execution==='defer')return failure('deferred_cost_guard');
  if(route.execution==='local')return failure('local_action_required');
  const adapter=getLiaTableResponseAdapter();
  if(!adapter)return failure('unavailable');
  const assistantObjective=planLiaAssistantObjective(input.turn.text);
  const appFacts=input.context.householdId&&input.context.weekStart
    ?await collectLiaAssistantAppFacts({householdId:input.context.householdId,weekStart:input.context.weekStart,demo:Boolean(input.context.demo),plan:assistantObjective})
    :[];
  const request=buildLiaAgentRequest({
    userText:input.turn.text,
    languageTag:input.context.languageTag,
    topicKey:input.context.topicKey,
    mayUseMemberName:input.context.mayUseMemberName,
    route,
    confirmedFacts:[...(input.context.confirmedFacts??[]),...appFacts],
    naming:input.context.naming,
    assistantObjective,
  });
  const execution=await executeLiaAgentProviderOnce({
    timeoutMs:liaAgentDeadlineMs(route),
    run:signal=>adapter.generate({request,signal}),
  });
  if(!execution.ok)return failure(execution.reason);
  const result=execution.value;
  const text=result.text.trim();
  if(!text)return failure('empty');
  if(request.requireVerifiedSources&&result.evidence!=='verified_sources')return failure('unverified');
  return{status:'ready',text,sensitive:result.sensitive||route.reason==='sensitive_private_context'};
}
