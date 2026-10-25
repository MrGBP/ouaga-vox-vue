import { forwardRef } from 'react';
import { Heart } from 'lucide-react';
import { getTypeLabel, type Property } from '@/lib/mockData';
import { displayPrice } from './ListingMap';

interface Props {
  property: Property;
  active: boolean;
  favorite: boolean;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const ListingCard = forwardRef<HTMLDivElement, Props>(({ property: p, active, favorite, onHover, onOpen, onToggleFavorite }, ref) => {
  const { value, mode } = displayPrice(p);
  return (
    <div
      ref={ref}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onOpen(p.id)}
      className={`flex gap-4 p-3 rounded-2xl bg-card border cursor-pointer transition-all ${active ? 'border-secondary shadow-elevation-2' : 'border-border hover:shadow-elevation-1'}`}
    >
      <div className="relative w-44 xl:w-52 shrink-0 aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0 flex flex-col py-1">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-[15px] font-semibold text-foreground leading-snug line-clamp-2">{p.title}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(p.id); }}
            aria-label="Coup de cœur"
            className="h-8 w-8 -mt-1 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <Heart className={`h-[18px] w-[18px] ${favorite ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{p.quartier}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-[11px] text-muted-foreground">{getTypeLabel(p.type)}</span>
          <span className="text-base font-bold text-secondary">
            {new Intl.NumberFormat('fr-FR').format(value)} FCFA<span className="text-xs font-medium text-muted-foreground"> / {mode}</span>
          </span>
        </div>
      </div>
    </div>
  );
});
ListingCard.displayName = 'ListingCard';
export default ListingCard;
