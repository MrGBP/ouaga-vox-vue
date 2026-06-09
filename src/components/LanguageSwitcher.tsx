import { useTranslation } from 'react-i18next';
import { LANG_MANUAL_KEY } from '@/hooks/useCountryLocale';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher = ({ className = '' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const isFR = i18n.language === 'fr';
  const toggle = () => {
    try { localStorage.setItem(LANG_MANUAL_KEY, '1'); } catch {}
    i18n.changeLanguage(isFR ? 'en' : 'fr');
  };
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors ${className}`}
      aria-label="Change language"
    >
      {isFR ? '🇬🇧 EN' : '🇫🇷 FR'}
    </button>
  );
};

export default LanguageSwitcher;
