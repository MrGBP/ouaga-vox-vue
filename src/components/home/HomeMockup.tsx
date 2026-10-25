import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import HeroSearchSuggestions, { useHeroTypewriter } from '@/components/HeroSearchSuggestions';
import logo from '@/assets/sapsap-logo.png';
import livingRoom from '@/assets/home/reference-living-room.jpg';
import zoneDuBois from '@/assets/home/zone-du-bois.jpg';
import koulouba from '@/assets/home/koulouba.jpg';
import paspanga from '@/assets/home/paspanga.jpg';
import zogona from '@/assets/home/zogona.jpg';
import wayalghin from '@/assets/home/wayalghin.jpg';

const DESTINATIONS = [
  { name: 'Ouaga 2000', img: wayalghin },
  { name: 'Koulouba', img: koulouba },
  { name: 'Paspanga', img: paspanga },
  { name: 'Zogona', img: zogona },
  { name: 'Zone du Bois', img: zoneDuBois },
];
const PREVIEW_SLIDES = [
  { name: 'Ouaga 2000', image: livingRoom },
  { name: 'Zone du Bois', image: zoneDuBois },
  { name: 'Koulouba', image: koulouba },
  { name: 'Zogona', image: zogona },
];
type HomeProperty = { id: string; title: string; type: string; price: number; quartier: string; city?: string; furnished?: boolean; currency?: string; images?: string[] };

export default function HomeMockup({ properties = [], onOpenFilters }: { properties?: HomeProperty[]; onOpenFilters?: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [destinationIndex, setDestinationIndex] = useState(0);
  const placeholder = useHeroTypewriter(!focused && !query);
  const slides = PREVIEW_SLIDES;
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setSlideIndex(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides]);
  const current = slides[slideIndex % Math.max(1, slides.length)];
  const go = (value: string) => navigate(`/resultats?q=${encodeURIComponent(value.trim())}`);
  const destinations = [...DESTINATIONS.slice(destinationIndex), ...DESTINATIONS.slice(0, destinationIndex)];

  return (
    <div className="reference-home">
      <section className="reference-hero">
        <AnimatePresence initial={false}>
          <motion.img key={current.image} src={current.image} alt={`Inspiration meublée — ${current.name}`} className="reference-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} />
        </AnimatePresence>
        <div className="reference-fade" />
        <header className="reference-header">
          <Button variant="ghost" className="reference-brand" onClick={() => navigate('/')} aria-label="SapSapHouse — accueil">
            <img src={logo} alt="" />
            <span><strong>SapSap<span>House</span></strong><small>Mon bien Immo en un clic</small></span>
          </Button>
          <nav aria-label="Navigation principale">
            <Button variant="ghost" onClick={() => navigate('/publier')}>Devenir hôte</Button>
            <Button variant="ghost" onClick={() => go('')}>Nos logements</Button>
            <Button variant="ghost" asChild><a href="mailto:support@sapsaphouse.com">Aide</a></Button>
            <Button variant="outline" onClick={() => navigate('/auth')}>Se connecter</Button>
            <Button variant="secondary" onClick={() => navigate('/auth?mode=signup')}>S’inscrire <ArrowRight /></Button>
          </nav>
        </header>
        <div className="reference-copy">
          <h1>Réservez des<br /><span>logements meublés</span><br />partout au Burkina.</h1>
          <p>Maisons, studios, appartements meublés<br />pour vos courts comme longs séjours.</p>
          <span className="reference-copy-rule" />
        </div>
        {current && <div className="reference-carousel" aria-label="Inspirations de logements meublés">
          {[2, 3, 1].map((offset, index) => {
            const item = slides[(slideIndex + offset) % slides.length];
            return <img key={index} src={item.image} alt="Inspiration de logement meublé" className={`reference-fan fan-${index}`} />;
          })}
          <Button variant="ghost" onClick={() => go(current.name)} className="reference-main-slide">
            <img src={current.image} alt={`Inspiration meublée — ${current.name}`} />
            <span className="reference-slide-label"><MapPin /><span><strong>{current.name}</strong></span><span className="reference-round-arrow"><ArrowRight /></span></span>
          </Button>
          <div className="reference-slide-controls">
            <div className="reference-dots">{slides.map((item, index) => <Button key={`${item.name}-${index}`} variant="ghost" aria-label={`Inspiration ${index + 1}`} aria-pressed={slideIndex % slides.length === index} onClick={() => setSlideIndex(index)} className={slideIndex % slides.length === index ? 'is-selected' : ''} />)}</div>
            <Button variant="ghost" size="icon" aria-label="Inspiration suivante" onClick={() => setSlideIndex(i => (i + 1) % slides.length)}><ChevronRight /></Button>
          </div>
        </div>}
        <form className="reference-search" onSubmit={e => { e.preventDefault(); go(query); }}>
          <MapPin className="reference-search-pin" />
          <div className="reference-search-field">
            <label htmlFor="home-destination">Où souhaitez-vous séjourner ?</label>
            <input id="home-destination" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder || 'Ex. Ouaga 2000, Bobo-Dioulasso, Manga…'} autoComplete="off" />
          </div>
          <Button variant="ghost" size="icon" type="button" aria-label="Filtres" title="Filtres" onClick={onOpenFilters} className="reference-filter"><SlidersHorizontal /></Button>
          <Button variant="secondary" type="submit" size="icon" aria-label="Rechercher" className="reference-search-submit"><Search /></Button>
           <HeroSearchSuggestions furnishedOnly properties={properties} query={query} visible={focused && query.trim().length > 0} onPick={go} onSelectProperty={id => navigate(`/property/${id}`)} />
        </form>
      </section>
      <section className="reference-destinations" aria-label="Destinations au Burkina Faso">
        <div className="reference-destination-heading">
          <div><h2><ArrowRight /> Explorez <span>nos destinations</span></h2><p>Des quartiers vivants, des logements uniques, de nouvelles idées de séjour.</p></div>
          <Button variant="ghost" onClick={() => go('')}>Voir plus <span className="reference-round-arrow"><ArrowRight /></span></Button>
        </div>
        <div className="reference-destination-row">
          <Button variant="outline" size="icon" className="reference-destination-prev" aria-label="Destinations précédentes" onClick={() => setDestinationIndex(i => (i + 4) % 5)}><ChevronLeft /></Button>
          {destinations.map((destination, index) => <Button variant="ghost" key={destination.name} className={`reference-destination destination-${index}`} onClick={() => go(destination.name)}>
            <img src={destination.img} alt={`Inspiration — ${destination.name}`} />
            <span className="reference-destination-caption"><strong>{destination.name}</strong></span><span className="reference-destination-arrow"><ArrowRight /></span>
          </Button>)}
          <Button variant="outline" size="icon" className="reference-destination-next" aria-label="Destinations suivantes" onClick={() => setDestinationIndex(i => (i + 1) % 5)}><ChevronRight /></Button>
        </div>
      </section>
    </div>
  );
}
