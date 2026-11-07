import { useNavigate } from 'react-router-dom';
import { goBack } from '@/lib/returnTo';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PageSeo from '@/components/PageSeo';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import PushNotificationsToggle from '@/components/PushNotificationsToggle';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth?redirect=/notifications" replace />;
  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Notifications | SapSapHouse" description="Toutes vos notifications SapSapHouse : réservations, paiements et messages." path="/notifications" heading="Centre de notifications" />
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <button type="button" aria-label="Retour" onClick={() => goBack(navigate)} className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-foreground hover:bg-muted active:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold text-foreground">Notifications</h1>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-5 space-y-4">
        <PushNotificationsToggle />
        <NotificationCenter userId={user.id} />
      </main>
    </div>
  );
}
