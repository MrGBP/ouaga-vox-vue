import { useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, Link } from 'react-router-dom';
import { Loader2, LayoutDashboard, Home, Calendar, MessageSquare, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useOwnerNotifications } from './lib/useOwnerNotifications';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProperties from './pages/OwnerProperties';
import OwnerReservations from './pages/OwnerReservations';
import OwnerMessages from './pages/OwnerMessages';

const NAV = [
  { to: '/proprietaire', label: 'Vue d\'ensemble', icon: LayoutDashboard, end: true, badgeKey: null as null | 'total' },
  { to: '/proprietaire/biens', label: 'Mes biens', icon: Home, badgeKey: null },
  { to: '/proprietaire/reservations', label: 'Réservations', icon: Calendar, badgeKey: 'pendingReservations' as const },
  { to: '/proprietaire/messages', label: 'Messages', icon: MessageSquare, badgeKey: 'unreadMessages' as const },
];

export default function OwnerLayout() {
  const { user, isOwner, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const notif = useOwnerNotifications(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate('/auth?redirect=/proprietaire');
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return null;
  if (!isOwner) return <Navigate to="/mon-compte" replace />;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Topbar */}
      <header className="bg-card border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Site
            </Link>
            <span className="h-5 w-px bg-border" />
            <h1 className="text-sm font-bold text-foreground truncate">Espace propriétaire</h1>
            {notif.total > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {notif.total}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
            <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
        {/* Tabs */}
        <nav className="container mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto scrollbar-none">
          {NAV.map(({ to, label, icon: Icon, end, badgeKey }) => {
            const count = badgeKey ? (notif as any)[badgeKey] as number : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" /> {label}
                {count > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold">
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-5 max-w-6xl w-full">
        <Routes>
          <Route index element={<OwnerDashboard />} />
          <Route path="biens" element={<OwnerProperties />} />
          <Route path="reservations" element={<OwnerReservations />} />
          <Route path="messages" element={<OwnerMessages />} />
          <Route path="*" element={<Navigate to="/proprietaire" replace />} />
        </Routes>
      </main>
    </div>
  );
}
