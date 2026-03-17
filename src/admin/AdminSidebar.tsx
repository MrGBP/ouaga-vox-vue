import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, Home, Users, CalendarDays, Zap, MessageSquare, BarChart3, Settings, LogOut, ExternalLink, X } from 'lucide-react';
import { adminProperties, mockReservations, mockMessages } from '@/admin/data/adminMockData';

const NAV_ITEMS = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/admin', end: true },
  { label: 'Biens', icon: Home, path: '/admin/biens', badge: () => adminProperties.filter(p => p.adminStatus === 'pending').length },
  { label: 'Utilisateurs', icon: Users, path: '/admin/users' },
  { label: 'Réservations', icon: CalendarDays, path: '/admin/reservations', badge: () => mockReservations.filter(r => r.status === 'pending').length },
  { label: 'Boosts', icon: Zap, path: '/admin/boosts' },
  { label: 'Messages', icon: MessageSquare, path: '/admin/messages', badge: () => mockMessages.reduce((s, m) => s + m.unreadCount, 0) },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Paramètres', icon: Settings, path: '/admin/settings' },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('sapsap_admin_auth');
    navigate('/admin/login');
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0f172a' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 shrink-0 border-b border-white/10">
          <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center" style={{ background: '#1a3560' }}>
            <Building2 size={14} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-white">SapSapHouse</span>
          <span className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: '#e02d2d' }}>Admin</span>
          <button onClick={onClose} className="ml-auto lg:hidden text-white/60"><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const badgeCount = item.badge?.() || 0;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white border-l-[3px]'
                      : 'text-slate-400 hover:bg-white/[0.06] border-l-[3px] border-transparent'
                  }`
                }
                style={({ isActive }) => isActive ? { borderLeftColor: '#e02d2d' } : {}}
              >
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: '#e02d2d' }}>
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink size={14} />
            Voir le site →
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-slate-500 hover:text-slate-300 transition-colors w-full"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
