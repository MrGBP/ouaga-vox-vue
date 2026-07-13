import { Building2, Menu, X, User, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useGeoCity } from '@/hooks/useGeoCity';
import NotificationBell from '@/components/NotificationBell';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, openAuthModal, isOwner, isAdmin, requireAuth } = useAuth();
  const { activeCity, setActiveCity, availableCities } = useGeoCity();
  const { t } = useTranslation();

  const handlePublish = () => {
    requireAuth('publier un bien', () => {
      window.location.href = (isOwner || isAdmin) ? '/proprietaire' : '/mon-compte';
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-card/85 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + slogan (conservé) */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-warm transition-transform duration-base ease-out-expo group-hover:scale-105">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <h1 className="font-display text-xl font-bold text-foreground tracking-tight">SapSapHouse</h1>
              <p className="text-[11px] text-muted-foreground font-medium tracking-wide mt-0.5">Mon bien Immo en un clic</p>
            </div>
          </Link>

          {/* Nav desktop — 3 liens (Hick's Law) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <a href="#properties" className="px-4 py-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors">
              Explorer
            </a>
            <a href="#quartiers" className="px-4 py-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors">
              Quartiers
            </a>
            <button
              onClick={handlePublish}
              className="px-4 py-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Publier un bien
            </button>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-0.5">
              {availableCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setActiveCity(city.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCity.id === city.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  aria-label={`Voir les biens à ${city.name}`}
                >
                  <span>{city.flag}</span>
                  <span>{city.name}</span>
                </button>
              ))}
            </div>
            {user && <NotificationBell />}
            {user ? (
              <Link to="/mon-compte">
                <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <User className="h-3.5 w-3.5" />
                  {t('nav.mon_compte')}
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => openAuthModal()}
              >
                <User className="h-3.5 w-3.5" />
                {t('nav.connexion')}
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              <a href="#properties" className="text-sm font-medium text-foreground py-3 px-2">Explorer</a>
              <a href="#quartiers" className="text-sm font-medium text-foreground py-3 px-2">Quartiers</a>
              <button onClick={handlePublish} className="text-left text-sm font-medium text-foreground py-3 px-2 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Publier un bien
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
