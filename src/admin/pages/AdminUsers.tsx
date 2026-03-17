import { useState } from 'react';
import { mockTenants, mockOwners, adminProperties } from '@/admin/data/adminMockData';
import { isTypeFurnished } from '@/lib/mockData';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminBadge from '@/admin/components/AdminBadge';
import { X } from 'lucide-react';

export default function AdminUsers() {
  const [tab, setTab] = useState<'tenants' | 'owners'>('tenants');
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  const owner = selectedOwner ? mockOwners.find(o => o.id === selectedOwner) : null;
  const ownerBiens = owner ? adminProperties.filter(p => p.ownerName === owner.name) : [];

  return (
    <div className="relative">
      <AdminPageHeader title="Utilisateurs" subtitle={`${mockTenants.length} locataires · ${mockOwners.length} propriétaires`} />

      <div className="flex gap-1 mb-4">
        <button onClick={() => setTab('tenants')} className={`rounded-lg px-4 py-1.5 text-xs font-medium ${tab === 'tenants' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
          Locataires ({mockTenants.length})
        </button>
        <button onClick={() => setTab('owners')} className={`rounded-lg px-4 py-1.5 text-xs font-medium ${tab === 'owners' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
          Propriétaires ({mockOwners.length})
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        {tab === 'tenants' ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Inscrit</th>
                <th className="px-4 py-3">Recherches</th>
                <th className="px-4 py-3">Biens vus</th>
                <th className="px-4 py-3">Favoris</th>
                <th className="px-4 py-3">Réservations</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {mockTenants.map(t => (
                <tr key={t.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#1a3560' }}>
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-medium text-foreground">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.phone}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.searchCount}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.viewCount}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.favoriteCount}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.reservationCount}</td>
                  <td className="px-4 py-2.5">
                    <AdminBadge variant={(t.reservationCount || 0) > 0 ? 'active' : 'inactive'} label={(t.reservationCount || 0) > 0 ? 'Actif' : 'Inactif'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Nb biens</th>
                <th className="px-4 py-3">Vues totales</th>
                <th className="px-4 py-3">Revenus FCFA</th>
                <th className="px-4 py-3">Commission FCFA</th>
              </tr>
            </thead>
            <tbody>
              {mockOwners.map(o => (
                <tr key={o.id} onClick={() => setSelectedOwner(o.id)} className="border-b border-border hover:bg-muted/50 cursor-pointer">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#1a3560' }}>
                        {o.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-medium text-foreground">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{o.phone}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{o.propertyCount}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{o.totalViews}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600">{(o.totalRevenue || 0).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600">{(o.totalCommission || 0).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Owner drawer */}
      {owner && (
        <div className="fixed top-0 right-0 bottom-0 w-[400px] bg-card shadow-2xl z-[200] overflow-y-auto border-l border-border">
          <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">{owner.name}</h3>
            <button onClick={() => setSelectedOwner(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Biens</span><p className="text-lg font-bold text-foreground">{owner.propertyCount}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Vues</span><p className="text-lg font-bold text-foreground">{owner.totalViews}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Revenus</span><p className="text-lg font-bold text-emerald-600">{(owner.totalRevenue || 0).toLocaleString('fr-FR')}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Commission</span><p className="text-lg font-bold text-emerald-600">{(owner.totalCommission || 0).toLocaleString('fr-FR')}</p></div>
            </div>
            <h4 className="text-xs font-semibold text-foreground">Ses biens</h4>
            <div className="space-y-2">
              {ownerBiens.map(b => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  {b.images?.[0] && <img src={b.images[0]} alt="" className="w-10 h-10 rounded-md object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{b.title}</p>
                    <p className="text-[10px] text-muted-foreground">{b.quartier} · {b.viewCount} vues</p>
                  </div>
                  <AdminBadge variant={b.adminStatus} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
