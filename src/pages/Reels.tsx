import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Heart, MapPin, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { fetchMergedProperties } from '@/lib/propertiesService';
import { getTypeLabel, pricePerNight, type Property } from '@/lib/mockData';
import { getRentMode } from '@/lib/typeHelpers';
import { useGeoCity } from '@/hooks/useGeoCity';

const FAV_KEY = 'sapsap_favorites';
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

const ReelSlide = ({ p, active, fav, onFav, onOpen, muted }: { p: Property; active: boolean; fav: boolean; onFav: () => void; onOpen: () => void; muted: boolean }) => {
  const imgs = (p.images || []).filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || imgs.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % imgs.length), 3500);
    return () => clearInterval(t);
  }, [active, imgs.length]);
  const mode = getRentMode(p as any);
  const price = mode === 'nuit' ? pricePerNight(p.price) : p.price;

  return (
    <section className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-primary">
      {p.video_url && active ? (
        <video src={p.video_url} autoPlay loop muted={muted} playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : imgs.length ? (
        <motion.img
          key={imgs[i]}
          src={imgs[i]}
          alt={p.title}
          initial={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: 1, scale: active ? 1.08 : 1 }}
          transition={{ opacity: { duration: 0.8 }, scale: { duration: 4, ease: 'linear' } }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-primary/30" />

      {imgs.length > 1 && (
        <div className="absolute top-16 left-4 right-4 flex gap-1 max-w-md mx-auto">
          {imgs.map((_, k) => <span key={k} className={`h-0.5 flex-1 rounded-full ${k === i ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`} />)}
        </div>
      )}

      <div className="absolute right-4 bottom-36 flex flex-col gap-4 items-center">
        <button onClick={onFav} aria-label="Coup de cœur" className="h-12 w-12 rounded-full bg-card/20 backdrop-blur flex items-center justify-center">
          <Heart className={`h-6 w-6 ${fav ? 'fill-secondary text-secondary' : 'text-primary-foreground'}`} />
        </button>
      </div>

      <div className="absolute left-0 right-0 bottom-0 p-5 pb-8 max-w-2xl mx-auto text-primary-foreground">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground rounded-full px-2.5 py-1">
          {getTypeLabel(p.type)}
        </span>
        <h2 className="mt-3 font-display text-2xl md:text-3xl font-bold leading-tight">{p.title}</h2>
        <p className="mt-1 text-sm opacity-85 flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.quartier}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xl font-bold">{fmt(price)} FCFA <span className="text-sm font-normal opacity-80">/ {mode}</span></p>
          <button onClick={onOpen} className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-card text-foreground font-semibold text-sm hover:bg-card/90">
            Voir le bien <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

const ReelsPage = () => {
  const navigate = useNavigate();
  const { activeCity } = useGeoCity();
  const [props, setProps] = useState<Property[]>([]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [favs, setFavs] = useState<Set<string>>(() => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); } });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMergedProperties(activeCity?.country).then(p => setProps(p as any)).catch(() => {});
  }, [activeCity?.country]);

  const list = useMemo(() => props.filter(p => p.status !== 'rented' && ((p.images || []).some(Boolean) || p.video_url)), [props]);

  const onScroll = () => {
    const el = ref.current; if (!el) return;
    setActive(Math.round(el.scrollTop / el.clientHeight));
  };
  const toggleFav = (id: string) => setFavs(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id);
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...n])); } catch { /* noop */ }
    return n;
  });

  return (
    <div className="fixed inset-0 bg-primary">
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 text-primary-foreground">
        <p className="font-display font-bold text-lg">Explorer</p>
        <div className="flex gap-2">
          <button onClick={() => setMuted(m => !m)} aria-label="Son" className="h-10 w-10 rounded-full bg-card/20 backdrop-blur flex items-center justify-center">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <button onClick={() => navigate(-1)} aria-label="Fermer" className="h-10 w-10 rounded-full bg-card/20 backdrop-blur flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div ref={ref} onScroll={onScroll} className="h-full overflow-y-scroll snap-y snap-mandatory [scrollbar-width:none]">
        {list.length === 0 ? (
          <div className="h-full flex items-center justify-center text-primary-foreground/80">Aucun bien à explorer pour le moment.</div>
        ) : list.map((p, k) => (
          <ReelSlide key={p.id} p={p} active={k === active} muted={muted} fav={favs.has(p.id)} onFav={() => toggleFav(p.id)} onOpen={() => navigate(`/property/${encodeURIComponent(p.id)}`)} />
        ))}
      </div>
    </div>
  );
};

export default ReelsPage;
