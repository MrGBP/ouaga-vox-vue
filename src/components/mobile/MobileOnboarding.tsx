import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARD_KEY = 'sapsap_onboarded';

export default function MobileOnboarding({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARD_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleDone = () => {
    localStorage.setItem(ONBOARD_KEY, 'true');
    setVisible(false);
    onDone();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-foreground/40" />

        {/* Tooltip 1: Clusters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute z-10"
          style={{ top: '35%', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="bg-card rounded-xl px-4 py-3 shadow-lg border border-border max-w-[260px] text-center">
            <p className="text-sm font-medium text-foreground">
              📍 Tapez un quartier pour voir les biens disponibles
            </p>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-r border-b border-border"
              style={{ transform: 'translateX(-50%) rotate(45deg)' }}
            />
          </div>
        </motion.div>

        {/* Tooltip 2: Search */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute z-10"
          style={{ bottom: 'calc(70px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="bg-card rounded-xl px-4 py-3 shadow-lg border border-border max-w-[260px] text-center">
            <p className="text-sm font-medium text-foreground">
              🔍 Cherchez par type, prix ou équipement
            </p>
          </div>
        </motion.div>

        {/* Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          onClick={handleDone}
          className="absolute z-10 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold shadow-lg active:scale-[0.97] transition-transform"
          style={{ bottom: 'calc(130px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)' }}
        >
          Compris ✓
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
