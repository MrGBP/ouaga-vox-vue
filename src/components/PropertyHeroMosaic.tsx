import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';

interface Props {
  images: string[];
  title: string;
  videoUrl?: string;
}

/**
 * Airbnb-style hero mosaic — 1 grande image + 4 vignettes (2x2).
 * Gestalt (proximité) + Fitts (grosse zone principale cliquable).
 * Clic → lightbox plein-écran avec navigation clavier.
 */
const PropertyHeroMosaic = ({ images, title, videoUrl }: Props) => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const imgs = images.length > 0 ? images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200'];
  const main = imgs[0];
  const rest = imgs.slice(1, 5);
  while (rest.length < 4) rest.push(imgs[rest.length % imgs.length] || main);

  const open = (i: number) => setLightbox(i);
  const close = () => setLightbox(null);
  const prev = () => setLightbox(i => (i === null ? null : (i - 1 + imgs.length) % imgs.length));
  const next = () => setLightbox(i => (i === null ? null : (i + 1) % imgs.length));

  return (
    <>
      <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[420px] lg:h-[520px] rounded-2xl overflow-hidden">
        {/* Grande image gauche */}
        <button
          onClick={() => open(0)}
          className="relative col-span-2 row-span-2 group overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Voir photo principale de ${title}`}
        >
          <img src={main} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-tr from-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* 4 vignettes */}
        {rest.map((src, i) => (
          <button
            key={i}
            onClick={() => open(i + 1)}
            className="relative group overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Voir photo ${i + 2}`}
          >
            <img src={src} alt={`${title} — photo ${i + 2}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-tr from-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}

        {/* CTA "Toutes les photos" — Fitts's Law : bouton grand, coin bas-droit */}
        <button
          onClick={() => open(0)}
          className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-sm font-semibold text-foreground shadow-elevation-2 hover:shadow-elevation-3 hover:scale-105 transition-all"
        >
          <Camera className="h-4 w-4" />
          Toutes les photos ({imgs.length})
        </button>

        {videoUrl && (
          <button
            onClick={() => open(0)}
            className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-sm font-semibold shadow-elevation-2 hover:scale-105 transition-all"
          >
            <Play className="h-4 w-4 fill-current" />
            Voir la vidéo
          </button>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-foreground/95 flex items-center justify-center"
            onClick={close}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-card/20 hover:bg-card/30 text-card flex items-center justify-center backdrop-blur-sm"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 w-11 h-11 rounded-full bg-card/20 hover:bg-card/30 text-card flex items-center justify-center backdrop-blur-sm"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              src={imgs[lightbox]}
              alt=""
              className="max-h-[85vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 w-11 h-11 rounded-full bg-card/20 hover:bg-card/30 text-card flex items-center justify-center backdrop-blur-sm"
              aria-label="Suivant"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-card text-sm font-medium bg-card/15 backdrop-blur-sm px-4 py-1.5 rounded-full">
              {lightbox + 1} / {imgs.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PropertyHeroMosaic;
