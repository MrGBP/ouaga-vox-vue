import { Building2, MapPin, Phone, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-warm">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <h1 className="text-xl font-bold text-foreground tracking-tight">SapSapHouse</h1>
              <p className="text-[11px] text-muted-foreground font-medium tracking-wide">Mon bien Immo en un clic</p>
            </div>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#properties" className="hover:text-foreground transition-colors">Biens</a>
            <a href="#map" className="hover:text-foreground transition-colors">Carte</a>
            <a href="#quartiers" className="hover:text-foreground transition-colors">Quartiers</a>
          </nav>

          {/* CTA + contact */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Ouagadougou, BF</span>
            </div>
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
              <Phone className="h-3.5 w-3.5" />
              Contact
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <a href="#properties" className="text-sm font-medium text-foreground py-2">Biens</a>
              <a href="#map" className="text-sm font-medium text-foreground py-2">Carte</a>
              <a href="#quartiers" className="text-sm font-medium text-foreground py-2">Quartiers</a>
              <Button size="sm" className="bg-secondary text-secondary-foreground mt-2 w-full gap-2">
                <Phone className="h-3.5 w-3.5" />
                Nous contacter
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
