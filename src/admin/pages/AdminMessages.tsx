import { useEffect, useState } from 'react';
import { Loader2, Send, MessageSquare, Image as ImageIcon, ArrowLeft, Phone } from 'lucide-react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import {
  listAllAdminConversations, listPropertyMessages, sendPropertyMessage,
  markPropertyMessagesReadByAdmin, type PropertyMessageRow,
} from '@/lib/propertyMessagesService';

type Conversation = Awaited<ReturnType<typeof listAllAdminConversations>>[number];

const TEMPLATES = [
  'Bien publié ✅ Félicitations !',
  'Merci, quelques corrections nécessaires :',
  'Manque(s) : photos / description / POI',
  'Nous vous recontactons sous 24h.',
];

export default function AdminMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<PropertyMessageRow[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const reload = async () => {
    setLoading(true);
    try { setConversations(await listAllAdminConversations()); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const openConv = async (c: Conversation) => {
    setSelected(c);
    try {
      setMessages(await listPropertyMessages(c.property.id));
      await markPropertyMessagesReadByAdmin(c.property.id);
    } catch (e: any) { toast.error(e.message); }
  };

  const send = async () => {
    if (!selected || !text.trim()) return;
    setSending(true);
    try {
      await sendPropertyMessage({
        property_id: selected.property.id, content: text,
        sender_role: 'admin', sender_name: 'Administration SapSapHouse',
      });
      setText('');
      setMessages(await listPropertyMessages(selected.property.id));
      reload();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const filtered = conversations.filter(c =>
    !search.trim() ||
    c.property.title.toLowerCase().includes(search.toLowerCase()) ||
    c.owner?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  // Vue détail conversation
  if (selected) {
    return (
      <div className="space-y-3">
        <button onClick={() => { setSelected(null); reload(); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour aux conversations
        </button>

        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          <header className="px-4 py-3 border-b flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
              {selected.property.images?.[0]
                ? <img src={selected.property.images[0]} alt="" className="w-full h-full object-cover" />
                : <ImageIcon size={16} className="text-muted-foreground/50" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate">{selected.property.title}</h3>
              <p className="text-[11px] text-muted-foreground truncate">
                Propriétaire : {selected.owner?.full_name ?? '—'}
                {selected.owner?.phone && <> · <Phone size={9} className="inline" /> {selected.owner.phone}</>}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-muted/30">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground italic py-6">Aucun message — démarre la conversation ci-dessous.</p>
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
            <div className="flex gap-1.5 flex-wrap">
              {TEMPLATES.map(t => (
                <button key={t} onClick={() => setText(t)}
                  className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted">
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
                placeholder="Répondre au propriétaire…"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
                className="flex-1 text-xs border border-border rounded-lg px-3 py-2 resize-none bg-background" />
              <button onClick={send} disabled={sending || !text.trim()}
                className="self-end px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
                <Send size={12} /> Envoyer
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Astuce : ⌘/Ctrl + Entrée pour envoyer rapidement.</p>
          </div>
        </div>
      </div>
    );
  }

  // Vue liste
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Messages"
        subtitle={`${totalUnread} non lus · ${conversations.length} conversation${conversations.length > 1 ? 's' : ''} avec les propriétaires`}
      />

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher un bien ou un propriétaire…"
        className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/60" />
          <p className="font-medium text-foreground mb-1">Aucune conversation</p>
          <p className="text-xs">Les échanges avec les propriétaires apparaîtront ici dès qu'un message est échangé via la modération.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <button key={c.property.id} onClick={() => openConv(c)}
              className="w-full text-left rounded-xl border border-border bg-card p-3 flex gap-3 items-center hover:bg-muted/40 transition">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {c.property.images?.[0]
                  ? <img src={c.property.images[0]} alt="" className="w-full h-full object-cover" />
                  : <ImageIcon size={18} className="text-muted-foreground/50" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold truncate">{c.property.title}</h4>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5">{c.unread}</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.owner?.full_name ?? 'Sans propriétaire'} · {c.property.quartier}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {c.lastMessage
                    ? `${c.lastMessage.sender_name}: ${c.lastMessage.content}`
                    : 'Aucun message'}
                </p>
              </div>
              {c.lastMessage && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(c.lastMessage.created_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
