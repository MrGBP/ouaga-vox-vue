import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Loader2, CalendarOff } from 'lucide-react';
import { toast } from 'sonner';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';
import {
  listBlockedDates, addBlockedRange, deleteBlockedRange,
  BLOCK_REASONS, type BlockedRange,
} from '@/lib/blockedDatesService';

interface Props {
  open: boolean;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  onClose: () => void;
}

export default function BlockedDatesModal({ open, propertyId, propertyTitle, ownerId, onClose }: Props) {
  useLockBackdrop(open);
  const [ranges, setRanges] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('personal');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listBlockedDates(propertyId)
      .then(setRanges)
      .catch(e => toast.error(e?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
    setFrom(''); setTo(''); setReason('personal'); setNote('');
  }, [open, propertyId]);

  const add = async () => {
    if (!from || !to) return toast.error('Sélectionne une plage de dates');
    if (to < from) return toast.error('La date de fin doit être après le début');
    setAdding(true);
    try {
      const row = await addBlockedRange({ property_id: propertyId, owner_id: ownerId, date_from: from, date_to: to, reason, note: note || undefined });
      setRanges(prev => [...prev, row].sort((a, b) => a.date_from.localeCompare(b.date_from)));
      setFrom(''); setTo(''); setNote('');
      toast.success('Période bloquée');
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setAdding(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette période bloquée ?')) return;
    try {
      await deleteBlockedRange(id);
      setRanges(prev => prev.filter(r => r.id !== id));
      toast.success('Période débloquée');
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-3 border-b">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5"><CalendarOff size={15} /> Périodes indisponibles</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{propertyTitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
            <p className="text-xs font-semibold">Bloquer une nouvelle période</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium">Du
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="form-input mt-0.5" />
              </label>
              <label className="text-[11px] font-medium">Au
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="form-input mt-0.5" />
              </label>
            </div>
            <label className="text-[11px] font-medium block">Motif
              <select value={reason} onChange={e => setReason(e.target.value)} className="form-input mt-0.5">
                {BLOCK_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optionnel)" className="form-input" />
            <button onClick={add} disabled={adding}
              className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
              {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Bloquer cette période
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5">Périodes bloquées ({ranges.length})</p>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
            ) : ranges.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">Aucune période bloquée pour ce bien.</p>
            ) : (
              <ul className="space-y-1.5">
                {ranges.map(r => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-medium">{r.date_from} → {r.date_to}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {BLOCK_REASONS.find(x => x.value === r.reason)?.label ?? r.reason}
                        {r.note ? ` · ${r.note}` : ''}
                      </div>
                    </div>
                    <button onClick={() => remove(r.id)} className="ml-2 p-1.5 rounded hover:bg-red-50 text-red-600 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t p-3">
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border text-xs font-semibold">Fermer</button>
        </div>
      </div>
      <style>{`.form-input{display:block;width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.8125rem;outline:none}.form-input:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}
