import { isRecord, readStoredJson, writeStoredJson } from '../lib/storage';
import { runtimeConfig } from '../lib/runtimeConfig';
import { supabase } from '../lib/supabase';

export type AccessPlan = 'free' | 'trial' | 'family';
export type AccessState = {
  plan: AccessPlan;
  trialEndsAt?: string | null;
  source: 'local-preview' | 'beta-preview' | 'revenuecat';
};

type HouseholdAccessRow={
  plan?:unknown;
  expires_at?:unknown;
};

const KEY = 'notre-table.access.v1';
const DAY = 24 * 60 * 60 * 1000;

export function hasFamilyAccess(access: AccessState): boolean {
  if (access.plan === 'family') return true;
  if (access.plan !== 'trial') return false;
  if (!access.trialEndsAt) return true;
  return new Date(access.trialEndsAt).getTime() > Date.now();
}

export function trialDaysRemaining(access: AccessState): number {
  if (access.plan !== 'trial' || !access.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(access.trialEndsAt).getTime() - Date.now()) / DAY));
}

function productionAccessFromRow(row:HouseholdAccessRow|null|undefined):AccessState{
  if(!row||row.plan!=='family')return {plan:'free',trialEndsAt:null,source:'revenuecat'};
  const expiresAt=typeof row.expires_at==='string'?row.expires_at:null;
  if(expiresAt&&Date.parse(expiresAt)<=Date.now())return {plan:'free',trialEndsAt:null,source:'revenuecat'};
  return {plan:'family',trialEndsAt:null,source:'revenuecat'};
}

async function readHouseholdAccess(householdId:string):Promise<AccessState>{
  if(!supabase)return {plan:'free',trialEndsAt:null,source:'revenuecat'};
  const {data,error}=await supabase
    .from('household_access')
    .select('plan,expires_at')
    .eq('household_id',householdId)
    .maybeSingle();
  if(error)throw error;
  return productionAccessFromRow(data as HouseholdAccessRow|null);
}

async function syncHouseholdAccess(householdId:string):Promise<AccessState>{
  if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');
  const {data,error}=await supabase.functions.invoke('sync-household-access',{body:{household_id:householdId}});
  if(error)throw error;
  return productionAccessFromRow((data?.access??null) as HouseholdAccessRow|null);
}

export async function loadAccessState(demoMode = false, householdId?: string): Promise<AccessState> {
  // Demo and internal preview builds must expose every family flow so beta testing is never blocked by unfinished billing.
  if (demoMode) return { plan: 'trial', trialEndsAt: new Date(Date.now() + 14 * DAY).toISOString(), source: 'local-preview' };
  if (runtimeConfig.environment === 'preview') return { plan: 'family', trialEndsAt: null, source: 'beta-preview' };
  // Production never trusts a local preview/trial cache. RevenueCat identifies the payer, while
  // Supabase mirrors the effective entitlement at household scope so one subscription unlocks
  // every member of the same household. If live verification is temporarily unavailable, the
  // last server-side household value is read through RLS; local device storage is never consulted.
  if (runtimeConfig.environment === 'production') {
    if(!householdId||!supabase)return {plan:'free',trialEndsAt:null,source:'revenuecat'};
    try{return await syncHouseholdAccess(householdId);}catch{
      try{return await readHouseholdAccess(householdId);}catch{return {plan:'free',trialEndsAt:null,source:'revenuecat'};}
    }
  }
  const stored = await readStoredJson<Record<string, unknown>>(KEY, {}, isRecord);
  const plan = stored.plan === 'trial' || stored.plan === 'family' || stored.plan === 'free' ? stored.plan : 'free';
  const source = stored.source === 'revenuecat' ? 'revenuecat' : stored.source === 'beta-preview' ? 'beta-preview' : 'local-preview';
  const trialEndsAt = typeof stored.trialEndsAt === 'string' ? stored.trialEndsAt : null;
  const parsed: AccessState = { plan, source, trialEndsAt };
  if (parsed.plan === 'trial' && parsed.trialEndsAt && new Date(parsed.trialEndsAt).getTime() <= Date.now()) {
    return { plan: 'free', source: 'local-preview' };
  }
  return parsed;
}

// Preview-only helper. Real purchases will replace this with RevenueCat entitlements.
export async function startLocalTrialPreview(): Promise<AccessState> {
  if (runtimeConfig.environment === 'production') throw new Error('PRODUCTION_BILLING_NOT_CONFIGURED');
  const next: AccessState = { plan: 'trial', trialEndsAt: new Date(Date.now() + 14 * DAY).toISOString(), source: 'local-preview' };
  await writeStoredJson(KEY,next);
  return next;
}
