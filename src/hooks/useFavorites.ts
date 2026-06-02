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

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(async (id: string) => {
    // Require auth before adding a favorite (free navigation, gated action).
    if (!user) {
      requireAuth('ajouter ce bien à vos favoris', () => {
        // After login, perform the add.
        setIds(prev => prev.includes(id) ? prev : [...prev, id]);
        addFavorite(id).catch(() => setIds(prev => prev.filter(x => x !== id)));
      });
      return;
    }
    const was = ids.includes(id);
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
