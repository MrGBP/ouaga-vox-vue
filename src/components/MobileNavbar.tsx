import { useState } from 'react';
import { Building2, Bell, Menu, X, ChevronLeft, Home as HomeIcon, Phone, FileText, MapPin, LogIn, UserPlus, LogOut, User as UserIcon, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/sapsap-logo.png';
import NotificationBell from '@/components/NotificationBell';

export type NavLevel = 1 | 2 | 3;

interface MobileNavbarProps {
  homePresentation?: boolean;
  level: NavLevel;
  quartierName?: string;
  quartierCount?: number;
  propertyTitle?: string;
  propertyQuartier?: string;
  onBack?: () => void;
  onHome?: () => void;
  depth?: number;
  isExploring?: boolean;
  favoritesCount?: number;
  onFavoritesClick?: () => void;
}

const LevelDots = ({ depth }: { depth: number }) => {
  const count = Math.min(depth, 4);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-[3px] transition-all duration-200 ${
            i === count - 1
              ? 'w-[14px] h-[5px] bg-primary'
              : 'w-[5px] h-[5px] bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};

const MobileNavbar = ({
  homePresentation = false,
  level,
  quartierName,
  quartierCount,
  propertyTitle,
  propertyQuartier,
  onBack,
  onHome,
  depth,
  isExploring = false,
  favoritesCount = 0,
  onFavoritesClick,
}: MobileNavbarProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isOwner, isAdmin, openAuthModal, requireAuth, signOut } = useAuth();
  const showBack = level > 1;
  const showHome = level >= 3 || (depth && depth >= 3);
  const dotDepth = depth || level;

  const goPublish = () => {
    setDrawerOpen(false);
    requireAuth('publier un bien', () => {
      if (isOwner || isAdmin) navigate('/proprietaire');
      else navigate('/mon-compte');
    });
  };

  return (
    <>
      <nav
        className={`flex lg:hidden fixed top-0 left-0 right-0 items-center justify-between z-[80] no-select ${homePresentation ? 'mobile-home-navbar' : ''}`}
        style={{
          height: `calc(${homePresentation ? 64 : 52}px + env(safe-area-inset-top))`,
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
          background: isExploring ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.97)',
          backdropFilter: isExploring ? 'none' : 'blur(8px)',
          WebkitBackdropFilter: isExploring ? 'none' : 'blur(8px)',
          borderBottom: isExploring ? 'none' : '0.5px solid hsl(var(--border))',
          transition: 'background 300ms ease, backdrop-filter 300ms ease',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!showBack ? (
            <>
              <Button variant="ghost" className="h-auto p-0 gap-2 hover:bg-transparent" aria-label="SapSapHouse — accueil" onClick={() => navigate('/')}><img src={logo} alt="" className={homePresentation ? 'w-10 h-10 object-contain' : 'w-9 h-9 object-contain'} /><span className="text-left"><strong className={`block text-primary ${homePresentation ? 'text-base' : 'text-sm'}`}>SapSap<span className="text-secondary">House</span></strong><small className="block text-[9px] text-muted-foreground">Mon bien Immo en un clic</small></span></Button>
            </>
          ) : (
            <>
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] -ml-1.5"
                style={{
                  background: isExploring ? 'rgba(255,255,255,0.9)' : undefined,
                }}
              >
                <ChevronLeft className="h-4 w-4" style={{ color: isExploring ? '#1a3560' : undefined }} />
              </button>
              {level === 2 ? (
                <span
                  className="text-sm font-semibold truncate"
                  style={isExploring ? { color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' } : undefined}
                >
                  {quartierName}
                </span>
              ) : (
                /* Level 3 (fiche bien): pas de titre dupliqué — déjà visible sur la fiche */
                <span
                  className="text-xs font-medium text-muted-foreground truncate"
                  style={isExploring ? { color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' } : undefined}
                >
                  {t('nav.retour')}
                </span>
              )}
            </>
          )}
        </div>

        {/* Center: dots */}
        {showBack && (
          <div className="shrink-0 mx-2">
            <LevelDots depth={dotDepth} />
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-1 shrink-0">
          {homePresentation && (user ? <NotificationBell className="!h-11 !w-11 bg-card shadow-soft" /> : <Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications" className="h-11 w-11 rounded-full bg-card shadow-soft" onClick={() => openAuthModal('consulter vos notifications')}><Bell className="h-5 w-5 text-primary" /></Button>)}
          {showHome && onHome && (
            <button
              onClick={onHome}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center min-h-[44px] min-w-[44px]"
              title={t('nav.retour_accueil')}
            >
              <HomeIcon className="h-4 w-4 text-secondary-foreground" />
            </button>
          )}
          {!homePresentation && favoritesCount > 0 && onFavoritesClick && (
            <button
              onClick={onFavoritesClick}
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label={`Favoris (${favoritesCount})`}
              title={`Favoris (${favoritesCount})`}
            >
              <Heart className="h-5 w-5 text-secondary fill-secondary" />
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold flex items-center justify-center">
                {favoritesCount}
              </span>
            </button>
          )}
          {!showBack && (
            <Button variant="ghost" size="icon"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu"
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted transition-colors ${homePresentation ? 'rounded-full bg-card shadow-soft' : 'rounded-lg'}`}
            >
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
          )}
        </div>
      </nav>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/30 z-[200]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-card shadow-lg z-[201] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-sm font-bold text-foreground">{t('nav.menu')}</span>
                <button onClick={() => setDrawerOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { label: t('nav.biens'), icon: HomeIcon, onClick: () => { setDrawerOpen(false); navigate('/resultats'); } },
                  { label: t('nav.carte'), icon: MapPin, onClick: () => { setDrawerOpen(false); navigate('/resultats?view=map'); } },
                  { label: t('nav.publier_bien'), icon: FileText, onClick: goPublish },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </button>
                ))}

                {/* Auth section */}
                <div className="pt-3 mt-3 border-t border-border space-y-1">
                  {user ? (
                    <>
                      <button
                        onClick={() => { setDrawerOpen(false); navigate('/mon-compte'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted text-left"
                      >
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        {user.user_metadata?.full_name || user.email}
                      </button>
                      <button
                        onClick={() => { setDrawerOpen(false); signOut(); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-muted text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Se déconnecter
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setDrawerOpen(false); openAuthModal('se connecter'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted text-left"
                      >
                        <LogIn className="h-4 w-4 text-muted-foreground" />
                        Se connecter
                      </button>
                      <button
                        onClick={() => { setDrawerOpen(false); openAuthModal('créer un compte'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted text-left"
                      >
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        Créer un compte
                      </button>
                    </>
                  )}
                </div>
              </nav>
              <div className="p-4 border-t border-border">
                <Button className="w-full bg-secondary text-secondary-foreground gap-2">
                  <Phone className="h-4 w-4" /> {t('nav.contact')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavbar;
