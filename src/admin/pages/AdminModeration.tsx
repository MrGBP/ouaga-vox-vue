import { useEffect, useState } from 'react';
import { Loader2, Check, X, AlertTriangle, Send, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminSetStatus } from '@/lib/propertiesService';
import {
  listPropertyMessages, sendPropertyMessage, type PropertyMessageRow,
} from '@/lib/propertyMessagesService';

type ModRow = {
  id: string; title: string; type: string; quartier: string; address: string;
  price: number; images: string[] | null;
  admin_status: string; created_at: string; owner_id: string | null;
};

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
        .select('id,title,type,quartier,address,price,images,admin_status,created_at,owner_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as ModRow[]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const filtered = items.filter(i => filter === 'all' ? true : i.admin_status === filter);

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
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setSelected(row)}
                  className="px-2.5 h-7 rounded text-[11px] font-medium border border-border bg-card hover:bg-muted flex items-center gap-1">
                  <MessageSquare size={12} /> Examiner
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
        <ModerationDrawer row={selected} onClose={() => setSelected(null)} onDecide={decide} onChanged={reload} />
      )}
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────
function ModerationDrawer({
  row, onClose, onDecide, onChanged,
}: {
  row: ModRow; onClose: () => void;
  onDecide: (r: ModRow, s: 'published'|'rejected'|'corrections', note?: string) => Promise<void>;
  onChanged: () => void;
}) {
  const [messages, setMessages] = useState<PropertyMessageRow[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try { setMessages(await listPropertyMessages(row.id)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [row.id]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendPropertyMessage({
        property_id: row.id, content: text,
        sender_role: 'admin', sender_name: 'Administration SapSapHouse',
      });
      setText('');
      await reload();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const decideWith = async (s: 'corrections' | 'rejected' | 'published') => {
    const need = s !== 'published';
    if (need && !text.trim()) {
      toast.error('Ajoute un message expliquant la décision au propriétaire.');
      return;
    }
    await onDecide(row, s, text.trim() || undefined);
    setText('');
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-end sm:items-center justify-center p-2 sm:p-6" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="px-4 py-3 border-b flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-bold truncate">{row.title}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{row.quartier} • {row.address}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X size={16} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-muted/30">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground italic py-6">Aucun message échangé pour ce bien.</p>
          ) : messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                m.sender_role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
              }`}>
                <div className="text-[10px] opacity-70 mb-0.5">{m.sender_name} • {new Date(m.created_at).toLocaleString('fr-FR')}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-3 space-y-2 bg-card">
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={2}
            placeholder="Message au propriétaire (obligatoire pour refus / corrections)…"
            className="w-full text-xs border border-border rounded-lg px-3 py-2 resize-none bg-background"
          />
          <div className="flex flex-wrap gap-1.5">
            <button onClick={send} disabled={sending || !text.trim()}
              className="px-3 h-8 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
              <Send size={12} /> Envoyer
            </button>
            <span className="flex-1" />
            <button onClick={() => decideWith('corrections')}
              className="px-3 h-8 rounded-lg bg-orange-500 text-white text-xs font-semibold flex items-center gap-1 hover:bg-orange-600">
              <AlertTriangle size={12} /> Demander corrections
            </button>
            <button onClick={() => decideWith('rejected')}
              className="px-3 h-8 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-red-700">
              <X size={12} /> Refuser
            </button>
            <button onClick={() => decideWith('published')}
              className="px-3 h-8 rounded-lg bg-green-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-green-700">
              <Check size={12} /> Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
