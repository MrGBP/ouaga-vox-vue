import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToNotifications } from '@/lib/notificationsService';

export default function NotificationAlerts() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const seen = new Set<string>();
    return subscribeToNotifications(user.id, notification => {
      if (seen.has(notification.id) || notification.read) return;
      seen.add(notification.id);
      toast(notification.title, { id: notification.id, description: notification.body });
    });
  }, [user?.id]);
  return null;
}