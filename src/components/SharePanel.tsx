import { motion } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SharePanelProps {
  shareUrl: string;
  shareText: string;
  onClose: () => void;
}

const SharePanel = ({ shareUrl, shareText, onClose }: SharePanelProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('clipboard failed', e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[900] bg-foreground/40 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-card rounded-2xl shadow-xl w-full max-w-sm border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">{t('partage.titre')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            <span className="text-lg">💬</span>
            {t('partage.whatsapp')}
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? t('partage.copie') : t('partage.copier')}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted"
          >
            {t('partage.fermer')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SharePanel;
