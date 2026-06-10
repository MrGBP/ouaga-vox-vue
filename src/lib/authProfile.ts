import { supabase } from '@/integrations/supabase/client';

export async function ensureSignedInProfile(fullName?: string | null, phone?: string | null) {
  const { error } = await supabase.rpc('ensure_user_profile', {
    _full_name: fullName ?? null,
    _phone: phone ?? null,
  });
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