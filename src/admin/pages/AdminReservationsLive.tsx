import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Phone, Mail, MessageSquare, RefreshCw, Trash2, Check, X, CalendarClock, MessagesSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReservationChat from '@/components/ReservationChat';
import {
  listMyReservations,
  subscribeReservations,
  updateReservationStatus,
  deleteReservation,
  reservationKindLabel,
  type ReservationRow,
  type ReservationStatus,
} from '@/lib/reservationsService';

const COLUMNS: { status: ReservationStatus; label: string; bg: string; ring: string }[] = [
  { status: 'pending',   label: 'En attente', bg: '#fef3c7', ring: '#f59e0b' },
  { status: 'confirmed', label: 'Confirmée',  bg: '#dbeafe', ring: '#3b82f6' },
  { status: 'completed', label: 'Terminée',   bg: '#dcfce7', ring: '#16a34a' },
  { status: 'cancelled', label: 'Annulée',    bg: '#fee2e2', ring: '#dc2626' },
];

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export default function AdminReservationsLive() {
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chatRow, setChatRow] = useState<ReservationRow | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyReservations();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Realtime: refresh on any change
    const unsub = subscribeReservations(({ type, row }) => {
      setRows(prev => {
        if (type === 'DELETE') return prev.filter(r => r.id !== row.id);
        const idx = prev.findIndex(r => r.id === row.id);
        if (idx === -1) {
          // INSERT
          toast.info('📬 Nouvelle demande reçue', { description: `${row.contact_name} · ${reservationKindLabel(row.kind)}` });
          return [row, ...prev];
        }
        // UPDATE
        const next = prev.slice();
        next[idx] = row;
        return next;
      });
    });
    return () => unsub();
  }, []);

  const counts = useMemo(() => {
    const c: Record<ReservationStatus, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    rows.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const setStatus = async (id: string, status: ReservationStatus) => {
    setBusyId(id);
    try {
      await updateReservationStatus(id, status);
      toast.success('Statut mis à jour');
    } catch (e: any) {
      toast.error('Erreur', { description: e?.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cette demande ?')) return;
    setBusyId(id);
    try {
      await deleteReservation(id);
      toast.success('Demande supprimée');
    } catch (e: any) {
      toast.error('Erreur', { description: e?.message });
    } finally {
      setBusyId(null);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement des demandes…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
        <button onClick={fetchAll} className="ml-3 underline">Réessayer</button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
        <CalendarClock className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Aucune demande pour le moment.</p>
        <p className="text-xs mt-1">Les nouvelles demandes apparaîtront ici en temps réel.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          🟢 Live · {rows.length} demande{rows.length > 1 ? 's' : ''} · mise à jour en temps réel
        </p>
        <button onClick={fetchAll} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Actualiser
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const items = rows.filter(r => r.status === col.status);
          return (
            <div key={col.status} className="min-w-[280px] flex-1">
              <div
                className="rounded-t-lg px-3 py-2 text-xs font-semibold flex items-center justify-between"
                style={{ background: col.bg }}
              >
                <span>{col.label}</span>
                <span className="text-foreground/70">{counts[col.status] ?? 0}</span>
              </div>

              <div className="space-y-2 mt-2">
                {items.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-4">Vide</p>
                )}

                {items.map(r => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{r.contact_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {reservationKindLabel(r.kind)} · {fmtDateTime(r.created_at)}
                        </p>
                      </div>
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ background: col.bg, color: col.ring }}
                      >
                        {r.kind === 'visit' ? 'Visite' : r.kind === 'booking' ? 'Séjour' : 'Location'}
                      </span>
                    </div>

                    {(r.start_date || r.visit_at) && (
                      <p className="text-[11px] text-muted-foreground">
                        📅 {r.kind === 'visit' && r.visit_at
                          ? fmtDateTime(r.visit_at)
                          : `${fmtDate(r.start_date)} → ${fmtDate(r.end_date)}`}
                      </p>
                    )}

                    {r.total_price && (
                      <p className="text-xs font-semibold text-foreground">
                        💰 {Number(r.total_price).toLocaleString('fr-FR')} FCFA
                      </p>
                    )}

                    {r.message && (
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2 bg-muted/40 px-2 py-1 rounded">
                        « {r.message} »
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border-t border-border pt-1.5">
                      <a href={`tel:${r.contact_phone}`} className="flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" /> {r.contact_phone}
                      </a>
                      {r.contact_email && (
                        <a href={`mailto:${r.contact_email}`} className="flex items-center gap-1 hover:text-primary truncate">
                          <Mail className="h-3 w-3" /> {r.contact_email}
                        </a>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {r.status === 'pending' && (
                        <>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => setStatus(r.id, 'confirmed')}
                            className="flex-1 h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Check size={12} /> Confirmer
                          </button>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => setStatus(r.id, 'cancelled')}
                            className="h-7 px-2 rounded-md bg-destructive/10 text-destructive text-[11px] font-semibold disabled:opacity-50"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      {r.status === 'confirmed' && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, 'completed')}
                          className="flex-1 h-7 rounded-md bg-emerald-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Check size={12} /> Marquer terminée
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${r.contact_phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Bonjour ${r.contact_name}, concernant votre demande sur SapSapHouse…`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                        className="h-7 px-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center"
                      >
                        <MessageSquare size={12} />
                      </a>
                      <button
                        disabled={busyId === r.id}
                        onClick={() => handleDelete(r.id)}
                        title="Supprimer"
                        className="h-7 px-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
