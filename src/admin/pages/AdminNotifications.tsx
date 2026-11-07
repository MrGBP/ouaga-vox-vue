import { useAuth } from '@/hooks/useAuth';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function AdminNotifications() {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl">
      <AdminPageHeader title="Centre de notifications" subtitle="Paiements simulés, réservations à confirmer, refus, expirations, conflits de calendrier et activité des propriétaires." />
      {user ? <NotificationCenter userId={user.id} /> : <p className="text-sm text-muted-foreground">Connectez-vous avec un compte administrateur.</p>}
    </div>
  );
}
