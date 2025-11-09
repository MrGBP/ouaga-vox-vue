import { Building2 } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-warm">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SapSapHouse</h1>
              <p className="text-sm text-muted-foreground">Mon bien Immo en un clic</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
