import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addFavorite, listFavoriteIds, removeFavorite, syncLocalFavoritesToCloud } from '@/lib/favoritesService';
import { track } from '@/lib/analytics';

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
      if (user) await syncLocalFavoritesToCloud();
      if (!cancelled) await refresh();
    })();
    return () => { cancelled = true; };
  }, [user, refresh]);

  // Synchronise les favoris invités modifiés depuis d'autres pages / onglets.
  useEffect(() => {
    if (user) return;
    const onSync = () => { listFavoriteIds().then(setIds).catch(() => {}); };
    window.addEventListener('storage', onSync);
    return () => window.removeEventListener('storage', onSync);
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
      // revert
      setIds(prev => was ? [...prev, id] : prev.filter(x => x !== id));
    }
  }, [ids, user, requireAuth]);

  return { ids, isFavorite, toggle, loading, refresh };
}
