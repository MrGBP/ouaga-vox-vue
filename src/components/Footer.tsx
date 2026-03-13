import { Building2, MapPin, Phone, Mail, Facebook, Instagram, MessageCircle } from 'lucide-react';

const Footer = () => (
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
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide">Mon bien Immo en un clic</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            La plateforme immobilière de référence à Ouagadougou. Trouvez votre bien idéal grâce à notre carte interactive et notre moteur <strong>SapSap AI Engine</strong>.
          </p>
        </div>

        {/* Liens rapides */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Navigation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#properties" className="hover:text-foreground transition-colors">Biens disponibles</a></li>
            <li><a href="#map" className="hover:text-foreground transition-colors">Carte interactive</a></li>
            <li><a href="#quartiers" className="hover:text-foreground transition-colors">Quartiers</a></li>
            <li><a href="#testimonials" className="hover:text-foreground transition-colors">Témoignages</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              Ouagadougou, Burkina Faso
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              +226 XX XX XX XX
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              contact@sapsaphouse.com
            </li>
          </ul>
        </div>

        {/* Réseaux sociaux */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Suivez-nous</h4>
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
            Propulsé par <span className="font-semibold text-primary">SapSap AI Engine</span>
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} SapSapHouse. Tous droits réservés.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
          <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-foreground transition-colors">CGU</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
