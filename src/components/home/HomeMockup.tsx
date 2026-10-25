import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeoCity } from '@/hooks/useGeoCity';
import HeroSearchSuggestions, { useHeroTypewriter } from '@/components/HeroSearchSuggestions';
import { getTypeLabel, pricePerNight } from '@/lib/mockData';
import logo from '@/assets/sapsap-logo.png';
import heroFallback from '@/assets/home/hero-fallback.jpg';
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
const VARIATIONS = ['var-a', 'var-b', 'var-c', 'var-d', 'var-e'];

type HomeProperty = { id: string; title: string; type: string; price: number; quartier: string; city?: string; furnished?: boolean; currency?: string; images?: string[] };
type Slide = { id?: string; name: string; image: string; type?: string; price?: number };

const FALLBACK_SLIDES: Slide[] = [
  { name: 'Ouaga 2000', image: heroFallback, type: 'Maison meublée' },
  { name: 'Zone du Bois', image: zoneDuBois },
  { name: 'Koulouba', image: koulouba },
  { name: 'Zogona', image: zogona },
];

/** Même photo Unsplash en haute résolution pour l'arrière-plan du Hero. */
const hiRes = (url: string) => (url.includes('images.unsplash.com') ? url.replace(/([?&])w=\d+/, '$1w=1920') : url);
const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

