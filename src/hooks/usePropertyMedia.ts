import { useEffect, useState, useCallback } from 'react';
import { listPropertyMedia } from '@/lib/propertiesService';

export type MediaKind = 'image' | 'video' | 'video_360';

export interface UnifiedMedia {
  id: string;
  kind: MediaKind;
  url: string;
  source: 'supabase' | 'legacy';
}

interface LegacyShape {
  images?: string[];
  video_url?: string | null;
  virtual_tour_url?: string | null;
}

/**
 * Charge les médias depuis property_media (Supabase) avec fallback automatique
 * sur les anciens champs (images[], video_url, virtual_tour_url) si vide.
 */
export function usePropertyMedia(propertyId: string | undefined, legacy?: LegacyShape) {
  const [items, setItems] = useState<UnifiedMedia[]>([]);
  const [loading, setLoading] = useState(false);

  const buildLegacy = useCallback((): UnifiedMedia[] => {
    const out: UnifiedMedia[] = [];
    legacy?.images?.forEach((url, i) =>
      out.push({ id: `legacy-img-${i}`, kind: 'image', url, source: 'legacy' })
    );
    if (legacy?.video_url) {
      out.push({ id: 'legacy-video', kind: 'video', url: legacy.video_url, source: 'legacy' });
    }
    if (legacy?.virtual_tour_url) {
      out.push({ id: 'legacy-360', kind: 'video_360', url: legacy.virtual_tour_url, source: 'legacy' });
    }
    return out;
  }, [legacy?.images, legacy?.video_url, legacy?.virtual_tour_url]);

  const reload = useCallback(async () => {
    if (!propertyId) {
      setItems(buildLegacy());
      return;
    }
    setLoading(true);
    try {
      const rows = await listPropertyMedia(propertyId);
      const mapped: UnifiedMedia[] = (rows ?? []).map((r: any) => ({
        id: r.id,
        kind: r.kind as MediaKind,
        url: r.url,
        source: 'supabase',
      }));
      setItems(mapped.length > 0 ? mapped : buildLegacy());
    } catch {
      setItems(buildLegacy());
    } finally {
      setLoading(false);
    }
  }, [propertyId, buildLegacy]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}
