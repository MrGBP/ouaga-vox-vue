import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAdminStore, adminStore } from '@/admin/store/adminStore';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminKPICard from '@/admin/components/AdminKPICard';
import AdminBadge from '@/admin/components/AdminBadge';
import ConfirmDialog from '@/admin/components/ConfirmDialog';
import { CalendarDays, TrendingUp, Percent, DollarSign, Check, X, FileText, Trash2 } from 'lucide-react';
import type { ReservationStatus } from '@/admin/types';

const COLUMNS: { status: ReservationStatus; label: string; headerBg: string }[] = [
  { status: 'pending', label: 'En attente', headerBg: '#fef3c7' },
  { status: 'confirmed', label: 'Confirmée', headerBg: '#dbeafe' },
  { status: 'in_progress', label: 'En cours', headerBg: '#f0fdf4' },
  { status: 'completed', label: 'Terminée', headerBg: '#f1f5f9' },
  { status: 'cancelled', label: 'Annulée', headerBg: '#fee2e2' },
];

export default function AdminReservations() {
  const reservations = useAdminStore(s => s.reservations);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalRevenue = useMemo(() => reservations.reduce((s, r) => s + r.amount, 0), [reservations]);
  const totalCommission = useMemo(() => reservations.reduce((s, r) => s + r.commission, 0), [reservations]);
  const confirmed = reservations.filter(r => r.status === 'confirmed' || r.status === 'completed').length;
  const confirmRate = reservations.length ? Math.round((confirmed / reservations.length) * 100) : 0;

  const setStatus = (id: string, status: ReservationStatus, msg: string) => {
    adminStore.setReservationStatus(id, status);
    toast.success(msg);
  };
  const confirmDelete = () => {
    if (!deleteId) return;
    adminStore.deleteReservation(deleteId);
    toast.success('Réservation supprimée');
    setDeleteId(null);
  };

  return (
    <div>
      <AdminPageHeader title="Réservations" subtitle={`${reservations.length} réservations`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <AdminKPICard title="Ce mois" value={reservations.length} icon={CalendarDays} iconBg="#dbeafe" iconColor="#2563eb" />
        <AdminKPICard title="Revenus bruts" value={`${totalRevenue.toLocaleString('fr-FR')} FCFA`} icon={TrendingUp} iconBg="#dcfce7" iconColor="#15803d" />
        <AdminKPICard title="Commissions" value={`${totalCommission.toLocaleString('fr-FR')} FCFA`} icon={DollarSign} iconBg="#fce7f3" iconColor="#be185d" />
        <AdminKPICard title="Taux confirmation" value={`${confirmRate}%`} icon={Percent} iconBg="#fef3c7" iconColor="#d97706" />
      </div>

      <div className="flex gap-1 mb-4">
        <button onClick={() => setView('kanban')} className={`rounded-lg px-4 py-1.5 text-xs font-medium ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>📋 Kanban</button>
        <button onClick={() => setView('table')} className={`rounded-lg px-4 py-1.5 text-xs font-medium ${view === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>📊 Tableau</button>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const items = reservations.filter(r => r.status === col.status);
            return (
              <div key={col.status} className="min-w-[260px] flex-1">
                <div className="rounded-t-lg px-3 py-2 text-xs font-semibold" style={{ background: col.headerBg }}>
                  {col.label} ({items.length})
                </div>
                <div className="space-y-2 mt-2">
                  {items.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">Aucune</p>}
                  {items.map(r => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        {r.propertyImage && <img src={r.propertyImage} alt="" className="w-9 h-9 rounded-md object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />}
                        <p className="text-xs font-semibold text-foreground truncate flex-1">{r.propertyTitle}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{r.tenantName}</p>
                      <p className="text-[11px] text-muted-foreground">📅 {r.checkIn} → {r.checkOut} · {r.nights} nuit(s)</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{r.amount.toLocaleString('fr-FR')} FCFA</span>
                        <span className="text-[10px] text-muted-foreground">{r.commission.toLocaleString('fr-FR')} com.</span>
                      </div>
                      <select value={r.status} onChange={e => setStatus(r.id, e.target.value as ReservationStatus, 'Statut mis à jour')} className="w-full text-[10px] border border-border rounded px-1.5 py-1 bg-background">
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                      <div className="flex gap-1">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => setStatus(r.id, 'confirmed', 'Réservation confirmée')} className="flex-1 h-7 rounded-md bg-emerald-600 text-white text-[11px] font-semibold">✓ Confirmer</button>
                            <button onClick={() => setStatus(r.id, 'cancelled', 'Réservation annulée')} className="flex-1 h-7 rounded-md bg-red-600 text-white text-[11px] font-semibold">✗ Annuler</button>
                          </>
                        )}
                        <button onClick={() => setDeleteId(r.id)} title="Supprimer" className="h-7 px-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Bien</th>
                <th className="px-4 py-3">Locataire</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Nuits</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">Aucune réservation</td></tr>}
              {reservations.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{r.propertyTitle}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.tenantName}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{r.checkIn} → {r.checkOut}</td>
                  <td className="px-4 py-2.5 text-xs text-center">{r.nights}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold">{r.amount.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.commission.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2.5"><AdminBadge variant={r.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {r.status === 'pending' && <button onClick={() => setStatus(r.id, 'confirmed', 'Confirmée')} className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center"><Check size={13} /></button>}
                      {r.status === 'pending' && <button onClick={() => setStatus(r.id, 'cancelled', 'Annulée')} className="w-7 h-7 rounded-md bg-red-100 text-red-700 flex items-center justify-center"><X size={13} /></button>}
                      <button onClick={() => toast.info('Détails à venir')} className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center"><FileText size={13} /></button>
                      <button onClick={() => setDeleteId(r.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer cette réservation ?"
        message="Cette action est irréversible."
        destructive
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
