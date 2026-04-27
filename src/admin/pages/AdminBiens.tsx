import { useState, useMemo } from 'react';
import { Search, Check, X, Pencil, Zap, Trash2, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore, adminStore } from '@/admin/store/adminStore';
import { getTypeLabel, isTypeFurnished, pricePerNight, mockQuartiers, PROPERTY_TYPES } from '@/lib/mockData';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminBadge from '@/admin/components/AdminBadge';
import PropertyFormModal from '@/admin/components/PropertyFormModal';
import ConfirmDialog from '@/admin/components/ConfirmDialog';
import type { AdminPropertyStatus, AdminProperty } from '@/admin/types';

const TYPE_COLORS: Record<string, string> = {
  maison_villa_meublee: '#1a3560', maison_villa_simple: '#475569',
  appartement_meuble: '#7c3aed', appartement_simple: '#6d28d9',
  studio_meuble: '#0891b2', bureau: '#dc2626', local_commercial: '#ea580c',
};

const TABS: { label: string; filter: AdminPropertyStatus | 'all' }[] = [
  { label: 'Tous', filter: 'all' },
  { label: 'En attente', filter: 'pending' },
  { label: 'Publiés', filter: 'published' },
  { label: 'Loués', filter: 'rented' },
  { label: 'Inactifs', filter: 'inactive' },
];

