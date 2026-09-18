import type {LiaNamingContext} from '../lib/liaIdentity';
import type {LiaAgentTask} from '../lib/liaAgentRouting';
import type {LiaAgentConfirmedFact,LiaAgentRequest} from '../lib/liaAgentRequest';

export type LiaTableResponseContext={
  mode:'table'|'cooking';
  languageTag:string;
  topicKey:string|null;
  memberId:string|null;
  mayUseMemberName:boolean;
  agentTask?:LiaAgentTask;
  essential?:boolean;
  sensitiveInput?:boolean;
  monthToDateUsd?:number;
  confirmedFacts?:ReadonlyArray<LiaAgentConfirmedFact>;
  naming?:LiaNamingContext;
  householdId?:string;
  weekStart?:string;
  demo?:boolean;
};

export type LiaTableResponse={
  text:string;
  sensitive:boolean;
  evidence:'conversation'|'verified_sources';
};

export interface LiaTableResponseAdapter{
  isAvailable():boolean;
  generate(input:{request:LiaAgentRequest;signal:AbortSignal}):Promise<LiaTableResponse>;
}

let adapter:LiaTableResponseAdapter|null=null;

export function registerLiaTableResponseAdapter(value:LiaTableResponseAdapter|null){adapter=value;}
export function getLiaTableResponseAdapter(){return adapter?.isAvailable()?adapter:null;}
export function liaTableResponseAvailable(){return Boolean(getLiaTableResponseAdapter());}
