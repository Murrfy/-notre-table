export type LiaDiscoveryMode = 'local_intro' | 'cloud_normal' | 'cloud_economy' | 'local_only' | 'subscriber';

// Pre-subscription acquisition budget. This is an internal business guardrail, never a
// visible "token" balance. Before authentication, LIA's introduction is local/scripted
// so a download that never creates an account has zero paid-AI requirement.
export const LIA_DISCOVERY_BUDGET_USD = 0.05;
export const LIA_DISCOVERY_BUDGET_MICROUSD = 50_000;
export const LIA_DISCOVERY_ECONOMIZE_AT_USD = 0.035;

const nonNegative=(value:number)=>Math.max(0,Number.isFinite(value)?value:0);

export function liaDiscoveryMode({
  authenticated,
  hasFamilyAccess,
  spentUsd,
}:{
  authenticated:boolean;
  hasFamilyAccess:boolean;
  spentUsd:number;
}):LiaDiscoveryMode{
  if(hasFamilyAccess)return 'subscriber';
  if(!authenticated)return 'local_intro';
  const spent=nonNegative(spentUsd);
  if(spent>=LIA_DISCOVERY_BUDGET_USD)return 'local_only';
  if(spent>=LIA_DISCOVERY_ECONOMIZE_AT_USD)return 'cloud_economy';
  return 'cloud_normal';
}

export function liaDiscoveryMayReserve({
  spentMicrousd,
  requestedMicrousd,
}:{
  spentMicrousd:number;
  requestedMicrousd:number;
}):boolean{
  const spent=Math.floor(nonNegative(spentMicrousd));
  const requested=Math.floor(nonNegative(requestedMicrousd));
  if(requested<=0)return false;
  return spent+requested<=LIA_DISCOVERY_BUDGET_MICROUSD;
}

export function maximumDiscoveryAcquisitionCostUsd(nonSubscriberAccounts:number):number{
  return Math.floor(nonNegative(nonSubscriberAccounts))*LIA_DISCOVERY_BUDGET_USD;
}
