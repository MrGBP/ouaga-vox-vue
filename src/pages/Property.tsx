import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, Heart, Share2, MapPin, Bed, Bath, Maximize, ShieldCheck, Star } from 'lucide-react';
import { mockProperties, mockPois, getTypeLabel } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import PropertyHeroMosaic from '@/components/PropertyHeroMosaic';
import StickyReservationCard from '@/components/StickyReservationCard';
import { addToRecentlyViewed } from '@/components/RecentlyViewed';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const FAVORITES_KEY = 'sapsap_favorites';

// Reuse the row→Property mapper logic (kept minimal & local to avoid circular deps)
const FEATURE_KEYS = [
  'has_ac','has_guardian','has_generator','has_garden','has_water','has_internet',
  'has_kitchen','has_fridge','has_stove','has_tv','has_terrace','has_pool',
  'has_parking_int','has_parking_ext','has_fence','has_auto_gate','has_cameras',
  'has_paved_road','has_pmr','has_water_tower','is_new_build','is_renovated','pets_allowed',
] as const;

function rowToProperty(row: any): any {
  const features = row.features ?? {};
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    type: row.type,
    price: Number(row.price),
    quartier: row.quartier,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    surface_area: row.surface_area ?? undefined,
    comfort_rating: row.comfort_rating ?? undefined,
    security_rating: row.security_rating ?? undefined,
    accessibility_rating: row.accessibility_rating ?? undefined,
    images: row.images ?? [],
    available: row.available ?? true,
    virtual_tour_url: row.virtual_tour_url ?? undefined,
    video_url: row.video_url ?? undefined,
    has_video: !!row.video_url,
    year_built: row.year_built ?? undefined,
    furnished: row.furnished ?? false,
    status: row.status ?? 'available',
    agent_name: row.agent_name ?? undefined,
    agent_phone: row.agent_phone ?? undefined,
    whatsapp_phone: row.whatsapp_phone ?? undefined,
    agent_photo: row.agent_photo ?? undefined,
    created_at: row.created_at,
    country_code: row.country_code ?? undefined,
    country: row.country_code ?? undefined,
    city: row.city ?? undefined,
    features,
    ...Object.fromEntries(FEATURE_KEYS.map(k => [k, !!features[k]])),
  };
}

const PropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const pois = mockPois as any[];

  // 1) Cache local (mocks)
  const fromCache = useMemo(
    () => (mockProperties as any[]).find(p => p.id === id) || null,
    [id]
  );

  const [remote, setRemote] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(!fromCache);
  const [notFound, setNotFound] = useState(false);

  // 2) Fallback Supabase si non trouvé dans les mocks
  useEffect(() => {
    let alive = true;
    if (!id) { setNotFound(true); setLoading(false); return; }
    if (fromCache) { setLoading(false); return; }

    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!alive) return;
        if (error || !data) { setNotFound(true); }
        else { setRemote(rowToProperty(data)); }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, fromCache]);

  const property = fromCache ?? remote;

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem(FAVORITES_KEY); return saved ? new Set(JSON.parse(saved)) : new Set<string>(); } catch { return new Set<string>(); }
  });

  useEffect(() => {
    if (!property) return;
    addToRecentlyViewed(property);
    try {
      const key = `sapsap_viewed_${property.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        supabase.rpc('increment_property_view', { _property_id: property.id });
      }
    } catch {}
  }, [property]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const toggleFavorite = (pid: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(pid)) { next.delete(pid); toast({ title: '💔 Retiré des favoris' }); }
      else { next.add(pid); toast({ title: '❤️ Ajouté aux favoris' }); }
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const goToMapWithFocus = (pid: string) => {
    // Pose les flags AVANT la navigation pour que MobileApp les lise à son
    // useEffect de montage (sinon ils sont posés trop tard par Index.tsx et
    // l'utilisateur voit brièvement l'accueil avant la carte).
    try {
      sessionStorage.setItem('sapsap_force_tab', 'map');
      sessionStorage.setItem('sapsap_focus_property', pid);
    } catch { /* noop */ }
    navigate(`/?property=${encodeURIComponent(pid)}&exploreMap=1`);
  };

  const handleShare = async () => {
    if (!property) return;
    const url = window.location.href;
    const text = `🏠 ${property.title} — ${property.quartier}`;
    if (navigator.share) {
      try { await navigator.share({ title: property.title, text, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); toast({ title: '🔗 Lien copié' }); } catch {}
  };

  // ── Loading skeleton (jamais d'écran "introuvable" tant qu'on charge) ──
  if (loading && !property) {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col">
        <header className="shrink-0 flex items-center px-3 border-b border-border bg-card/95"
          style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(52px + env(safe-area-inset-top))' }}>
          <button onClick={handleBack} className="inline-flex items-center gap-1 h-10 pl-2 pr-3 rounded-full">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Retour</span>
          </button>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" />
          </div>
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    );
  }

  // ── Vraiment introuvable (après fetch terminé) ──
  if (!property || notFound) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">Bien introuvable.</p>
        <button onClick={() => navigate('/')} className="h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const isFav = favorites.has(property.id);

  // Similaires : on combine mocks + remote courant
  const pool = (mockProperties as any[]);
  const similar = pool
    .filter(p => p.id !== property.id && (p.quartier === property.quartier || p.type === property.type))
    .filter(p => p.status !== 'rented' && p.available !== false)
    .slice(0, 6);

  // ── SEO / Open Graph dynamiques par bien ──
  const canonicalUrl = `https://sapsaphouse.com/bien/${property.id}`;
  const ogImage = (property.images && property.images[0])
    || 'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/10261af2-3c8c-444e-b63b-bc7bf1db04b6/id-preview-1dd43985--2e44563b-3bfb-4360-8050-50bec092d760.lovable.app-1773369724341.png';
  const priceText = property.price ? new Intl.NumberFormat('fr-FR').format(property.price) : '';
  const ogTitle = `${property.title} · SapSapHouse`;
  const ogDescription = [
    property.quartier,
    property.bedrooms ? `${property.bedrooms} chambre(s)` : null,
    priceText ? `${priceText} FCFA` : null,
  ].filter(Boolean).join(' · ').slice(0, 200);

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Accommodation',
          name: property.title,
          description: ogDescription,
          image: ogImage,
          url: canonicalUrl,
          address: { '@type': 'PostalAddress', addressLocality: property.quartier, addressCountry: property.country || 'BF' },
          numberOfRooms: property.bedrooms ?? undefined,
          floorSize: property.surface_area ? { '@type': 'QuantitativeValue', value: property.surface_area, unitCode: 'MTK' } : undefined,
        })}</script>
      </Helmet>
      <header
        className="shrink-0 flex items-center justify-between px-3 border-b border-border bg-card/95 backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(52px + env(safe-area-inset-top))' }}
      >
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 h-10 pl-2 pr-3 rounded-full text-foreground active:scale-[0.97] transition-transform"
          aria-label="Retour"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFavorite(property.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-[0.95] transition-all ${isFav ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center active:scale-[0.95] transition-all"
            aria-label="Partager"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto bg-background">
        <PropertyDetailPanel
          property={property as any}
          onClose={handleBack}
          pois={pois as any}
          isFavorite={isFav}
          onToggleFavorite={toggleFavorite}
          similarProperties={similar as any}
          onSelectProperty={(pid) => navigate(`/property/${pid}`)}
          onExploreOnMap={(pid) => goToMapWithFocus(pid)}
          isMobileOverride={false}
        />
      </main>
    </div>
  );
};

export default PropertyPage;
