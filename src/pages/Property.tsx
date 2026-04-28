import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Heart, Share2 } from 'lucide-react';
import { mockProperties, mockPois, isTypeFurnished, pricePerNight } from '@/lib/mockData';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import { addToRecentlyViewed } from '@/components/RecentlyViewed';
import { useToast } from '@/hooks/use-toast';

const FAVORITES_KEY = 'sapsap_favorites';

const PropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const properties = mockProperties as any[];
  const pois = mockPois as any[];
  const property = useMemo(() => properties.find(p => p.id === id) || null, [properties, id]);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem(FAVORITES_KEY); return saved ? new Set(JSON.parse(saved)) : new Set<string>(); } catch { return new Set<string>(); }
  });

  useEffect(() => {
    if (property) addToRecentlyViewed(property);
  }, [property]);

  useEffect(() => {
    // Lock body scroll like a true page (the inner container will scroll)
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
    // Open home with the map tab focused on this property + radius + POI (handled by Index.tsx URL sync)
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

  if (!property) {
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

  const similar = (properties as any[])
    .filter(p => p.id !== property.id && (p.quartier === property.quartier || p.type === property.type))
    .filter(p => p.status !== 'rented' && p.available !== false)
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      {/* Top bar — only Back, no duplicate title */}
      <header
        className="shrink-0 flex items-center justify-between px-3 border-b border-border bg-card/95 backdrop-blur-md"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(52px + env(safe-area-inset-top))',
        }}
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

      {/* Scrollable full-page content */}
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
