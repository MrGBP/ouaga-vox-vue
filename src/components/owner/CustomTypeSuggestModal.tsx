import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CustomTypeSuggestModal({ open, onClose }: Props) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (label.trim().length < 3) { toast.error('Donne un nom clair (min 3 caractères).'); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Connecte-toi pour suggérer un type.');
      const { error } = await supabase.from('custom_property_types').insert({
        suggested_by: user.id,
        label: label.trim(),
        description: description.trim() || null,
      });
      if (error) throw error;
      toast.success('Suggestion envoyée à notre équipe. Tu seras notifié si elle est validée.');
      setLabel(''); setDescription('');
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-base font-bold">Suggérer un type de bien</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Ton type de bien n'est pas listé ? Décris-le ici, notre équipe le validera et tu pourras l'utiliser pour tes prochains biens.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block">Nom du type *</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="form-input"
              placeholder="Ex : Entrepôt, Ferme, Salle de réception…"
              maxLength={60}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="form-input resize-none"
              placeholder="Précise les caractéristiques typiques de ce type de bien."
              maxLength={400}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 h-10 rounded-lg border border-border text-xs">
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 px-3 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Soumettre la suggestion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
