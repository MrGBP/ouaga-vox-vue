import { Menu, X, User, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useGeoCity } from '@/hooks/useGeoCity';
import NotificationBell from '@/components/NotificationBell';
import logoIcon from '@/assets/sapsap-logo.png';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, openAuthModal, isOwner, isAdmin, requireAuth } = useAuth();
  const { activeCity, setActiveCity, availableCities } = useGeoCity();
  const { t } = useTranslation();

  const handlePublish = () => {
    // Onboarding landing (guided) — the CTA there routes to the actual form.
    window.location.href = '/publier';
  };

  return (
    <header className="sticky top-0 z-50 bg-card/85 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo — badge 3D avec halo dégradé + micro-anim (Fitts + brand recall) */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="SapSapHouse — Accueil">
            <div className="relative">
              {/* Halo dégradé animé */}
              <div
                aria-hidden
                className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/40 opacity-70 blur-md group-hover:opacity-100 transition-opacity duration-500"
              />
              {/* Reflet brillance */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
              />
              <motion.div
                whileHover={{ rotate: [0, -3, 3, 0], scale: 1.05 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-white to-muted/40 flex items-center justify-center shadow-elevation-2 border border-border/40 overflow-hidden"
              >
                <img
                  src={logoIcon}
                  alt=""
                  className="w-8 h-8 object-contain drop-shadow-[0_2px_3px_rgba(26,53,96,0.25)]"
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            </div>
            <div className="leading-none">
              <h1 className="font-display text-xl font-bold tracking-tight">
                <span className="text-primary">SapSap</span>
                <span className="text-secondary">House</span>
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium tracking-wide mt-1 flex items-center gap-1.5">
                <span className="h-px w-3 bg-secondary" />
                Mon bien Immo en un clic
              </p>
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
