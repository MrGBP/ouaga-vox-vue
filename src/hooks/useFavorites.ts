import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addFavorite, listFavoriteIds, removeFavorite, syncLocalFavoritesToCloud } from '@/lib/favoritesService';
import { track } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFavorites() {
  const { user, requireAuth } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listFavoriteIds();
      setIds(list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user) await syncLocalFavoritesToCloud().catch(() => toast.error('Vos favoris sont conservés sur cet appareil ; la synchronisation sera réessayée.'));
      if (!cancelled) await refresh();
    })();
    return () => { cancelled = true; };
  }, [user, refresh]);

  // Synchronise les favoris invités modifiés depuis d'autres pages / onglets.
  useEffect(() => {
    const onSync = () => { listFavoriteIds().then(setIds).catch(() => {}); };
    window.addEventListener('storage', onSync);
    window.addEventListener('sapsap-favorites-changed', onSync);
    const channel = user ? supabase.channel(`favorites-${user.id}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${user.id}` }, onSync).subscribe() : null;
    return () => { window.removeEventListener('storage', onSync); window.removeEventListener('sapsap-favorites-changed', onSync); if (channel) void supabase.removeChannel(channel); };
  }, [user]);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(async (id: string) => {
    // Favori en 1 clic, même sans compte (stocké localement, fusionné à la connexion).
    void requireAuth;
    const was = ids.includes(id);
    track(was ? 'favorite_removed' : 'favorite_added', { property_id: id });
    // optimistic
    setIds(prev => was ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      if (was) await removeFavorite(id); else await addFavorite(id);
    } catch {
      toast.error('Impossible de mettre à jour ce favori. Réessayez.');
      // revert
      setIds(prev => was ? [...prev, id] : prev.filter(x => x !== id));
    }
  }, [ids, user, requireAuth]);

  return { ids, isFavorite, toggle, loading, refresh };
}
