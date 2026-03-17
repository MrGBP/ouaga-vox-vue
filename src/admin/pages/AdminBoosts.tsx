import { mockBoosts, revenueHistory } from '@/admin/data/adminMockData';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminCard from '@/admin/components/AdminCard';
import AdminBadge from '@/admin/components/AdminBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PLANS = [
  { name: 'Starter', price: '2 500', period: '/sem', features: ['7 jours de visibilité', 'Badge "Mis en avant"', '~50 vues supplémentaires'], color: '#64748b' },
  { name: 'Standard', price: '7 500', period: '/mois', features: ['30 jours de visibilité', 'Position prioritaire', '~150 vues supplémentaires', 'Badge Premium'], color: '#2563eb' },
  { name: 'Premium', price: '15 000', period: '/mois', features: ['30 jours top position', 'Photo agrandie', '~300 vues supplémentaires', 'Notification push'], color: '#d97706', popular: true },
  { name: 'Annuel', price: '25 000', period: '/trim', features: ['90 jours de visibilité', 'Toutes les features Premium', 'Analytics détaillés', 'Support prioritaire'], color: '#059669' },
];

export default function AdminBoosts() {
  const totalRevenue = mockBoosts.reduce((s, b) => s + b.price, 0);

  return (
    <div>
      <AdminPageHeader title="Boosts" subtitle={`${mockBoosts.length} boosts actifs · ${totalRevenue.toLocaleString('fr-FR')} FCFA`} />

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {PLANS.map(plan => (
          <div key={plan.name} className={`rounded-xl border ${plan.popular ? 'border-amber-400 ring-2 ring-amber-200' : 'border-border'} bg-card p-5 relative`}>
            {plan.popular && <span className="absolute -top-2.5 left-4 rounded-full px-2 py-0.5 text-[10px] font-bold text-white bg-amber-500">Populaire</span>}
            <p className="text-xs font-semibold" style={{ color: plan.color }}>{plan.name}</p>
            <p className="text-xl font-bold text-foreground mt-1">{plan.price} <span className="text-xs font-normal text-muted-foreground">FCFA{plan.period}</span></p>
            <ul className="mt-3 space-y-1.5">
              {plan.features.map((f, i) => <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">✓</span>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>

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
              <th className="px-4 py-3">Vues générées</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Progression</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {mockBoosts.map(b => {
              const start = new Date(b.startDate).getTime();
              const end = new Date(b.endDate).getTime();
              const now = Date.now();
              const progress = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
              return (
                <tr key={b.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{b.propertyTitle}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.ownerName}</td>
                  <td className="px-4 py-2.5"><span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: PLANS.find(p => p.name.toLowerCase() === b.type)?.color + '20', color: PLANS.find(p => p.name.toLowerCase() === b.type)?.color }}>{b.type}</span></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.startDate}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.endDate}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{b.viewsGenerated}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{b.price.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-4 py-2.5">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{progress}%</span>
                  </td>
                  <td className="px-4 py-2.5"><AdminBadge variant={b.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Revenue chart */}
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
    </div>
  );
}
