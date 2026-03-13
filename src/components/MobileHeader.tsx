import { Building2, Menu, X, Home, MapPin, Phone, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const MobileHeader = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header
        className="flex lg:hidden fixed top-0 left-0 right-0 h-14 items-center justify-between px-4 z-[100] no-select"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">SapSapHouse</span>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
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
                <span className="text-sm font-bold text-foreground">Menu</span>
                <button onClick={() => setDrawerOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {[
                  { label: 'Biens', icon: Home, href: '#properties' },
                  { label: 'Carte', icon: MapPin, href: '#map' },
                  { label: 'Quartiers', icon: MapPin, href: '#quartiers' },
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

export default MobileHeader;
