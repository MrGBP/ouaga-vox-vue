import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from '@/admin/AdminSidebar';
import AdminTopbar from '@/admin/AdminTopbar';
import AdminLogin from '@/admin/pages/AdminLogin';
import AdminDashboard from '@/admin/pages/AdminDashboard';
import AdminBiens from '@/admin/pages/AdminBiens';
import AdminUsers from '@/admin/pages/AdminUsers';
import AdminReservations from '@/admin/pages/AdminReservations';
import AdminBoosts from '@/admin/pages/AdminBoosts';
import AdminMessages from '@/admin/pages/AdminMessages';
import AdminAnalytics from '@/admin/pages/AdminAnalytics';
import AdminSettings from '@/admin/pages/AdminSettings';

function AdminProtected() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!localStorage.getItem('sapsap_admin_auth')) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="biens" element={<AdminBiens />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="boosts" element={<AdminBoosts />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
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
