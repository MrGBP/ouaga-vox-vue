import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroSearchSuggestions, { useHeroTypewriter } from '@/components/HeroSearchSuggestions';
import livingRoom from '@/assets/home/reference-living-room.jpg';
import wayalghin from '@/assets/home/wayalghin.jpg';
import koulouba from '@/assets/home/koulouba.jpg';
import paspanga from '@/assets/home/paspanga.jpg';
import zogona from '@/assets/home/zogona.jpg';
import zoneDuBois from '@/assets/home/zone-du-bois.jpg';
import './MobileHomeIntro.css';

const destinations = [
  { name: 'Ouaga 2000', image: wayalghin },
  { name: 'Koulouba', image: koulouba },
  { name: 'Zogona', image: zogona },
  { name: 'Paspanga', image: paspanga },
  { name: 'Zone du Bois', image: zoneDuBois },
];

type SuggestionProperty = { id: string; title: string; type: string; price: number; quartier: string; furnished?: boolean };

export default function MobileHomeIntro({ properties, initialQuery, filtersActive, onOpenAI }: {
  properties: SuggestionProperty[];
  initialQuery: string;
  filtersActive: boolean;
  onOpenAI: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const placeholder = useHeroTypewriter(!focused && !query);
  const search = (value: string) => navigate(`/resultats?q=${encodeURIComponent(value.trim())}`);

  return <div className="mobile-home-intro">
    <section className="mobile-home-hero">
      <img src={livingRoom} alt="" className="mobile-home-backdrop" fetchPriority="high" />
      <div className="mobile-home-wash" />
      <div className="mobile-home-copy">
        <h1>Réservez des<br /><span>logements meublés</span><br />partout au Burkina.</h1>
        <p>Maisons, studios, appartements meublés pour vos courts comme longs séjours.</p>
        <span className="mobile-home-rule" />
      </div>
      <form className="mobile-home-search" onSubmit={e => { e.preventDefault(); search(query); }}>
        <MapPin className="mobile-home-search-pin" />
        <div className="mobile-home-search-field">
          <label htmlFor="mobile-home-destination">Où souhaitez-vous séjourner ?</label>
          <input id="mobile-home-destination" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder || 'Quartier, studio, villa meublée…'} autoComplete="off" />
        </div>
        <Button variant="ghost" type="button" size="icon" className="mobile-home-tool" aria-label="SapSap AI" title="SapSap AI" onClick={onOpenAI}><Sparkles /></Button>
        <Button variant="ghost" type="button" size="icon" className="mobile-home-tool relative" aria-label="Filtres" title="Filtres" onClick={() => { sessionStorage.setItem('sapsap_results_filters', '1'); search(query); }}>
          <SlidersHorizontal />
          {filtersActive && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-secondary" />}
        </Button>
        <Button variant="secondary" type="submit" size="icon" className="mobile-home-submit" aria-label="Rechercher"><Search /></Button>
        <HeroSearchSuggestions properties={properties} query={query} furnishedOnly visible={focused && query.trim().length > 0} onPick={search} onSelectProperty={id => navigate(`/property/${id}`)} />
      </form>
      <div className="mobile-home-photo-space" />
      <div className="mobile-home-wave" />
    </section>
    <section id="quartiers" className="mobile-home-destinations" aria-label="Explorez nos demeures">
      <div className="mobile-home-destination-heading">
        <div><h2>Et si vous <span>changiez de décor ?</span></h2><p>Une demeure meublée pour souffler, vous retrouver, ou simplement vous sentir chez vous.</p></div>
        <Button variant="ghost" size="icon" className="mobile-home-destination-more" aria-label="Explorer nos demeures" title="Explorer nos demeures" onClick={() => search('')}><ArrowRight /></Button>
      </div>
      <div className="mobile-home-destination-track scrollable">
        {destinations.map(destination => <Button variant="ghost" key={destination.name} className="mobile-home-destination" onClick={() => search(destination.name)} aria-label={`Explorer ${destination.name}`}>
          <img src={destination.image} alt={`Inspiration de séjour — ${destination.name}`} loading="lazy" />
          <span className="mobile-home-destination-label"><MapPin /><span>{destination.name}</span><ArrowRight /></span>
        </Button>)}
      </div>
    </section>
  </div>;
}