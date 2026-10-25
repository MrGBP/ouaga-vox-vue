import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, ArrowRight, Star, ChevronRight } from 'lucide-react';
import { isTypeFurnished, getTypeLabel, type Property } from '@/lib/mockData';
import fallbackImg from '@/assets/hero-quartier-africain.jpg';

interface Props {
  properties: Property[];
  cityName: string;
  onSearch: (q: string) => void;
  onPropertyClick: (id: string) => void;
}

const isFurnished = (p: Property) => isTypeFurnished(p.type) || !!p.furnished;
const firstImg = (p?: Property) => p?.images?.find(Boolean);
const rating = (p: Property) => {
  const vals = [p.comfort_rating, p.security_rating, p.accessibility_rating].filter((v): v is number => typeof v === 'number');
  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
};

/** Rotation douce d'images (fondu) */
const RotatingImage = ({ images, interval, className, alt }: { images: string[]; interval: number; className?: string; alt: string }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images.length, interval]);
  const src = images[i] || fallbackImg;
  return (
    <AnimatePresence mode="sync">
      <motion.img
        key={src}
        src={src}
        alt={alt}
        loading="lazy"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
        className={`absolute inset-0 w-full h-full object-cover ${className ?? ''}`}
      />
    </AnimatePresence>
  );
};

const FurnishedBentoHero = ({ properties, cityName, onSearch, onPropertyClick }: Props) => {
  const furnished = useMemo(() => properties.filter(p => isFurnished(p) && p.status !== 'rented'), [properties]);

  // Biens phares : mieux notés en premier
  const featured = useMemo(
    () => [...furnished].sort((a, b) => (rating(b) ?? 0) - (rating(a) ?? 0)).filter(p => firstImg(p)),
    [furnished]
  );

  // Quartiers avec leurs images réelles
  const quartierTiles = useMemo(() => {
    const map = new Map<string, string[]>();
    furnished.forEach(p => {
      if (!p.quartier) return;
      const imgs = (p.images || []).filter(Boolean).slice(0, 2);
      if (!imgs.length) return;
      map.set(p.quartier, [...(map.get(p.quartier) || []), ...imgs]);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 5);
  }, [furnished]);

  const quartierNames = useMemo(() => [...new Set(furnished.map(p => p.quartier).filter(Boolean))].sort(), [furnished]);

  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setHeroIdx(n => (n + 1) % Math.min(featured.length, 6)), 5500);
    return () => clearInterval(t);
  }, [featured.length]);
  const hero = featured[heroIdx];
  const heroRating = hero ? rating(hero) : null;

  const [q, setQ] = useState('');

  return (
    <section className="container mx-auto px-4 pt-8 pb-12">
      <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 items-center">
        {/* Texte + recherche */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-secondary flex items-center gap-2">
            <span className="h-px w-8 bg-secondary" /> Séjours courts · Maisons meublées
          </p>
          <h1 className="mt-4 font-display font-bold text-foreground leading-[1.05] tracking-tight text-4xl md:text-5xl xl:text-6xl">
            Réservez des logements meublés à{' '}
            <span className="bg-gradient-to-r from-secondary to-brandOrange-400 bg-clip-text text-transparent">{cityName}.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
            Maisons, appartements et studios prêts à vivre, à la nuit ou à la semaine. Localisés sur la carte, quartier par quartier.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); onSearch(q); }}
            className="mt-8 flex items-center gap-2 bg-card border border-border rounded-full p-2 pl-5 shadow-elevation-2 max-w-xl"
          >
            <MapPin className="h-5 w-5 text-secondary shrink-0" />
            <input
              list="bento-quartiers"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Quartier ou destination"
              aria-label="Quartier ou destination"
              className="flex-1 h-11 bg-transparent outline-none text-foreground text-base"
            />
            <datalist id="bento-quartiers">
              {quartierNames.map(n => <option key={n} value={n} />)}
            </datalist>
            <button type="submit" aria-label="Rechercher" className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-secondary/90 active:scale-95 transition">
              <Search className="h-5 w-5" />
            </button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{furnished.length}</span> logement{furnished.length > 1 ? 's' : ''} meublé{furnished.length > 1 ? 's' : ''} disponible{furnished.length > 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Bento */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}
          className="grid grid-cols-4 grid-rows-[repeat(4,minmax(0,1fr))] gap-3 h-[520px]"
        >
          {/* Grande carte */}
          <button
            onClick={() => hero && onPropertyClick(hero.id)}
            className="relative col-span-3 row-span-3 rounded-3xl overflow-hidden bg-muted group text-left"
          >
            <RotatingImage images={hero ? [firstImg(hero)!] : [fallbackImg]} interval={99999} alt={hero?.title || 'Logement meublé'} />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
            {hero && (
              <motion.div
                key={hero.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute left-4 bottom-4 right-4 sm:right-auto bg-card/95 backdrop-blur rounded-2xl px-4 py-3 shadow-elevation-3 flex items-center gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{hero.quartier}</p>
                  <p className="text-xs text-muted-foreground truncate">{getTypeLabel(hero.type)}</p>
                  {heroRating !== null && (
                    <p className="text-xs text-foreground flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-secondary text-secondary" /> {heroRating.toFixed(1)}/5
                    </p>
                  )}
                </div>
                <span className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center group-hover:translate-x-0.5 transition">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </motion.div>
            )}
          </button>

          {/* Vignettes quartiers */}
          {Array.from({ length: 5 }).map((_, i) => {
            const tile = quartierTiles[i];
            const pos = ['col-start-4 row-start-1', 'col-start-4 row-start-2', 'col-start-4 row-start-3', 'col-start-1 col-span-2 row-start-4', 'col-start-3 col-span-2 row-start-4'][i];
            if (!tile) return <div key={i} className={`${pos} rounded-2xl bg-muted`} />;
            const [name, imgs] = tile;
            return (
              <button
                key={name}
                onClick={() => onSearch(name)}
                className={`${pos} relative rounded-2xl overflow-hidden bg-muted group text-left`}
              >
                <RotatingImage images={imgs} interval={4500 + i * 900} alt={`Logements à ${name}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
                <span className="absolute left-3 bottom-2.5 right-3 flex items-center justify-between text-primary-foreground text-sm font-semibold">
                  <span className="truncate">{name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition" />
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FurnishedBentoHero;
