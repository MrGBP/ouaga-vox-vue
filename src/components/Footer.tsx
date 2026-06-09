import { Building2, MapPin, Phone, Mail, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCountryConfig } from '@/hooks/useCountryConfig';
import { useGeoCity } from '@/hooks/useGeoCity';

const Footer = () => {
  const { t } = useTranslation();
  const country = useCountryConfig();
  const { activeCity } = useGeoCity();

  return (
  <footer className="bg-card border-t border-border">
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <span className="text-lg font-bold text-foreground">SapSapHouse</span>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide">{t('footer.tagline')}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('footer.description')}
          </p>
        </div>

        {/* Liens rapides */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">{t('footer.navigation')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#properties" className="hover:text-foreground transition-colors">{t('footer.biens_dispos')}</a></li>
            <li><a href="#map" className="hover:text-foreground transition-colors">{t('footer.carte_interactive')}</a></li>
            <li><a href="#quartiers" className="hover:text-foreground transition-colors">{t('footer.quartiers')}</a></li>
            <li><a href="#testimonials" className="hover:text-foreground transition-colors">{t('footer.temoignages')}</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">{t('footer.contact')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              {activeCity?.name}, {activeCity?.countryName}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              {country.support_whatsapp || `${activeCity?.phone_prefix} XX XX XX XX`}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              {country.support_email || 'contact@sapsaphouse.com'}
            </li>
          </ul>
        </div>

        {/* Réseaux sociaux */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">{t('footer.suivez_nous')}</h4>
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {t('footer.propulse_par')} <span className="font-semibold text-primary">SapSap AI Engine</span>
          </p>
        </div>
      </div>

      {/* Partenaires */}
      <div className="mt-10 pt-8 border-t border-border">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            {t('footer.confiance')}
          </span>
          <h4 className="text-base font-semibold text-foreground mt-1">{t('footer.partenaires')}</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: 'Coris Bank', tag: 'Financement' },
            { name: 'Ecobank', tag: 'Banque' },
            { name: 'Orange Money', tag: 'Paiement' },
            { name: 'Chambre des Notaires', tag: 'Juridique' },
            { name: 'Onatel', tag: 'Télécoms' },
            { name: 'CCI-BF', tag: 'Institution' },
          ].map((p) => (
            <div
              key={p.name}
              className="group h-16 rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all flex flex-col items-center justify-center px-2"
              title={`${p.name} — ${t('footer.tag_partenaire')} ${p.tag}`}
            >
              <span className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors truncate max-w-full">
                {p.name}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {p.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} SapSapHouse. {t('footer.tous_droits')}.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground transition-colors">{t('footer.mentions')}</a>
          <a href="#" className="hover:text-foreground transition-colors">{t('footer.confidentialite')}</a>
          <a href="#" className="hover:text-foreground transition-colors">{t('footer.cgu')}</a>
        </div>
      </div>

    </div>
  </footer>
  );
};

export default Footer;
