import {liaCostBand,type LiaCostBand} from './liaEconomics';

export type LiaAgentTask='local_action'|'simple_conversation'|'complex_reasoning'|'verified_research';
export type LiaAgentModelTier='none'|'economy'|'standard'|'reasoning';
export type LiaAgentExecution='local'|'model'|'model_with_tools'|'defer';
export type LiaAgentMemoryScope='none'|'session'|'relevant_confirmed';

export type LiaAgentRoute={
  task:LiaAgentTask;
  execution:LiaAgentExecution;
  modelTier:LiaAgentModelTier;
  allowWeb:boolean;
  memoryScope:LiaAgentMemoryScope;
  maxOutputTokens:number;
  costBand:LiaCostBand;
  reason:'deterministic_app_tool'|'simple_low_cost'|'quality_needed'|'verified_current_information'|'sensitive_private_context'|'nonessential_cost_guard';
};

export function selectLiaAgentRoute(input:{
  task:LiaAgentTask;
  monthToDateUsd:number;
  essential:boolean;
  sensitive:boolean;
}):LiaAgentRoute{
  const costBand=liaCostBand(input.monthToDateUsd);
  if(input.task==='local_action')return{task:input.task,execution:'local',modelTier:'none',allowWeb:false,memoryScope:'none',maxOutputTokens:0,costBand,reason:'deterministic_app_tool'};
  if(input.sensitive)return{task:input.task,execution:'model',modelTier:costBand==='normal'?'standard':'economy',allowWeb:false,memoryScope:'session',maxOutputTokens:240,costBand,reason:'sensitive_private_context'};
  if(input.task==='verified_research'){
    if(costBand==='protect_margin'&&!input.essential)return{task:input.task,execution:'defer',modelTier:'none',allowWeb:false,memoryScope:'none',maxOutputTokens:0,costBand,reason:'nonessential_cost_guard'};
    return{task:input.task,execution:'model_with_tools',modelTier:costBand==='normal'?'standard':'economy',allowWeb:true,memoryScope:'relevant_confirmed',maxOutputTokens:350,costBand,reason:'verified_current_information'};
  }
  if(input.task==='complex_reasoning')return{task:input.task,execution:'model',modelTier:costBand==='normal'?'reasoning':costBand==='economize'||input.essential?'standard':'economy',allowWeb:false,memoryScope:'relevant_confirmed',maxOutputTokens:480,costBand,reason:'quality_needed'};
  return{task:input.task,execution:'model',modelTier:'economy',allowWeb:false,memoryScope:'relevant_confirmed',maxOutputTokens:180,costBand,reason:'simple_low_cost'};
}
