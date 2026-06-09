import { Home, Map, Search, Heart, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  favoritesCount?: number;
}

const MobileBottomNav = ({ activeTab, onTabChange, favoritesCount = 0 }: MobileBottomNavProps) => {
  const { t } = useTranslation();
  const tabs = [
    { id: 'home', label: t('nav.accueil'), icon: Home, emoji: '🏠' },
    { id: 'map', label: t('nav.carte'), icon: Map, emoji: '🗺️' },
    { id: 'search', label: t('nav.chercher'), icon: Search, emoji: '🔍' },
    { id: 'favorites', label: t('nav.favoris'), icon: Heart, emoji: '❤️' },
    { id: 'profile', label: t('nav.profil'), icon: User, emoji: '👤' },
  ];
  return (
    <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border justify-around items-center z-[90] no-select"
      style={{ height: 'calc(52px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center justify-center min-h-[48px] min-w-[48px] transition-colors"
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={isActive ? 2.5 : 1.5} />
            {isActive && (
              <span className="text-[10px] font-semibold text-primary mt-0.5">{tab.label}</span>
            )}
            {tab.id === 'favorites' && favoritesCount > 0 && (
              <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                {favoritesCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
