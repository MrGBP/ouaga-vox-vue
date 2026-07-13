import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_KEY = 'sapsap_map_tour_done';

const STEPS = [
  { icon: '📍', text: 'Tapez sur un quartier pour voir les biens disponibles' },
  { icon: '👆', text: 'Tapez sur un bien pour voir les détails complets' },
  { icon: '❤️', text: 'Sauvegardez vos biens préférés en un clic' },
];

interface Props {
  onDone?: () => void;
}

const MapFeatureTour = ({ onDone }: Props) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(() =>
    typeof window !== 'undefined' && !localStorage.getItem(TOUR_KEY)
  );

  const handleDone = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
    onDone?.();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] pointer-events-none"
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={handleDone} />

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1A3560] text-white rounded-2xl p-5 max-w-[280px] text-center pointer-events-auto shadow-2xl"
        >
          <div className="text-4xl mb-3">{STEPS[step].icon}</div>
          <p className="text-sm font-medium mb-5 leading-snug">{STEPS[step].text}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-4 bg-[#E8761A]' : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="text-sm font-semibold text-[#E8761A] hover:text-[#F8B266] transition-colors"
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleDone}
                className="text-sm font-semibold bg-[#E8761A] hover:bg-[#C45E0E] text-white px-3 py-1.5 rounded-full transition-colors"
              >
                Compris ✓
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapFeatureTour;
