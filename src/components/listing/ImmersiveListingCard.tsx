import { forwardRef } from 'react';
import { Heart, MapPin, Map as MapIcon, Eye, BedDouble, Snowflake, Wifi, Zap, Car, Waves, Maximize } from 'lucide-react';
import { cardHighlights } from '@/lib/cardHighlights';
import { getTypeLabel, type Property } from '@/lib/mockData';
import { displayPrice } from './ListingMap';

const ICONS: Record<string, typeof BedDouble> = { bedrooms: BedDouble, ac: Snowflake, wifi: Wifi, generator: Zap, parking: Car, pool: Waves, surface: Maximize };

interface Props {
  property: Property;
  favorite: boolean;
  active?: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onShowOnMap?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

/** Vignette immersive (maquette B, paysage) : photo plein cadre, bandeau dépoli en bas sur toute la largeur. */
const ImmersiveListingCard = forwardRef<HTMLDivElement, Props>(({ property: p, favorite, active, onOpen, onToggleFavorite, onShowOnMap, onHover }, ref) => {
  const { value, mode } = displayPrice(p);
  const specs = cardHighlights(p);
  return (
    <div
      ref={ref}
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onOpen(p.id)}
      className={`group relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-2xl bg-muted cursor-pointer shadow-elevation-1 transition-all ${active ? 'ring-2 ring-secondary shadow-elevation-3' : 'hover:shadow-elevation-2'}`}
    >
      <img src={p.images?.[0] || '/placeholder-property.svg'} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />

      <span className="absolute top-3 left-3 rounded-full bg-foreground/35 backdrop-blur-md border border-primary-foreground/20 px-3.5 py-1.5 text-sm font-bold text-primary-foreground">
        {new Intl.NumberFormat('fr-FR').format(value)} {p.currency || 'FCFA'}<span className="font-medium opacity-80"> / {mode}</span>
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(p.id); }}
        aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={favorite}
        className="absolute top-3 right-3 h-10 w-10 rounded-full bg-foreground/35 backdrop-blur-md border border-primary-foreground/20 flex items-center justify-center active:scale-90 transition-transform"
      >
        <Heart className={`h-5 w-5 ${favorite ? 'fill-secondary text-secondary' : 'text-primary-foreground'}`} />
      </button>

      {/* Bandeau dépoli pleine largeur */}
      <div className="absolute inset-x-0 bottom-0 pt-10 text-primary-foreground">
        <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-t from-primary/95 via-primary/70 to-transparent [mask-image:linear-gradient(to_top,black_65%,transparent)]" />
        <div className="relative px-4 pb-3.5 sm:px-5 sm:pb-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold leading-tight line-clamp-1">{p.title}</h3>
            <span className="shrink-0 text-[11px] uppercase tracking-wide opacity-80">{getTypeLabel(p.type)}</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm opacity-90"><MapPin className="h-3.5 w-3.5" />{p.quartier}</p>
          {specs.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
              {specs.map(s => { const I = ICONS[s.key] || Maximize; return <li key={s.key} className="flex items-center gap-1.5"><I className="h-4 w-4 opacity-90" strokeWidth={1.6} />{s.label}</li>; })}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            {onShowOnMap && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowOnMap(p.id); }}
                aria-label="Voir sur la carte"
                className="h-10 px-3.5 rounded-full bg-primary-foreground/15 backdrop-blur-md border border-primary-foreground/30 flex items-center gap-1.5 text-sm font-medium active:scale-95 transition-transform"
              >
                <MapIcon className="h-4 w-4" /> Carte
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(p.id); }}
              className="h-10 flex-1 rounded-full bg-card text-primary font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Eye className="h-4 w-4" /> Voir le bien
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
ImmersiveListingCard.displayName = 'ImmersiveListingCard';
export default ImmersiveListingCard;
