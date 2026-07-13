import { Menu, X, User, Plus, MousePointer2, Home as HomeIcon } from 'lucide-react';
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
    // Onboarding landing (guided) — the CTA there routes to the actual form.
    window.location.href = '/publier';
  };

  return (
    <header className="sticky top-0 z-50 bg-card/85 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo animé — maison + rayons orange + curseur (concept "en un clic") */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer" aria-label="SapSapHouse — Accueil">
            <motion.div
              initial="rest"
              whileHover="hover"
              animate="rest"
              className="relative w-11 h-11 bg-[#1A3560] rounded-xl flex items-center justify-center overflow-visible shadow-elevation-2"
            >
              {/* Maison fixe */}
              <HomeIcon className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />

              {/* Rayons orange (explosent au hover) */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <motion.div
                  key={angle}
                  variants={{
                    rest: { opacity: 0, scale: 0 },
                    hover: { opacity: [0, 1, 0.8], scale: 1 },
                  }}
                  transition={{ delay: i * 0.025, duration: 0.35 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '2px',
                    height: '6px',
                    backgroundColor: '#E8761A',
                    borderRadius: '1px',
                    transformOrigin: 'center 16px',
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-14px)`,
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Curseur qui clique */}
              <motion.div
                variants={{
                  rest: { opacity: 0, x: 8, y: 8, scale: 0.5 },
                  hover: { opacity: 1, x: 2, y: 2, scale: 1 },
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute bottom-0 right-0 z-20"
              >
                <MousePointer2 className="w-3 h-3 text-white fill-white" strokeWidth={2} />
              </motion.div>
            </motion.div>

            <div className="leading-none">
              <div className="font-display font-black text-lg tracking-tight leading-none">
                <span className="text-[#1A3560]">SapSap</span>
                <span className="text-[#E8761A]">House</span>
              </div>
              <div className="text-[10px] text-muted-foreground italic font-medium leading-none mt-1">
                mon bien Immo en un clic
              </div>
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
