import { Home, Search, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  favoritesCount?: number;
}

const MobileBottomNav = ({ activeTab, onTabChange, favoritesCount = 0 }: MobileBottomNavProps) => {
  // 4 onglets (Hick's Law) — search fusionné dans Explorer/home
  const tabs = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'search', label: 'Explorer', icon: Search },
    { id: 'favorites', label: 'Favoris', icon: Heart },
    { id: 'profile', label: 'Compte', icon: User },
  ];
  return (
    <nav
      className="flex lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border justify-around items-center z-[90] no-select"
      style={{
        height: 'calc(56px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.04)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id || (activeTab === 'map' && tab.id === 'search');
        const Icon = tab.icon;
        return (
          <Button variant="ghost"
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative h-[52px] rounded-none flex flex-col items-center justify-center gap-0 flex-1 transition-transform active:scale-95"
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={`h-[22px] w-[22px] transition-colors ${isActive ? 'text-secondary' : 'text-muted-foreground'}`}
              strokeWidth={isActive ? 2.4 : 1.75}
            />
            <span
              className={`text-[10px] mt-0.5 font-medium transition-colors ${
                isActive ? 'text-secondary' : 'text-muted-foreground/80'
              }`}
            >
              {tab.label}
            </span>
            {tab.id === 'favorites' && favoritesCount > 0 && (
              <span className="absolute top-1 right-[22%] min-w-[16px] h-4 rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                {favoritesCount}
              </span>
            )}
          </Button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
