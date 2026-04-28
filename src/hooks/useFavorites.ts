import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addFavorite, listFavoriteIds, removeFavorite, syncLocalFavoritesToCloud } from '@/lib/favoritesService';

export function useFavorites() {
  const { user } = useAuth();
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
    const was = ids.includes(id);
    // optimistic
    setIds(prev => was ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      if (was) await removeFavorite(id); else await addFavorite(id);
    } catch {
      // revert
      setIds(prev => was ? [...prev, id] : prev.filter(x => x !== id));
    }
  }, [ids]);

  return { ids, isFavorite, toggle, loading, refresh };
}
