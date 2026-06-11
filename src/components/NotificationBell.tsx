import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchNotifications, fetchUnreadCount, markAllRead, markNotificationRead,
  subscribeToNotifications, type AppNotification,
} from '@/lib/notificationsService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'à l’instant';
  if (d < 3600) return `il y a ${Math.floor(d / 60)} min`;
  if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`;
  return `il y a ${Math.floor(d / 86400)} j`;
}

export default function NotificationBell({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setCount(0); setItems([]); return; }
    let mounted = true;
    const refresh = () => {
      fetchUnreadCount(user.id).then(c => mounted && setCount(c)).catch(() => {});
      fetchNotifications(user.id).then(list => mounted && setItems(list)).catch(() => {});
    };
    refresh();
    const unsub = subscribeToNotifications(
      user.id,
      (n) => {
        setItems(prev => [n, ...prev].slice(0, 30));
        setCount(c => c + 1);
      },
      (n) => {
        // read state changed elsewhere → re-sync
        setItems(prev => prev.map(i => i.id === n.id ? { ...i, ...n } : i));
        fetchUnreadCount(user.id).then(c => mounted && setCount(c)).catch(() => {});
      },
    );
    return () => { mounted = false; unsub(); };
  }, [user]);

  if (!user) return null;

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && count > 0) {
      await markAllRead(user.id);
      setCount(0);
      setItems(prev => prev.map(i => ({ ...i, read: true })));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className={`relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted transition-colors ${className}`}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">Aucune notification.</p>
          ) : items.map(n => (
            <button
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-muted ${!n.read ? 'bg-primary/5' : ''}`}
            >
              <div className="text-xs font-semibold text-foreground">{n.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
