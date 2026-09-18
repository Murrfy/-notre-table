import { supabase } from '../lib/supabase';
import { Household } from '../types';

export type HouseholdFamilySetupMember={relation:'spouse'|'child'|'other';relationLabel:string|null;salutation:'mr'|'mrs'|'other'|null;displayName:string;age:number|null;phoneNumber:string|null};
export type HouseholdFamilySetupPayload={salutation:'mr'|'mrs'|'other';displayName:string;age:number|null;phoneNumber:string|null;relationshipStatus:'single'|'married'|'divorced'|'partnered'|null;defaultPartySize:number;members:HouseholdFamilySetupMember[]};

export async function getMyHousehold(): Promise<Household | null> {
  if (!supabase) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('household_members')
    .select('role, households(id, name, setup_completed, default_party_size, delivery_address)')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const householdRaw = Array.isArray(data.households) ? data.households[0] : data.households;
  const household = householdRaw as { id: string; name: string; setup_completed?: boolean; default_party_size?: number | null; delivery_address?: string | null } | null;
  if (!household) return null;

  return { id: household.id, name: household.name, role: data.role as 'admin' | 'member', setup_completed: household.setup_completed ?? true, default_party_size: household.default_party_size ?? null, delivery_address: household.delivery_address ?? null };
}

export async function createHousehold(name: string, deliveryAddress?: string): Promise<Household> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.rpc('create_household', { p_name: name.trim(), p_delivery_address: deliveryAddress?.trim() || null });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Création du foyer impossible');
  return { id: row.id, name: row.name, role: 'admin', setup_completed: false, default_party_size: null, delivery_address: row.delivery_address ?? (deliveryAddress?.trim() || null) };
}

export async function joinHousehold(code: string): Promise<Household> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.rpc('join_household_by_code', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Code invalide ou expiré');
  return { id: row.id, name: row.name, role: 'member', setup_completed: true, default_party_size: null };
}

export async function createInvitation(householdId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.rpc('create_household_invitation', { p_household_id: householdId });
  if (error) throw error;
  return String(data);
}

export async function completeHouseholdSetup(householdId:string,displayName:string,defaultPartySize:number):Promise<void>{
  if(!supabase)throw new Error('Supabase non configuré');
  const {error}=await supabase.rpc('complete_household_setup',{p_household_id:householdId,p_display_name:displayName.trim(),p_default_party_size:defaultPartySize});
  if(error)throw error;
}


export async function completeHouseholdFamilySetup(householdId:string,payload:HouseholdFamilySetupPayload):Promise<void>{
  if(!supabase)throw new Error('Supabase non configuré');
  const {error}=await supabase.rpc('complete_household_family_setup_v2',{
    p_household_id:householdId,
    p_display_name:payload.displayName.trim(),
    p_salutation:payload.salutation,
    p_age:payload.age,
    p_phone_number:payload.phoneNumber?.trim()||null,
    p_relationship_status:payload.relationshipStatus,
    p_members:payload.members.map(member=>({relation:member.relation,relation_label:member.relationLabel,salutation:member.salutation,display_name:member.displayName,age:member.age,phone_number:member.phoneNumber})),
  });
  if(error)throw error;
}
