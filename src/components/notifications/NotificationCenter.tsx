import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Loader2, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  fetchNotifications, fetchNotificationDeliveries, markAllRead, markNotificationRead, subscribeToNotifications,
  NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITY_LABEL, DELIVERY_STATUS_LABEL, type AppNotification,
} from '@/lib/notificationsService';

const PERIODS = [
  { value: 'all', label: 'Toutes les dates', ms: 0 },
  { value: '1', label: '24 dernières heures', ms: 86400000 },
  { value: '7', label: '7 derniers jours', ms: 7 * 86400000 },
  { value: '30', label: '30 derniers jours', ms: 30 * 86400000 },
];

const CHANNEL_LABEL: Record<string, string> = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email', push: 'Push' };
const catLabel = (v?: string) => NOTIFICATION_CATEGORIES.find(c => c.value === v)?.label ?? 'Système';

export default function NotificationCenter({ userId, linkPrefixMap }: { userId: string; linkPrefixMap?: (link: string) => string }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Array<{ channel: string; status: string; simulated: boolean }>>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [period, setPeriod] = useState('all');
  const [readState, setReadState] = useState('all');
  const [priority, setPriority] = useState('all');

  const load = useCallback(async () => {
    try {
      const list = await fetchNotifications(userId, 300);
      setItems(list);
      const del = await fetchNotificationDeliveries(list.slice(0, 100).map(n => n.id));
      const map: Record<string, any[]> = {};
      del.forEach(d => { (map[d.notification_id] ||= []).push(d); });
      setDeliveries(map);
    } catch (e: any) { toast.error(e.message ?? 'Chargement impossible'); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => {
    load();
    return subscribeToNotifications(userId, () => load(), n => setItems(prev => prev.map(i => i.id === n.id ? { ...i, ...n } : i)));
  }, [userId, load]);

  const filtered = useMemo(() => {
    const p = PERIODS.find(x => x.value === period)!;
    const since = p.ms ? Date.now() - p.ms : 0;
    const needle = q.trim().toLowerCase();
    return items.filter(n =>
      (category === 'all' || (n.category ?? 'system') === category) &&
      (priority === 'all' || (n.priority ?? 'normal') === priority) &&
      (readState === 'all' || (readState === 'unread' ? !n.read : n.read)) &&
      (!since || new Date(n.created_at).getTime() >= since) &&
      (!needle || `${n.title} ${n.body}`.toLowerCase().includes(needle)),
    );
  }, [items, q, category, period, readState, priority]);

  const unread = items.filter(n => !n.read).length;

  const open = async (n: AppNotification) => {
    if (!n.read) {
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read: true } : i));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.link) navigate(linkPrefixMap ? linkPrefixMap(n.link) : n.link);
  };

  const toggleRead = async (n: AppNotification) => {
    if (n.read) return;
    setItems(prev => prev.map(i => i.id === n.id ? { ...i, read: true } : i));
    markNotificationRead(n.id).catch(() => toast.error('Action impossible'));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher une notification" className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={unread === 0}
          onClick={async () => { try { await markAllRead(userId); setItems(prev => prev.map(i => ({ ...i, read: true }))); toast.success('Tout est marqué comme lu'); } catch { toast.error('Action impossible'); } }}>
          <CheckCheck className="h-4 w-4" /> Tout marquer comme lu {unread > 0 && `(${unread})`}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Catégorie"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {NOTIFICATION_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger aria-label="Période"><SelectValue /></SelectTrigger>
          <SelectContent>{PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={readState} onValueChange={setReadState}>
          <SelectTrigger aria-label="Statut de lecture"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Lues et non lues</SelectItem>
            <SelectItem value="unread">Non lues</SelectItem>
            <SelectItem value="read">Lues</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger aria-label="Priorité"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {Object.entries(NOTIFICATION_PRIORITY_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Aucune notification ne correspond.</div>
      ) : (
        <ul className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {filtered.map(n => (
            <li key={n.id} className={`flex gap-3 p-3 sm:p-4 ${!n.read ? 'bg-primary/5' : ''}`}>
              <button type="button" onClick={() => toggleRead(n)} aria-label={n.read ? 'Lue' : 'Marquer comme lue'}
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? 'bg-border' : 'bg-secondary'}`} />
              <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-sm ${n.read ? 'font-medium' : 'font-bold'} text-foreground`}>{n.title}</span>
                  {(n.priority === 'high' || n.priority === 'urgent') && (
                    <Badge variant="outline" className={`text-[9px] ${n.priority === 'urgent' ? 'border-destructive text-destructive' : 'border-secondary text-secondary'}`}>
                      {NOTIFICATION_PRIORITY_LABEL[n.priority]}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                  <span>{new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>· {catLabel(n.category)}</span>
                  <span>· {DELIVERY_STATUS_LABEL[n.delivery_status ?? 'sent'] ?? n.delivery_status}{n.read_at ? ` le ${new Date(n.read_at).toLocaleDateString('fr-FR')}` : ''}</span>
                  {(deliveries[n.id] ?? []).map(d => (
                    <span key={d.channel} className="rounded bg-muted px-1.5 py-0.5">
                      {CHANNEL_LABEL[d.channel] ?? d.channel} : {d.simulated ? 'simulation, non envoyé' : (DELIVERY_STATUS_LABEL[d.status] ?? d.status)}
                    </span>
                  ))}
                </div>
              </button>
              {n.link && <ChevronRight className="h-4 w-4 text-muted-foreground self-center shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
