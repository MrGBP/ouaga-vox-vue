import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';

const TITLES: Record<string, { fr: string; en: string }> = {
  '/mentions-legales': { fr: 'Mentions légales', en: 'Legal notice' },
  '/politique-confidentialite': { fr: 'Politique de confidentialité', en: 'Privacy policy' },
  '/conditions-utilisation': { fr: 'Conditions d\'utilisation', en: 'Terms of use' },
};

const LegalPage = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const title = TITLES[pathname]?.[i18n.language === 'en' ? 'en' : 'fr'] ?? 'SapSapHouse';

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ChevronLeft className="h-4 w-4" />
          {t('legal.retour_accueil')}
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground italic">{t('legal.en_redaction')}</p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
