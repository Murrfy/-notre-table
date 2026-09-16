import { supabase } from '../lib/supabase';
import { Household } from '../types';

export async function getMyHousehold(): Promise<Household | null> {
  if (!supabase) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('household_members')
    .select('role, households(id, name)')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const householdRaw = Array.isArray(data.households) ? data.households[0] : data.households;
  const household = householdRaw as { id: string; name: string } | null;
  if (!household) return null;

  return { id: household.id, name: household.name, role: data.role as 'admin' | 'member' };
}

export async function createHousehold(name: string): Promise<Household> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.rpc('create_household', { p_name: name.trim() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Création du foyer impossible');
  return { id: row.id, name: row.name, role: 'admin' };
}

export async function joinHousehold(code: string): Promise<Household> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.rpc('join_household_by_code', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Code invalide ou expiré');
  return { id: row.id, name: row.name, role: 'member' };
}

export async function createInvitation(householdId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.rpc('create_household_invitation', { p_household_id: householdId });
  if (error) throw error;
  return String(data);
}
