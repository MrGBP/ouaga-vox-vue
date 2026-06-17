import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import AdminSidebar from '@/admin/AdminSidebar';
import AdminTopbar from '@/admin/AdminTopbar';
import AdminLogin from '@/admin/pages/AdminLogin';
import AdminDashboard from '@/admin/pages/AdminDashboard';
import AdminBiens from '@/admin/pages/AdminBiens';
import AdminBiensLive from '@/admin/pages/AdminBiensLive';
import AdminModeration from '@/admin/pages/AdminModeration';
import AdminUsers from '@/admin/pages/AdminUsers';
import AdminUsersLive from '@/admin/pages/AdminUsersLive';
import AdminReservations from '@/admin/pages/AdminReservations';
import AdminReservationsLive from '@/admin/pages/AdminReservationsLive';
import AdminBoosts from '@/admin/pages/AdminBoosts';
import AdminMessages from '@/admin/pages/AdminMessages';
import AdminAnalytics from '@/admin/pages/AdminAnalytics';
import AdminSettings from '@/admin/pages/AdminSettings';
import AdminCountries from '@/admin/pages/AdminCountries';
import { useAuth } from '@/hooks/useAuth';

function AdminProtected() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin, isReadOnlyAdmin, loading } = useAuth();
  const localBypass = !!localStorage.getItem('sapsap_admin_auth');

  if (loading) return null;
  if (!isAdmin && !localBypass) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-muted ${isReadOnlyAdmin ? 'admin-readonly' : ''}`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        {isReadOnlyAdmin && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 border-b border-amber-300">
            <Eye size={14} />
            Mode lecture seule — vous observez la plateforme. Aucune modification n'est autorisée.
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="biens" element={<AdminBiens />} />
            <Route path="biens-live" element={<AdminBiensLive />} />
            <Route path="moderation" element={<AdminModeration />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users-live" element={<AdminUsersLive />} />
            <Route path="reservations" element={<AdminReservationsLive />} />
            <Route path="reservations-demo" element={<AdminReservations />} />
            <Route path="boosts" element={<AdminBoosts />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="pays" element={<AdminCountries />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="*" element={<AdminProtected />} />
    </Routes>
  );
}
