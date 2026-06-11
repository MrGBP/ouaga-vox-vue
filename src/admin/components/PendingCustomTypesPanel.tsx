import { useEffect, useState } from 'react';
import { Sparkles, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CustomTypeRow {
  id: string;
  suggested_by: string | null;
  label: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_key: string | null;
  admin_note: string | null;
  created_at: string;
  suggester?: { full_name: string | null } | null;
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
}

export default function PendingCustomTypesPanel() {
  const [rows, setRows] = useState<CustomTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [keyOverrides, setKeyOverrides] = useState<Record<string, string>>({});
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_property_types')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((r: any) => r.suggested_by).filter(Boolean)));
      let profiles: Record<string, { full_name: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        profiles = Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name }]));
      }
      const merged = (data ?? []).map((r: any) => ({ ...r, suggester: r.suggested_by ? profiles[r.suggested_by] : null }));
      setRows(merged as CustomTypeRow[]);
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (row: CustomTypeRow) => {
    const key = (keyOverrides[row.id] ?? slugify(row.label)).trim();
    if (!key) { toast.error('Donne une clé système valide.'); return; }
    setBusyId(row.id);
    try {
      const { error } = await supabase.from('custom_property_types')
        .update({ status: 'approved', approved_key: key })
        .eq('id', row.id);
      if (error) throw error;
      toast.success('Type approuvé. Le propriétaire a été notifié.');
      load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setBusyId(null); }
  };

  const reject = async (row: CustomTypeRow) => {
    const note = (noteOverrides[row.id] ?? '').trim();
    setBusyId(row.id);
    try {
      const { error } = await supabase.from('custom_property_types')
        .update({ status: 'rejected', admin_note: note || null })
        .eq('id', row.id);
      if (error) throw error;
      toast.success('Suggestion refusée. Le propriétaire a été notifié.');
      load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setBusyId(null); }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={14} className="animate-spin" /> Chargement des suggestions…
      </div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 mb-4 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-50">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-700" />
          <h3 className="text-sm font-bold text-amber-900">Types de biens suggérés ({rows.length})</h3>
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="p-4 pt-0 space-y-3">
          {rows.map(r => {
            const defaultKey = keyOverrides[r.id] ?? slugify(r.label);
            return (
              <div key={r.id} className="rounded-lg border border-amber-200 bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground">« {r.label} »</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Par {r.suggester?.full_name ?? 'Anonyme'} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {r.description && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{r.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px]">
                    <span className="block text-muted-foreground mb-0.5">Clé système</span>
                    <input
                      value={defaultKey}
                      onChange={e => setKeyOverrides(k => ({ ...k, [r.id]: e.target.value }))}
                      className="w-full h-8 px-2 rounded border border-border bg-background text-xs font-mono"
                    />
                  </label>
                  <label className="text-[11px]">
                    <span className="block text-muted-foreground mb-0.5">Note refus (optionnel)</span>
                    <input
                      value={noteOverrides[r.id] ?? ''}
                      onChange={e => setNoteOverrides(n => ({ ...n, [r.id]: e.target.value }))}
                      className="w-full h-8 px-2 rounded border border-border bg-background text-xs"
                      placeholder="Raison du refus…"
                    />
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    disabled={busyId === r.id}
                    onClick={() => approve(r)}
                    className="flex-1 h-8 rounded-md bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Check size={12} /> Approuver
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => reject(r)}
                    className="flex-1 h-8 rounded-md bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <X size={12} /> Refuser
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
