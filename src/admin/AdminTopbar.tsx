import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut } from 'lucide-react';
import { adminStats } from '@/admin/data/adminMockData';
import { useState } from 'react';

const TITLES: Record<string, string> = {
  '/admin': 'Tableau de bord',
  '/admin/biens': 'Gestion des biens',
  '/admin/users': 'Utilisateurs',
  '/admin/reservations': 'Réservations',
  '/admin/boosts': 'Boosts',
  '/admin/messages': 'Messages',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Paramètres',
};

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = TITLES[location.pathname] || 'Administration';
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="h-14 shrink-0 border-b border-border bg-card flex items-center px-4 gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg hover:bg-muted">
        <Menu size={20} className="text-foreground" />
      </button>

      <h2 className="text-sm font-semibold text-foreground flex-1">{title}</h2>

      {/* Bell */}
      <button className="relative p-2 rounded-lg hover:bg-muted">
        <Bell size={18} className="text-muted-foreground" />
        {adminStats.alertes > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#e02d2d' }} />
        )}
      </button>

      {/* Avatar */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{ background: '#1a3560' }}
        >
          AD
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-10 w-40 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
            <button
              onClick={() => { localStorage.removeItem('sapsap_admin_auth'); navigate('/admin/login'); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