export default function HomeMockup({ properties = [], onOpenFilters }: { properties?: HomeProperty[]; onOpenFilters?: () => void }) {
  const navigate = useNavigate();
  const { activeCity, availableCities, setActiveCity } = useGeoCity();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeholder = useHeroTypewriter(!focused && !query);

  // Carrousel : vrais biens meublés du catalogue (photos existantes), sinon visuels de référence.
  const slides = useMemo<Slide[]>(() => {
    const fromData = properties
      .filter(p => (p.furnished || p.type.includes('meubl')) && p.images?.[0])
      .slice(0, 5)
      .map(p => ({ id: p.id, name: p.quartier, image: p.images![0], type: p.type, price: p.price }));
    return fromData.length >= 3 ? fromData : FALLBACK_SLIDES;
  }, [properties]);

  const count = slides.length;
  const current = slides[slideIndex % count];

  const pauseBriefly = () => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 12000);
  };
  const goTo = (i: number) => { setSlideIndex(((i % count) + count) % count); pauseBriefly(); };

  // Rotation automatique toutes les 5 s — index partagé entre le carrousel et l'arrière-plan.
  useEffect(() => {
    if (paused || count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setSlideIndex(i => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [paused, count]);
  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current); }, []);

  const go = (value: string) => navigate(`/resultats?q=${encodeURIComponent(value.trim())}`);
  const backdrop = current ? hiRes(current.image) : heroFallback;

  return (
    <div className="reference-home">
      <section className="reference-hero">
        <div className="reference-backdrop" aria-hidden>
          <AnimatePresence mode="sync">
            <motion.img
              key={backdrop}
              src={backdrop}
              alt=""
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              fetchPriority="high"
            />
          </AnimatePresence>
        </div>
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
        {current && (
          <div
            className="reference-carousel"
            aria-label="Inspirations de logements meublés"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {[3, 2, 1].map((offset, index) => {
              const item = slides[(slideIndex + offset) % count];
              return <img key={`${item.image}-${offset}`} src={item.image} alt="" loading="lazy" className={`reference-fan fan-${index}`} />;
            })}
            <button
              type="button"
              onClick={() => (current.id ? navigate(`/property/${current.id}`) : go(current.name))}
              className="reference-main-slide"
              aria-label={`Voir ${current.name}`}
            >
              <AnimatePresence mode="sync">
                <motion.img
                  key={current.image}
                  src={current.image}
                  alt={`Logement meublé — ${current.name}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </AnimatePresence>
              <span className="reference-slide-label">
                <MapPin />
                <span>
                  <strong>{current.name}</strong>
                  <small>
                    {current.type ? getTypeLabel(current.type) : 'Logement meublé'}
                    {current.price ? ` · ${fmt(pricePerNight(current.price))} F/nuit` : ''}
                  </small>
                </span>
                <span className="reference-round-arrow"><ArrowRight /></span>
              </span>
            </button>
            <div className="reference-slide-controls">
              <Button variant="ghost" size="icon" aria-label="Logement précédent" onClick={() => goTo(slideIndex - 1)}><ChevronLeft /></Button>
              <div className="reference-dots">
                {slides.map((item, index) => (
                  <button
                    key={`${item.name}-${index}`}
                    type="button"
                    aria-label={`Inspiration ${index + 1}`}
                    aria-pressed={slideIndex % count === index}
                    onClick={() => goTo(index)}
                    className={slideIndex % count === index ? 'is-selected' : ''}
                  />
                ))}
              </div>
              <Button variant="ghost" size="icon" aria-label="Logement suivant" onClick={() => goTo(slideIndex + 1)}><ChevronRight /></Button>
            </div>
          </div>
        )}
        <form className="reference-search" onSubmit={e => { e.preventDefault(); go(query); }}>
          <MapPin className="reference-search-pin" />
          <div className="reference-search-field">
            <label htmlFor="home-destination">Où souhaitez-vous séjourner ?</label>
            <input id="home-destination" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder || 'Ex. Ouaga 2000, Zone du Bois, Koulouba…'} autoComplete="off" />
          </div>
          <Button variant="ghost" size="icon" type="button" aria-label="Filtres" title="Filtres" onClick={onOpenFilters} className="reference-filter"><SlidersHorizontal /></Button>
          <Button variant="secondary" type="submit" size="icon" aria-label="Rechercher" className="reference-search-submit"><Search /></Button>
          <HeroSearchSuggestions properties={properties} query={query} visible={focused && query.trim().length > 0} onPick={go} onSelectProperty={id => navigate(`/property/${id}`)} />
        </form>
      </section>
      <section className="reference-destinations" aria-label="Découverte des logements meublés">
        <div className="reference-destination-heading">
          <div>
            <h2>Et si vous changiez de décor ?</h2>
            <p>Des logements meublés pour souffler, vous retrouver ou vivre autrement, le temps qu'il vous faut.</p>
          </div>
          <button type="button" className="reference-discover-link" onClick={() => go('')}>
            Découvrir les lieux <span className="reference-round-arrow"><ArrowRight /></span>
          </button>
        </div>
        <div className="reference-city-switch" aria-label="Ville de séjour">
          {availableCities.map(city => <Button key={city.id} size="sm" variant={activeCity.id === city.id ? 'secondary' : 'ghost'} aria-pressed={activeCity.id === city.id} onClick={() => { setActiveCity(city.id); setSlideIndex(0); }}><MapPin />{city.name}</Button>)}
        </div>
        {activeCity.id === 'ouagadougou' ? (
          <div className="reference-destination-grid">
            {DESTINATIONS.map((destination, index) => (
              <button type="button" key={destination.name} className={`reference-destination ${VARIATIONS[index]}`} onClick={() => go(destination.name)}>
                <img src={destination.img} alt={`Logements meublés — ${destination.name}`} loading="lazy" />
                <span className="reference-destination-caption"><strong>{destination.name}</strong><span>Ouagadougou</span></span>
                <span className="reference-destination-arrow"><ArrowRight /></span>
              </button>
            ))}
            <button type="button" className="reference-destination var-f reference-destination-cta" onClick={() => go('')}>
              <span className="cta-text"><strong>Tous les logements meublés</strong><small>Parcourez le catalogue complet</small></span>
              <span className="reference-round-arrow"><ArrowRight /></span>
            </button>
          </div>
        ) : (
          <div className="reference-other-city">
            <h3>{activeCity.name}</h3>
            <Button variant="outline" onClick={() => go(activeCity.name)}>Voir les logements <ArrowRight /></Button>
          </div>
        )}
      </section>
    </div>
  );
}
