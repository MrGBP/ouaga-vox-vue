import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),  // maison
      setTimeout(() => setPhase(2), 800),  // curseur
      setTimeout(() => setPhase(3), 1200), // rayons
      setTimeout(() => setPhase(4), 1400), // texte
      setTimeout(() => onComplete(), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeIn' }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#1A3560]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Container icône (maison + curseur + rayons) */}
        <div className="relative w-32 h-32">
          {/* Maison — silhouette blanche */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.7 }}
            animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0"
          >
            <svg viewBox="0 0 100 100" className="w-32 h-32 text-white" fill="currentColor" aria-hidden>
              <polygon points="50,5 95,45 5,45" />
              <rect x="15" y="45" width="70" height="50" rx="2" />
              <rect x="40" y="65" width="20" height="30" rx="2" fill="#1A3560" />
              <rect x="68" y="12" width="12" height="20" rx="2" />
            </svg>
          </motion.div>

          {/* Curseur */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 30 }}
            animate={phase >= 2 ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-2 right-2"
          >
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" aria-hidden>
              <path d="M4 0l16 10-7 2-3 7z" />
            </svg>
          </motion.div>

          {/* Rayons orange (explosent depuis le point de clic) */}
          {phase >= 3 &&
            RAYS.map((angle, i) => (
              <motion.div
                key={angle}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '16px',
                  width: '3px',
                  height: '18px',
                  backgroundColor: '#E8761A',
                  borderRadius: '2px',
                  transformOrigin: 'bottom center',
                  transform: `rotate(${angle}deg) translateY(-24px)`,
                }}
              />
            ))}
        </div>

        {/* Texte du logo */}
        <div className="flex items-baseline gap-0">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 4 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="text-4xl font-black text-white tracking-tight font-display"
          >
            SapSap
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={phase >= 4 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="text-4xl font-black text-[#E8761A] tracking-tight font-display"
          >
            House
          </motion.span>
        </div>

        {/* Slogan */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-0.5 bg-[#E8761A]" />
          <span className="text-white/85 text-sm font-medium italic">mon bien Immo en un clic</span>
          <div className="w-8 h-0.5 bg-[#E8761A]" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
