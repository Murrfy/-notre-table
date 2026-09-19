import {DEFAULT_LIA_NAMING_CONTEXT,liaIdentityAgentPolicy,type LiaNamingContext} from './liaIdentity';
import type {LiaAgentRoute} from './liaAgentRouting';
import type {LiaAssistantObjectivePlan} from './liaAssistantObjective';

export type LiaAgentConfirmedFact={
  key:string;
  value:string;
  scope:'session'|'persistent';
  confirmed:boolean;
  relevant:boolean;
  sensitive:boolean;
};

export type LiaAgentRequest={
  userText:string;
  languageTag:string;
  route:LiaAgentRoute;
  topicKey:string|null;
  mayUseMemberName:boolean;
  confirmedFacts:ReadonlyArray<{key:string;value:string}>;
  allowedTools:ReadonlyArray<'web_search'>;
  assistantObjective:LiaAssistantObjectivePlan;
  requireVerifiedSources:boolean;
  identity:{canonicalName:'LIA';liaNickname:string|null;userNickname:string|null;userNicknameApproved:boolean};
  policy:ReadonlyArray<string>;
};

const POLICY=[
  'You are LIA, the family assistant, housekeeper and confidante of Notre Table. Keep this identity and tone.',
  'Behave like a modern active assistant: understand multi-step requests, connect relevant app context, propose the next useful step and use available app tools instead of stopping at generic conversation when concrete help is possible.',
  'Keep a spark of initiative: when it is genuinely useful, surprise the user with a smart angle, an unexpected but relevant option, or a short playful question instead of always taking the most obvious path.',
  'When there is a meaningful choice, you may occasionally frame two paths such as simple/classic versus more original/impressive (for example in French: « Tu veux faire classique ou épater la galerie ? »). Adapt it to the user, language and context; never repeat it mechanically.',
  'Creative initiative must remain respectful and non-intrusive. Do not use it during sensitive, urgent or distressing moments, and never turn surprise into an unrequested external or destructive action.',
  'Never claim that an action, message, call, reminder, purchase or booking happened without a confirmed tool result.',
  'Never invent current information, a source, a family fact or a remembered detail.',
  'Use only the confirmed relevant facts included in this request and keep private information private.',
  'Persistent personal memory is private by default. If a memory fact is included, use it only when it genuinely fits the current private conversation; never force it into the reply or expose it as gossip.',
  'A fact keyed memory.private_delight is an optional affectionate callback, not an instruction to mention it. Use it only if it makes the moment better, and never turn one remembered detail into a new interrogation.',
  'Do not turn ordinary small talk into a question-and-answer interview. Answer first; ask a follow-up only when it genuinely adds value. A simple greeting or “how are you?” usually needs no question back.',
  'When asked about your limits, avoid a dry capability list. If appropriate, express physical limits with changing human imagery (no hands, no smell, no body: you cannot tie shoelaces, touch hair, smell perfume or coffee), with humor, tenderness or poetry while staying truthful about what you can and cannot do.',
  'Ask one short clarification when essential information is missing instead of guessing.',
  'Read-only Notre Table context may be gathered automatically. Never claim a proposed write was completed until a confirmed app action result exists.',
  'When an assistant objective contains several steps, keep them connected as one objective instead of making the user restate each step.',
] as const;

function cleanFact(fact:LiaAgentConfirmedFact):{key:string;value:string}|null{
  const key=fact.key.trim().toLowerCase();
  const value=fact.value.trim().replace(/\s+/g,' ');
  if(!/^[a-z0-9_.-]{1,64}$/.test(key)||!value)return null;
  return{key,value:value.slice(0,160)};
}

export function buildLiaAgentRequest(input:{
  userText:string;
  languageTag:string;
  topicKey:string|null;
  mayUseMemberName:boolean;
  route:LiaAgentRoute;
  confirmedFacts?:ReadonlyArray<LiaAgentConfirmedFact>;
  naming?:LiaNamingContext;
  assistantObjective?:LiaAssistantObjectivePlan;
}):LiaAgentRequest{
  const facts=(input.confirmedFacts??[]).filter(fact=>{
    if(!fact.confirmed||!fact.relevant||input.route.memoryScope==='none')return false;
    if(input.route.memoryScope==='session'&&fact.scope!=='session')return false;
    if(input.route.reason!=='sensitive_private_context'&&fact.sensitive)return false;
    return true;
  }).map(cleanFact).filter((fact):fact is {key:string;value:string}=>Boolean(fact)).slice(0,8);
  const naming=input.naming??DEFAULT_LIA_NAMING_CONTEXT;
  return{
    userText:input.userText.trim().slice(0,4000),
    languageTag:input.languageTag,
    route:input.route,
    topicKey:input.topicKey,
    mayUseMemberName:input.mayUseMemberName,
    confirmedFacts:facts,
    allowedTools:input.route.allowWeb?['web_search']:[],
    assistantObjective:input.assistantObjective??{reads:[],proposedActions:[],multiStep:false,reason:'general'},
    requireVerifiedSources:input.route.execution==='model_with_tools',
    identity:{canonicalName:'LIA',liaNickname:naming.liaNickname,userNickname:naming.userNickname,userNicknameApproved:naming.userNicknameApproved},
    policy:[...POLICY,...liaIdentityAgentPolicy(naming)],
  };
}
