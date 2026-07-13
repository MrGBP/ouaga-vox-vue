import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),   // maison rebondit
      setTimeout(() => setPhase(2), 700),   // curseur clique
      setTimeout(() => setPhase(3), 950),   // rayons explosent
      setTimeout(() => setPhase(4), 1250),  // texte + slogan
      setTimeout(() => setPhase(5), 2100),  // fade-out préparé
      setTimeout(() => onComplete(), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 5 ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'radial-gradient(circle at 50% 45%, #24447a 0%, #1A3560 55%, #0f2244 100%)',
      }}
    >
      {/* Halo lumineux qui pulse en arrière-plan */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={phase >= 3 ? { scale: [0.4, 2.4, 2.2], opacity: [0, 0.35, 0] } : {}}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute w-[340px] h-[340px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,118,26,0.55) 0%, rgba(232,118,26,0) 70%)' }}
      />

      {/* Particules orange qui montent doucement */}
      {phase >= 4 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => {
            const left = (i * 73) % 100;
            const delay = (i % 7) * 0.15;
            return (
              <motion.span
                key={i}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: -window.innerHeight * 0.5, opacity: [0, 0.9, 0] }}
                transition={{ duration: 2.2, delay, ease: 'easeOut' }}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${left}%`,
                  bottom: '35%',
                  background: i % 3 === 0 ? '#E8761A' : '#ffffff',
                  boxShadow: '0 0 6px currentColor',
                }}
              />
            );
          })}
        </div>
      )}

      <div className="relative flex flex-col items-center gap-7">
        {/* Container icône (maison + curseur + rayons) */}
        <div className="relative w-32 h-32">
          {/* Maison — silhouette blanche */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.5, rotate: -8 }}
            animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 0.7, type: 'spring', stiffness: 220, damping: 14 }}
            className="absolute inset-0 drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          >
            <svg viewBox="0 0 100 100" className="w-32 h-32 text-white" fill="currentColor" aria-hidden>
              <polygon points="50,5 95,45 5,45" />
              <rect x="15" y="45" width="70" height="50" rx="2" />
              <rect x="40" y="65" width="20" height="30" rx="2" fill="#1A3560" />
              <rect x="68" y="12" width="12" height="20" rx="2" />
            </svg>
          </motion.div>

          {/* Curseur qui descend et clique */}
          <motion.div
            initial={{ opacity: 0, x: 42, y: 42, rotate: -18, scale: 0.6 }}
            animate={
              phase >= 2
                ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: [1, 0.82, 1] }
                : {}
            }
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1], scale: { delay: 0.35, duration: 0.25 } }}
            className="absolute bottom-2 right-2"
          >
            <svg viewBox="0 0 24 24" className="w-11 h-11 text-white drop-shadow-lg" fill="currentColor" aria-hidden>
              <path d="M4 0l16 10-7 2-3 7z" />
            </svg>
          </motion.div>

          {/* Onde de choc au clic */}
          {phase >= 3 && (
            <motion.div
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute bottom-4 right-4 w-8 h-8 rounded-full border-2 border-[#E8761A]"
            />
          )}

          {/* Rayons orange (explosent depuis le point de clic) */}
          {phase >= 3 &&
            RAYS.map((angle, i) => (
              <motion.div
                key={angle}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0.7] }}
                transition={{ delay: i * 0.025, duration: 0.6, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  bottom: '22px',
                  right: '18px',
                  width: '3px',
                  height: '22px',
                  backgroundColor: '#E8761A',
                  borderRadius: '2px',
                  transformOrigin: 'bottom center',
                  transform: `rotate(${angle}deg) translateY(-26px)`,
                  boxShadow: '0 0 8px rgba(232,118,26,0.7)',
                }}
              />
            ))}
        </div>

        {/* Texte du logo — lettres qui montent en cascade */}
        <div className="flex items-baseline gap-0 overflow-hidden">
          {'SapSap'.split('').map((c, i) => (
            <motion.span
              key={`s-${i}`}
              initial={{ opacity: 0, y: 30 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-[42px] font-black text-white tracking-tight font-display leading-none"
            >
              {c}
            </motion.span>
          ))}
          {'House'.split('').map((c, i) => (
            <motion.span
              key={`h-${i}`}
              initial={{ opacity: 0, y: 30 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.24 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-[42px] font-black text-[#E8761A] tracking-tight font-display leading-none"
            >
              {c}
            </motion.span>
          ))}
        </div>

        {/* Slogan — encadré de deux traits qui se déploient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-2.5"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={phase >= 4 ? { width: 32 } : {}}
            transition={{ delay: 0.65, duration: 0.35 }}
            className="h-[2px] bg-[#E8761A] rounded-full"
          />
          <span className="text-white/90 text-[13px] font-medium italic tracking-wide">
            mon bien Immo en un clic
          </span>
          <motion.div
            initial={{ width: 0 }}
            animate={phase >= 4 ? { width: 32 } : {}}
            transition={{ delay: 0.65, duration: 0.35 }}
            className="h-[2px] bg-[#E8761A] rounded-full"
          />
        </motion.div>

        {/* Loader minimal en bas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mt-2 flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
