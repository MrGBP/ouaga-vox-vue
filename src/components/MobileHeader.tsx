import { Menu, X, Home, MapPin, Phone, FileText, LogIn, UserPlus, LogOut, User as UserIcon, Download, Share, MousePointer2, Home as HomeIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/NotificationBell';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const MobileHeader = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isOwner, isAdmin, openAuthModal, requireAuth, signOut } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }
    const r = await install();
    if (r === 'accepted') setDrawerOpen(false);
  };

  const goPublish = () => {
    setDrawerOpen(false);
    requireAuth('publier un bien', () => {
      if (isOwner || isAdmin) navigate('/proprietaire');
      else navigate('/mon-compte');
    });
  };


  return (
    <>
      <header
        className="flex lg:hidden fixed top-0 left-0 right-0 items-center justify-between px-4 z-[80] no-select"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        {/* Logo complet (contient déjà le slogan) */}
        <div className="flex items-center">
          <img
            src={logoFull}
            alt="SapSapHouse"
            className="h-9 w-auto object-contain"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Right side : Notifications + Hamburger */}
        <div className="flex items-center gap-1">
          {user && <NotificationBell />}
          <button
            onClick={() => setDrawerOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Drawer overlay */}
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
                  { label: t('nav.biens'), icon: Home, onClick: () => { setDrawerOpen(false); navigate('/'); } },
                  { label: t('nav.carte'), icon: MapPin, onClick: () => { setDrawerOpen(false); navigate('/?exploreMap=1'); } },
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

                {/* Install PWA */}
                {!isInstalled && (isInstallable || isIOS) && (
                  <div className="pt-3 mt-3 border-t border-border">
                    <button
                      onClick={handleInstall}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 text-left"
                    >
                      <Download className="h-4 w-4" />
                      Installer l'application
                    </button>
                    {showIOSHint && isIOS && (
                      <p className="text-xs text-muted-foreground px-3 pt-2 leading-relaxed">
                        Appuyez sur <Share className="inline h-3 w-3 mx-0.5" /> Partager en bas de Safari, puis choisissez « Sur l'écran d'accueil ».
                      </p>
                    )}
                  </div>
                )}
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

export default MobileHeader;