export default function AdminBiens() {
  const properties = useAdminStore(s => s.properties);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<AdminPropertyStatus | 'all'>('all');
  const [quartierFilter, setQuartierFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProperty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return properties.filter(p => {
      if (tab !== 'all' && p.adminStatus !== tab) return false;
      if (quartierFilter && p.quartier !== quartierFilter) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.quartier.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [properties, tab, quartierFilter, typeFilter, search]);

  const paged = filtered.slice(page * 25, (page + 1) * 25);
  const totalPages = Math.ceil(filtered.length / 25);
  const selected = selectedId ? properties.find(p => p.id === selectedId) : null;

  const handleEdit = (p: AdminProperty) => { setEditing(p); setFormOpen(true); };
  const handleNew = () => { setEditing(null); setFormOpen(true); };
  const handleStatusChange = (id: string, status: AdminPropertyStatus, msg: string) => {
    adminStore.setPropertyStatus(id, status);
    toast.success(msg);
  };
  const confirmDelete = () => {
    if (!deleteId) return;
    adminStore.deleteProperty(deleteId);
    toast.success('Bien supprimé');
    if (selectedId === deleteId) setSelectedId(null);
    setDeleteId(null);
  };
  const resetData = () => {
    if (confirm('Réinitialiser toutes les données admin aux valeurs par défaut ?')) {
      adminStore.resetAll();
      toast.success('Données réinitialisées');
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 mb-2">
        <AdminPageHeader title="Gestion des biens" subtitle={`${filtered.length} bien(s) · ${properties.length} au total`} />
        <div className="flex gap-2 shrink-0">
          <button onClick={resetData} title="Réinitialiser" className="h-9 w-9 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center"><RotateCcw size={14} /></button>
          <button onClick={handleNew} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5"><Plus size={14} /> Nouveau bien</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={quartierFilter} onChange={e => { setQuartierFilter(e.target.value); setPage(0); }} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">Tous quartiers</option>
          {mockQuartiers.map(q => <option key={q.id} value={q.name}>{q.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">Tous types</option>
          {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map(t => {
          const count = t.filter === 'all' ? properties.length : properties.filter(p => p.adminStatus === t.filter).length;
          return (
            <button key={t.filter} onClick={() => { setTab(t.filter); setPage(0); }} className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${tab === t.filter ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Nom / Quartier</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Vues</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Propriétaire</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">Aucun bien — cliquez sur "Nouveau bien" pour en créer un.</td></tr>
            )}
            {paged.map(p => (
              <tr key={p.id} onClick={() => setSelectedId(p.id)} className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <td className="px-4 py-2.5">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} /> : <div className="w-12 h-12 rounded-lg bg-blue-50" />}
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-xs font-semibold text-foreground">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground">{p.quartier}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: TYPE_COLORS[p.type] || '#64748b' }}>{getTypeLabel(p.type)}</span>
                </td>
                <td className="px-4 py-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
                  {isTypeFurnished(p.type) ? `${pricePerNight(p.price).toLocaleString('fr-FR')} FCFA/nuit` : `${p.price.toLocaleString('fr-FR')} FCFA/mois`}
                </td>
                <td className="px-4 py-2.5"><AdminBadge variant={p.adminStatus} /></td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.viewCount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${p.qualityScore}%`, background: p.qualityScore < 40 ? '#dc2626' : p.qualityScore < 70 ? '#d97706' : '#059669' }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{p.qualityScore}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.ownerName}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {(p.adminStatus === 'pending' || p.adminStatus === 'reviewing') && (
                      <>
                        <button onClick={() => handleStatusChange(p.id, 'published', 'Bien publié')} title="Publier" className="w-8 h-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-200"><Check size={14} /></button>
                        <button onClick={() => handleStatusChange(p.id, 'inactive', 'Bien rejeté')} title="Rejeter" className="w-8 h-8 rounded-md flex items-center justify-center bg-red-100 text-red-700 hover:bg-red-200"><X size={14} /></button>
                      </>
                    )}
                    <button onClick={() => handleEdit(p)} title="Modifier" className="w-8 h-8 rounded-md flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200"><Pencil size={14} /></button>
                    {p.adminStatus === 'published' && (
                      <button onClick={() => { adminStore.updateProperty(p.id, { boostActive: !p.boostActive }); toast.success(p.boostActive ? 'Boost désactivé' : 'Boost activé'); }} title="Boost" className="w-8 h-8 rounded-md flex items-center justify-center bg-amber-100 text-amber-700 hover:bg-amber-200"><Zap size={14} /></button>
                    )}
                    <button onClick={() => setDeleteId(p.id)} title="Supprimer" className="w-8 h-8 rounded-md flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} className={`w-8 h-8 rounded-lg text-xs font-semibold ${page === i ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* Detail sidebar */}
      {selected && (
        <div className="fixed top-0 right-0 bottom-0 w-[420px] bg-card shadow-2xl z-[200] overflow-y-auto border-l border-border">
          <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground truncate">{selected.title}</h3>
            <button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted shrink-0"><X size={16} /></button>
          </div>
          {selected.images?.[0] && <img src={selected.images[0]} alt="" className="w-full h-48 object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <AdminBadge variant={selected.adminStatus} />
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: TYPE_COLORS[selected.type] || '#64748b' }}>{getTypeLabel(selected.type)}</span>
              {selected.boostActive && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800">⚡ Boost</span>}
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{isTypeFurnished(selected.type) ? `${pricePerNight(selected.price).toLocaleString('fr-FR')} FCFA/nuit` : `${selected.price.toLocaleString('fr-FR')} FCFA/mois`}</p>
              <p className="text-xs text-muted-foreground">{selected.quartier} · {selected.surface_area}m² · {selected.bedrooms} ch · {selected.bathrooms} sdb</p>
            </div>
            {selected.description && <p className="text-xs text-muted-foreground">{selected.description}</p>}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Propriétaire</p>
              <p className="text-xs text-muted-foreground">{selected.ownerName} · {selected.ownerPhone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Changer statut</p>
              <select value={selected.adminStatus} onChange={e => handleStatusChange(selected.id, e.target.value as AdminPropertyStatus, 'Statut mis à jour')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <option value="pending">En attente</option>
                <option value="reviewing">En révision</option>
                <option value="corrections">Corrections</option>
                <option value="published">Publié</option>
                <option value="rented">Loué</option>
                <option value="inactive">Inactif/Refusé</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>👁 {selected.viewCount} vues</div>
              <div>❤️ {selected.favoriteCount} favoris</div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleEdit(selected)} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1"><Pencil size={12} /> Modifier</button>
              <button onClick={() => setDeleteId(selected.id)} className="flex-1 h-9 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1"><Trash2 size={12} /> Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <PropertyFormModal open={formOpen} initial={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer ce bien ?"
        message="Cette action est irréversible. Le bien sera retiré du système."
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
