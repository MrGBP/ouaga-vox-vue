import { useState } from 'react';
import { Send, Trash2, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore, adminStore } from '@/admin/store/adminStore';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminBadge from '@/admin/components/AdminBadge';
import ConfirmDialog from '@/admin/components/ConfirmDialog';

const TEMPLATES = ['Bien publié ✅', 'Corrections requises', 'Réservation confirmée'];

export default function AdminMessages() {
  const messages = useAdminStore(s => s.messages);
  const [selectedId, setSelectedId] = useState(messages[0]?.id || '');
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email' | 'app'>('all');
  const [reply, setReply] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = filter === 'all' ? messages : messages.filter(m => m.channel === filter);
  const selected = messages.find(m => m.id === selectedId);

  const handleSend = () => {
    if (!reply.trim() || !selected) return;
    adminStore.sendMessage(selected.id, reply.trim());
    toast.success('Message envoyé');
    setReply('');
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    adminStore.markMessageRead(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    adminStore.deleteMessage(deleteId);
    toast.success('Conversation supprimée');
    if (selectedId === deleteId) setSelectedId(messages.find(m => m.id !== deleteId)?.id || '');
    setDeleteId(null);
  };

  return (
    <div>
      <AdminPageHeader title="Messages" subtitle={`${messages.reduce((s, m) => s + m.unreadCount, 0)} non lus · ${messages.length} conversations`} />

      <div className="flex gap-0 h-[calc(100vh-180px)] rounded-xl border border-border bg-card overflow-hidden">
        {/* Liste */}
        <div className="w-[280px] border-r border-border flex flex-col shrink-0">
          <div className="flex gap-1 p-2 border-b border-border">
            {(['all', 'whatsapp', 'email', 'app'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-2 py-1 text-[10px] font-medium ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                {f === 'all' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Aucune conversation</p>}
            {filtered.map(m => (
              <div key={m.id} className={`group relative w-full border-b border-border transition-colors ${selectedId === m.id ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                <button onClick={() => handleSelect(m.id)} className="w-full text-left px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#1a3560' }}>
                      {m.contactName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground truncate">{m.contactName}</span>
                        {m.unreadCount > 0 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#e02d2d' }}>{m.unreadCount}</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{m.lastMessage}</p>
                      <p className="text-[10px] text-muted-foreground">{m.lastTime}</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setDeleteId(m.id)} title="Supprimer" className="absolute right-2 top-2 w-6 h-6 rounded-md bg-red-50 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#1a3560' }}>
                  {selected.contactName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{selected.contactName}</p>
                  <p className="text-[11px] text-muted-foreground">{selected.contactPhone}</p>
                </div>
                <button
                  onClick={() => { adminStore.setMessageStatus(selected.id, selected.status === 'open' ? 'resolved' : 'open'); toast.success(selected.status === 'open' ? 'Marqué résolu' : 'Réouvert'); }}
                  className="h-8 px-3 rounded-md text-[11px] font-semibold bg-muted hover:bg-muted/70 flex items-center gap-1"
                >
                  <CheckCheck size={12} /> {selected.status === 'open' ? 'Marquer résolu' : 'Réouvrir'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.from === 'admin' ? 'text-white' : 'bg-muted text-foreground'}`} style={msg.from === 'admin' ? { background: '#1a3560' } : {}}>
                      <p className="text-[13px]">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.from === 'admin' ? 'text-white/60' : 'text-muted-foreground'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border">
                <div className="flex gap-1 mb-2 flex-wrap">
                  {TEMPLATES.map(t => (
                    <button key={t} onClick={() => setReply(t)} className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted">{t}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} placeholder="Écrire un message..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  <button onClick={handleSend} disabled={!reply.trim()} className="w-10 h-10 rounded-lg flex items-center justify-center text-white disabled:opacity-50" style={{ background: '#1a3560' }}><Send size={16} /></button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Sélectionnez une conversation</div>
          )}
        </div>

        {selected && (
          <div className="w-[240px] border-l border-border p-4 space-y-3 hidden xl:block">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto" style={{ background: '#1a3560' }}>
              {selected.contactName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <p className="text-sm font-semibold text-foreground text-center">{selected.contactName}</p>
            <p className="text-xs text-muted-foreground text-center">{selected.contactPhone}</p>
            <div className="flex justify-center"><AdminBadge variant={selected.contactRole} /></div>
            <p className="text-[11px] text-muted-foreground">Canal : {selected.channel}</p>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">Statut : <AdminBadge variant={selected.status === 'open' ? 'pending' : 'completed'} label={selected.status === 'open' ? 'Ouvert' : 'Résolu'} /></div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer la conversation ?"
        message="Tous les messages seront perdus."
        destructive
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
