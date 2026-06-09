import { useEffect, useState } from 'react';
import { Loader2, Check, X, AlertTriangle, Eye, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminSetStatus } from '@/lib/propertiesService';
import { sendPropertyMessage } from '@/lib/propertyMessagesService';
import PropertyReviewPanel from '@/admin/components/PropertyReviewPanel';

type ModRow = {
  id: string; title: string; type: string; quartier: string; address: string;
  price: number; images: string[] | null;
  admin_status: string; created_at: string; owner_id: string | null;
  reviewed_at?: string | null; reviewed_by?: string | null;
  owner_updated_at?: string | null; published_at?: string | null;
};

const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : null;

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  reviewing: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  corrections: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  published: 'bg-green-500/10 text-green-700 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/30',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', reviewing: 'En revue', corrections: 'À corriger',
  published: 'Publié', rejected: 'Refusé', rented: 'Loué', inactive: 'Inactif',
};

export default function AdminModeration() {
  const [items, setItems] = useState<ModRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'corrections' | 'published' | 'rejected'>('pending');
  const [selected, setSelected] = useState<ModRow | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id,title,type,quartier,address,price,images,admin_status,created_at,owner_id,reviewed_at,reviewed_by,owner_updated_at,published_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as ModRow[]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  // Status-based queue priority: pending / corrections / reviewing remain on top.
  // Decided items (published, rejected) drop to the bottom so the admin always
  // sees actionable items first ("file d'attente").
  const STATUS_PRIORITY: Record<string, number> = {
    pending: 0, corrections: 1, reviewing: 2, rejected: 3, published: 4, inactive: 5, rented: 6,
  };
  const filtered = items
    .filter(i => filter === 'all' ? true : i.admin_status === filter)
    .slice()
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.admin_status] ?? 99;
      const pb = STATUS_PRIORITY[b.admin_status] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const decide = async (row: ModRow, status: 'published' | 'rejected' | 'corrections', note?: string) => {
    try {
      await adminSetStatus(row.id, status);
      if (note && row.owner_id) {
        await sendPropertyMessage({
          property_id: row.id,
          content: note,
          sender_role: 'admin',
          sender_name: 'Administration SapSapHouse',
        });
      }
      toast.success(
        status === 'published' ? 'Bien publié ✅' :
        status === 'rejected' ? 'Bien refusé' : 'Demande de corrections envoyée'
      );
      await reload();
      if (selected?.id === row.id) setSelected({ ...row, admin_status: status });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-600" /> Modération des biens
        </h1>
        <p className="text-xs text-muted-foreground">Valider, refuser ou demander des corrections sur les biens soumis par les propriétaires.</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['pending', 'corrections', 'published', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-full text-xs font-medium border ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'
            }`}>
            {f === 'all' ? 'Tous' : STATUS_LABEL[f]}
            <span className="ml-1.5 opacity-70">({items.filter(i => f === 'all' ? true : i.admin_status === f).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun bien dans cette catégorie.
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(row => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-3 flex gap-3 items-start">
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {row.images?.[0] ? (
                  <img src={row.images[0]} alt={row.title} className="w-full h-full object-cover" />
                ) : <ImageIcon size={20} className="text-muted-foreground/50" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold truncate">{row.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[row.admin_status] ?? 'bg-muted'}`}>
                    {STATUS_LABEL[row.admin_status] ?? row.admin_status}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{row.type} • {row.quartier} • {row.address}</p>
                <p className="text-[11px] font-semibold text-primary mt-0.5">{Number(row.price).toLocaleString('fr-FR')} F</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span>Proprio : {fmtDateTime(row.owner_updated_at) ?? fmtDateTime(row.created_at)}</span>
                  {row.reviewed_at && <span>Admin : {fmtDateTime(row.reviewed_at)}</span>}
                  {row.published_at && <span className="text-green-700">Publié : {fmtDateTime(row.published_at)}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setSelected(row)}
                  className="px-2.5 h-7 rounded text-[11px] font-semibold border border-primary text-primary bg-primary/5 hover:bg-primary/10 flex items-center gap-1">
                  <Eye size={12} /> Examiner
                </button>
                {row.admin_status !== 'published' && (
                  <button onClick={() => decide(row, 'published')}
                    className="px-2.5 h-7 rounded text-[11px] font-semibold bg-green-600 text-white hover:bg-green-700 flex items-center gap-1">
                    <Check size={12} /> Publier
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PropertyReviewPanel
          propertyId={selected.id}
          onClose={() => setSelected(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}

}
