import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore, adminStore } from '@/admin/store/adminStore';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminBadge from '@/admin/components/AdminBadge';
import UserFormModal from '@/admin/components/UserFormModal';
import ConfirmDialog from '@/admin/components/ConfirmDialog';
import type { AdminUser } from '@/admin/types';

export default function AdminUsers() {
  const tenants = useAdminStore(s => s.tenants);
  const owners = useAdminStore(s => s.owners);
  const properties = useAdminStore(s => s.properties);
  const [tab, setTab] = useState<'tenants' | 'owners'>('tenants');
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const owner = selectedOwner ? owners.find(o => o.id === selectedOwner) : null;
  const ownerBiens = owner ? properties.filter(p => p.ownerName === owner.name) : [];

  const handleNew = () => { setEditing(null); setFormOpen(true); };
  const handleEdit = (u: AdminUser) => { setEditing(u); setFormOpen(true); };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    adminStore.deleteUser(deleteTarget.id, deleteTarget.role);
    toast.success('Utilisateur supprimé');
    if (selectedOwner === deleteTarget.id) setSelectedOwner(null);
    setDeleteTarget(null);
  };

  const list = tab === 'tenants' ? tenants : owners;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <AdminPageHeader title="Utilisateurs" subtitle={`${tenants.length} locataires · ${owners.length} propriétaires`} />
        <button onClick={handleNew} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5"><Plus size={14} /> Nouvel utilisateur</button>
      </div>

      <div className="flex gap-1 mb-4">
        <button onClick={() => setTab('tenants')} className={`rounded-lg px-4 py-1.5 text-xs font-medium ${tab === 'tenants' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>Locataires ({tenants.length})</button>
        <button onClick={() => setTab('owners')} className={`rounded-lg px-4 py-1.5 text-xs font-medium ${tab === 'owners' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>Propriétaires ({owners.length})</button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              {tab === 'tenants' ? (
                <>
                  <th className="px-4 py-3">Inscrit</th>
                  <th className="px-4 py-3">Recherches</th>
                  <th className="px-4 py-3">Vus</th>
                  <th className="px-4 py-3">Favoris</th>
                  <th className="px-4 py-3">Réservations</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3">Biens</th>
                  <th className="px-4 py-3">Vues</th>
                  <th className="px-4 py-3">Revenus</th>
                  <th className="px-4 py-3">Commission</th>
                </>
              )}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Aucun utilisateur</td></tr>
            )}
            {list.map(u => (
              <tr key={u.id} onClick={() => tab === 'owners' && setSelectedOwner(u.id)} className={`border-b border-border hover:bg-muted/50 ${tab === 'owners' ? 'cursor-pointer' : ''}`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#1a3560' }}>{u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <span className="text-xs font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.phone}</td>
                {tab === 'tenants' ? (
                  <>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.searchCount}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.viewCount}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.favoriteCount}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.reservationCount}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{u.propertyCount}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.totalViews}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600">{(u.totalRevenue || 0).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600">{(u.totalCommission || 0).toLocaleString('fr-FR')}</td>
                  </>
                )}
                <td className="px-4 py-2.5">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(u)} title="Modifier" className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"><Pencil size={12} /></button>
                    <button onClick={() => setDeleteTarget(u)} title="Supprimer" className="w-7 h-7 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Biens</span><p className="text-lg font-bold text-foreground">{ownerBiens.length}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Vues</span><p className="text-lg font-bold text-foreground">{ownerBiens.reduce((s, p) => s + (p.viewCount || 0), 0)}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Revenus</span><p className="text-lg font-bold text-emerald-600">{(owner.totalRevenue || 0).toLocaleString('fr-FR')}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Commission</span><p className="text-lg font-bold text-emerald-600">{(owner.totalCommission || 0).toLocaleString('fr-FR')}</p></div>
            </div>
            <h4 className="text-xs font-semibold text-foreground">Ses biens</h4>
            <div className="space-y-2">
              {ownerBiens.length === 0 && <p className="text-xs text-muted-foreground">Aucun bien associé</p>}
              {ownerBiens.map(b => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  {b.images?.[0] && <img src={b.images[0]} alt="" className="w-10 h-10 rounded-md object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />}
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

      <UserFormModal open={formOpen} initial={editing} defaultRole={tab === 'tenants' ? 'tenant' : 'owner'} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer cet utilisateur ?"
        message={`L'utilisateur "${deleteTarget?.name}" sera supprimé définitivement.`}
        destructive
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
