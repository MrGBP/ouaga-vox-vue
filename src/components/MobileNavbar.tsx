import { useState } from 'react';
import { Building2, Menu, X, ChevronLeft, Home as HomeIcon, Phone, FileText, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export type NavLevel = 1 | 2 | 3;

interface MobileNavbarProps {
  level: NavLevel;
  quartierName?: string;
  quartierCount?: number;
  propertyTitle?: string;
  propertyQuartier?: string;
  onBack?: () => void;
  onHome?: () => void;
}

const LevelDots = ({ level }: { level: NavLevel }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3].map(i => (
      <div
        key={i}
        className={`rounded-[3px] transition-all duration-200 ${
          i === level
            ? 'w-[14px] h-[5px] bg-primary'
            : 'w-[5px] h-[5px] bg-muted-foreground/30'
        }`}
      />
    ))}
  </div>
);

const MobileNavbar = ({
  level,
  quartierName,
  quartierCount,
  propertyTitle,
  propertyQuartier,
  onBack,
  onHome,
}: MobileNavbarProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav
        className="flex lg:hidden fixed top-0 left-0 right-0 items-center justify-between px-3 z-[80] no-select"
        style={{
          height: 52,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '0.5px solid hsl(var(--border))',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {level === 1 ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground truncate">SapSapHouse</span>
            </>
          ) : (
            <>
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] -ml-1.5"
              >
                <ChevronLeft className="h-4 w-4 text-primary-foreground" />
              </button>
              {level === 2 ? (
                <span className="text-sm font-semibold text-foreground truncate">
                  {quartierName} · <span className="text-muted-foreground font-normal">{quartierCount} bien{(quartierCount || 0) > 1 ? 's' : ''}</span>
                </span>
              ) : (
                <span className="text-sm font-semibold text-foreground truncate">
                  {propertyTitle} · <span className="text-muted-foreground font-normal text-xs">{propertyQuartier}</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* Center: dots */}
        <div className="shrink-0 mx-2">
          <LevelDots level={level} />
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 shrink-0">
          {level === 3 && onHome && (
            <button
              onClick={onHome}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center min-h-[44px] min-w-[44px]"
              title="Retour accueil"
            >
              <HomeIcon className="h-4 w-4 text-secondary-foreground" />
            </button>
          )}
          {level === 1 && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
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
                <span className="text-sm font-bold text-foreground">Menu</span>
                <button onClick={() => setDrawerOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {[
                  { label: 'Biens', icon: HomeIcon, href: '#properties' },
                  { label: 'Carte', icon: MapPin, href: '#map' },
                  { label: 'Publier votre bien', icon: FileText, href: '#publish' },
                ].map(item => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="p-4 border-t border-border">
                <Button className="w-full bg-secondary text-secondary-foreground gap-2">
                  <Phone className="h-4 w-4" /> Contact
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
