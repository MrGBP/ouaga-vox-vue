import { Heart, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTypeLabel, type Property } from '@/lib/mockData';
import { displayPrice } from './ListingMap';

interface Props {
  property: Property;
  favorite: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function MobileDiscoveryCard({ property, favorite, onOpen, onToggleFavorite }: Props) {
  const { value, mode } = displayPrice(property);
  return (
    <article className="relative flex gap-3 border-b border-border py-4 bg-card">
      <Button variant="ghost" className="h-28 w-28 shrink-0 overflow-hidden rounded-lg p-0" onClick={() => onOpen(property.id)} aria-label={`Voir ${property.title}`}>
        <img src={property.images?.[0] || '/placeholder-property.svg'} alt={property.title} loading="lazy" className="h-full w-full object-cover" />
      </Button>
      <div className="min-w-0 flex-1 flex flex-col justify-center pr-8">
        <p className="text-[11px] text-muted-foreground truncate">{getTypeLabel(property.type)} · {property.quartier}</p>
        <Button variant="ghost" onClick={() => onOpen(property.id)} className="h-auto p-0 justify-start whitespace-normal text-left text-sm font-semibold text-foreground hover:bg-transparent">
          <span className="line-clamp-2">{property.title}</span>
        </Button>
        <p className="mt-2 text-sm font-bold text-primary">{new Intl.NumberFormat('fr-FR').format(value)} {property.currency || 'FCFA'}<span className="text-[11px] font-normal text-muted-foreground"> /{mode}</span></p>
        <Button variant="ghost" onClick={() => onOpen(property.id)} className="h-7 w-fit px-0 text-xs text-muted-foreground">Voir le bien <ArrowUpRight className="ml-1 h-3 w-3" /></Button>
      </div>
      <Button variant="ghost" size="icon" className="absolute right-0 top-3 h-9 w-9 rounded-full" onClick={() => onToggleFavorite(property.id)} aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={favorite}>
        <Heart className={`h-4 w-4 ${favorite ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`} />
      </Button>
    </article>
  );
}