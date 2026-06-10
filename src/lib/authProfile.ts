import { supabase } from '@/integrations/supabase/client';

export async function ensureSignedInProfile(fullName?: string | null, phone?: string | null) {
  const args: { _full_name?: string; _phone?: string } = {};
  if (fullName) args._full_name = fullName;
  if (phone) args._phone = phone;
  const { error } = await supabase.rpc('ensure_user_profile', args);
  if (error) throw error;
}

export async function activateOwnerRole() {
  const { error } = await supabase.rpc('activate_owner_role');
  if (error) throw error;
  window.dispatchEvent(new Event('sapsap_roles_changed'));
}

export async function finalizeSignupProfile(input: { fullName?: string | null; phone?: string | null; asOwner?: boolean }) {
  await ensureSignedInProfile(input.fullName, input.phone);
  if (input.asOwner) await activateOwnerRole();
  if (input.asOwner) localStorage.removeItem('sapsap_pending_owner_role');
}

export async function finalizePendingOwnerRole() {
  if (localStorage.getItem('sapsap_pending_owner_role') !== '1') return false;
  await activateOwnerRole();
  localStorage.removeItem('sapsap_pending_owner_role');
  return true;
}