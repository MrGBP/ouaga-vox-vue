import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Live owner counters, with a reconnect/focus fallback. */
export function useOwnerActivity(userId?: string) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setRevision(n => n + 1), 150);
    };
    const channel = supabase.channel(`owner-activity-${userId}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties', filter: `owner_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, refresh)
      .subscribe();
    window.addEventListener('focus', refresh);
    const poll = setInterval(refresh, 60000);
    return () => { clearTimeout(timer); clearInterval(poll); window.removeEventListener('focus', refresh); void supabase.removeChannel(channel); };
  }, [userId]);
  return revision;
}