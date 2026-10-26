import { supabase } from '@/integrations/supabase/client';

const pending = new Set<string>();
export async function recordPropertyView(id: string) {
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return;
  const key = `sapsap_viewed_${id}`;
  try { if (sessionStorage.getItem(key)) return; } catch { /* storage optional */ }
  if (pending.has(id)) return;
  pending.add(id);
  try {
    const { error } = await supabase.rpc('increment_property_view', { _property_id: id });
    if (error) throw error;
    try { sessionStorage.setItem(key, '1'); } catch { /* storage optional */ }
  } catch { /* Allow retry on the next actual detail visit. */ }
  finally { pending.delete(id); }
}