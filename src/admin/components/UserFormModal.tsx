import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminUser } from '@/admin/types';
import { adminStore } from '@/admin/store/adminStore';

interface Props {
  open: boolean;
  initial?: AdminUser | null;
  defaultRole?: 'tenant' | 'owner';
  onClose: () => void;
}

export default function UserFormModal({ open, initial, defaultRole = 'tenant', onClose }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'tenant' | 'owner'>(defaultRole);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name); setPhone(initial.phone);
      setEmail(initial.email || ''); setRole(initial.role);
    } else {
      setName(''); setPhone(''); setEmail(''); setRole(defaultRole);
    }
  }, [open, initial, defaultRole]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Le nom est requis'); return; }
    if (!phone.trim()) { toast.error('Le téléphone est requis'); return; }
    if (isEdit && initial) {
      adminStore.updateUser(initial.id, initial.role, { name: name.trim(), phone: phone.trim(), email: email.trim() });
      toast.success('Utilisateur mis à jour');
    } else {
      adminStore.addUser({ name: name.trim(), phone: phone.trim(), email: email.trim(), role });
      toast.success('Utilisateur créé');
    }
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-bold text-foreground">{isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Nom complet *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm" placeholder="Aïssata Compaoré" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Téléphone *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm" placeholder="+226 70 00 00 00" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm" placeholder="email@exemple.com" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold mb-1">Rôle</label>
              <select value={role} onChange={e => setRole(e.target.value as 'tenant' | 'owner')} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm">
                <option value="tenant">Locataire</option>
                <option value="owner">Propriétaire</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-3">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold hover:bg-muted">Annuler</button>
            <button type="submit" className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">{isEdit ? 'Mettre à jour' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
