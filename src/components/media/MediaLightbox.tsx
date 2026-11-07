import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface LightboxItem { type: 'photo' | 'video'; url: string }

interface Props {
  items: LightboxItem[];
  index: number;
  title?: string;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

/** Visionneuse plein écran : glisser gauche/droite pour défiler, vers le bas (ou X) pour quitter. */
const MediaLightbox = ({ items, index, title, onIndexChange, onClose }: Props) => {
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<'x' | 'y' | null>(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [anim, setAnim] = useState(false);
  const n = items.length;
  const go = (d: number) => n > 1 && onIndexChange((index + d + n) % n);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  });

  const onStart = (e: React.TouchEvent) => {
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    axis.current = null; setAnim(false);
  };
  const onMove = (e: React.TouchEvent) => {
    if (!start.current) return;
    const mx = e.touches[0].clientX - start.current.x;
    const my = e.touches[0].clientY - start.current.y;
    if (!axis.current && (Math.abs(mx) > 8 || Math.abs(my) > 8)) axis.current = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (axis.current === 'x') setDx(mx);
    if (axis.current === 'y') setDy(Math.max(0, my));
  };
  const onEnd = () => {
    setAnim(true);
    if (axis.current === 'y' && dy > 110) { onClose(); return; }
    if (axis.current === 'x' && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    setDx(0); setDy(0); start.current = null; axis.current = null;
  };

  const item = items[index];
  const progress = Math.min(dy / 300, 1);
  const scale = 1 - progress * 0.25;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center select-none touch-none"
      style={{ background: `hsl(0 0% 0% / ${1 - progress * 0.8})` }}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      role="dialog" aria-modal="true" aria-label={title ? `Photos de ${title}` : 'Photos'}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transition: anim ? 'transform 250ms ease' : 'none' }}
      >
        {item?.type === 'video' ? (
          <video key={item.url} src={item.url} className="max-w-full max-h-full object-contain" controls autoPlay playsInline />
        ) : (
          <img key={item?.url} src={item?.url} alt={title} className="max-w-full max-h-full object-contain" draggable={false} />
        )}
      </div>

      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]" style={{ opacity: 1 - progress }}>
        <span className="text-sm font-medium text-primary-foreground/90">{index + 1} / {n}</span>
        <button onClick={onClose} aria-label="Quitter le plein écran" className="w-10 h-10 rounded-full bg-primary-foreground/15 backdrop-blur-md flex items-center justify-center text-primary-foreground active:scale-95">
          <X className="h-5 w-5" />
        </button>
      </div>

      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Précédent" className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-primary-foreground/15 items-center justify-center text-primary-foreground hover:bg-primary-foreground/25">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={() => go(1)} aria-label="Suivant" className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-primary-foreground/15 items-center justify-center text-primary-foreground hover:bg-primary-foreground/25">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
};

export default MediaLightbox;
