import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  'Villa 3 chambres avec piscine à Ouaga 2000',
  'Studio meublé pas cher à Zogona',
  'Appartement climatisé avec parking à Pissy',
  'Bureau moderne à Koulouba',
];

export default function AIDescribeSheet({ open, onClose }: Props) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => textareaRef.current?.focus(), 250);
    }
  }, [open]);

  const submit = (q?: string) => {
    const query = (q ?? value).trim();
    if (!query) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[301] bg-card rounded-t-3xl shadow-2xl border-t border-border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A3560] to-[#2a5090] flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4 text-[#E8761A]" strokeWidth={2.5} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-bold text-foreground">Assistant SapSap</div>
                    <div className="text-[11px] text-muted-foreground">Décrivez votre bien idéal</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative rounded-2xl border-2 border-border focus-within:border-primary/50 transition-colors bg-background">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Ex : villa meublée avec jardin, 2 chambres, proche de l'école française…"
                  rows={3}
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none rounded-2xl"
                />
                <button
                  onClick={() => submit()}
                  disabled={!value.trim()}
                  className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                  aria-label="Rechercher"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="mt-3">
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Idées</div>
                <div className="flex gap-1.5 flex-wrap">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="text-[11px] px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-foreground/80 border border-border active:scale-95 transition-transform text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
