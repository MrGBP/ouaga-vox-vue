import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Ban } from 'lucide-react';
import { useAdminStore, adminStore } from '@/admin/store/adminStore';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminCard from '@/admin/components/AdminCard';
import AdminBadge from '@/admin/components/AdminBadge';
import ConfirmDialog from '@/admin/components/ConfirmDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { revenueHistory } from '@/admin/data/adminMockData';
import type { Boost } from '@/admin/types';

const PLANS: Array<{ key: Boost['type']; name: string; price: number; periodDays: number; periodLabel: string; features: string[]; color: string; popular?: boolean }> = [
  { key: 'starter', name: 'Starter', price: 2500, periodDays: 7, periodLabel: '/sem', features: ['7 jours de visibilité', 'Badge "Mis en avant"', '~50 vues supplémentaires'], color: '#64748b' },
  { key: 'standard', name: 'Standard', price: 7500, periodDays: 30, periodLabel: '/mois', features: ['30 jours de visibilité', 'Position prioritaire', '~150 vues supplémentaires', 'Badge Premium'], color: '#2563eb' },
  { key: 'premium', name: 'Premium', price: 15000, periodDays: 30, periodLabel: '/mois', features: ['30 jours top position', 'Photo agrandie', '~300 vues supplémentaires', 'Notification push'], color: '#d97706', popular: true },
  { key: 'annual', name: 'Annuel', price: 25000, periodDays: 90, periodLabel: '/trim', features: ['90 jours de visibilité', 'Toutes les features Premium', 'Analytics détaillés', 'Support prioritaire'], color: '#059669' },
];

export default function AdminBoosts() {
  const boosts = useAdminStore(s => s.boosts);
  const properties = useAdminStore(s => s.properties);
  const [planForCreate, setPlanForCreate] = useState<Boost['type'] | null>(null);
  const [propertyChoice, setPropertyChoice] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalRevenue = useMemo(() => boosts.reduce((s, b) => s + b.price, 0), [boosts]);
  const eligible = useMemo(() => properties.filter(p => p.adminStatus === 'published'), [properties]);

  const subscribe = () => {
    if (!planForCreate || !propertyChoice) return;
    const plan = PLANS.find(p => p.key === planForCreate)!;
    const prop = properties.find(p => p.id === propertyChoice);
    if (!prop) return;
    const start = new Date();
    const end = new Date(Date.now() + plan.periodDays * 86400000);
    adminStore.addBoost({
      propertyId: prop.id,
      propertyTitle: prop.title,
      ownerId: prop.ownerId || 'unknown',
      ownerName: prop.ownerName || 'Inconnu',
      type: plan.key,
      price: plan.price,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
    toast.success(`Boost ${plan.name} activé pour "${prop.title}"`);
    setPlanForCreate(null);
    setPropertyChoice('');
  };

  const cancel = (id: string) => {
    adminStore.cancelBoost(id);
    toast.success('Boost annulé');
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    adminStore.deleteBoost(deleteId);
    toast.success('Boost supprimé');
    setDeleteId(null);
  };

  return (
    <div>
      <AdminPageHeader title="Boosts" subtitle={`${boosts.filter(b => b.status === 'active').length} boosts actifs · ${totalRevenue.toLocaleString('fr-FR')} FCFA`} />

      {/* Plans cliquables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {PLANS.map(plan => (
          <div key={plan.key} className={`rounded-xl border ${plan.popular ? 'border-amber-400 ring-2 ring-amber-200' : 'border-border'} bg-card p-5 relative flex flex-col`}>
            {plan.popular && <span className="absolute -top-2.5 left-4 rounded-full px-2 py-0.5 text-[10px] font-bold text-white bg-amber-500">Populaire</span>}
            <p className="text-xs font-semibold" style={{ color: plan.color }}>{plan.name}</p>
            <p className="text-xl font-bold text-foreground mt-1">{plan.price.toLocaleString('fr-FR')} <span className="text-xs font-normal text-muted-foreground">FCFA{plan.periodLabel}</span></p>
            <ul className="mt-3 space-y-1.5 flex-1">
              {plan.features.map((f, i) => <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">✓</span>{f}</li>)}
            </ul>
            <button onClick={() => { setPlanForCreate(plan.key); setPropertyChoice(''); }} className="mt-4 h-9 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:opacity-90" style={{ background: plan.color }}>
              <Plus size={12} /> Souscrire
            </button>
          </div>
        ))}
      </div>

      {/* Modal sélection bien */}
      {planForCreate && (
        <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={() => setPlanForCreate(null)}>
          <div className="bg-card rounded-xl p-5 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold">Souscrire au plan {PLANS.find(p => p.key === planForCreate)?.name}</h3>
            <p className="text-xs text-muted-foreground">Sélectionnez un bien publié à booster :</p>
            <select value={propertyChoice} onChange={e => setPropertyChoice(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background">
              <option value="">— Choisir un bien —</option>
              {eligible.map(p => <option key={p.id} value={p.id}>{p.title} — {p.quartier}</option>)}
            </select>
            {eligible.length === 0 && <p className="text-[11px] text-amber-600">Aucun bien publié disponible. Publiez d'abord un bien.</p>}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setPlanForCreate(null)} className="px-4 py-2 rounded-lg text-xs font-medium bg-muted">Annuler</button>
              <button onClick={subscribe} disabled={!propertyChoice} className="px-4 py-2 rounded-lg text-xs font-semibold text-primary-foreground bg-primary disabled:opacity-50">Confirmer la souscription</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto mb-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3">Bien</th>
              <th className="px-4 py-3">Propriétaire</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Début</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Vues</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Progression</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boosts.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">Aucun boost — souscrivez à un plan ci-dessus.</td></tr>}
            {boosts.map(b => {
              const start = new Date(b.startDate).getTime();
              const end = new Date(b.endDate).getTime();
              const now = Date.now();
              const progress = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
              const plan = PLANS.find(p => p.key === b.type);
              return (
                <tr key={b.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{b.propertyTitle}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.ownerName}</td>
                  <td className="px-4 py-2.5"><span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: (plan?.color || '#64748b') + '20', color: plan?.color }}>{plan?.name || b.type}</span></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.startDate}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.endDate}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{b.viewsGenerated}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{b.price.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2.5">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{progress}%</span>
                  </td>
                  <td className="px-4 py-2.5"><AdminBadge variant={b.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {b.status === 'active' && (
                        <button onClick={() => cancel(b.id)} title="Annuler" className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center"><Ban size={12} /></button>
                      )}
                      <button onClick={() => setDeleteId(b.id)} title="Supprimer" className="w-7 h-7 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminCard title="Revenus boosts (6 mois)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="boosts" fill="#d97706" name="Boosts" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </AdminCard>

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer ce boost ?"
        message="Cette action est irréversible."
        destructive
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
