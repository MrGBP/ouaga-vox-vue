import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Image as ImageIcon, ArrowLeft, Phone, Check, RotateCcw, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import {
  listAllAdminConversations, listPropertyMessages, sendPropertyMessage,
  markPropertyMessagesReadByAdmin, type PropertyMessageRow,
} from '@/lib/propertyMessagesService';
import PropertyChatThread from '@/components/PropertyChatThread';

type Conversation = Awaited<ReturnType<typeof listAllAdminConversations>>[number];

const TEMPLATES = [
  'Bien publié ✅ Félicitations !',
  'Merci, quelques corrections nécessaires :',
  'Manque(s) : photos / description / POI',
  'Nous vous recontactons sous 24h.',
];

const QUICK_REMARKS = [
  { label: '📷 Photos',       message: "Les photos sont insuffisantes ou de mauvaise qualité. Merci d'en ajouter au moins 5 en lumière naturelle." },
  { label: '💰 Prix',         message: "Le prix indiqué semble incohérent avec le marché du quartier. Merci de le revoir." },
  { label: '📝 Description',  message: "La description du bien est trop courte. Merci d'ajouter plus de détails sur les équipements et l'environnement." },
  { label: '📍 Localisation', message: "La localisation du bien n'est pas précise. Merci de repositionner le pin sur la carte." },
  { label: '📄 Documents',    message: "Des documents justificatifs sont requis pour valider ce bien. Merci de les fournir." },
];

export default function AdminMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<PropertyMessageRow[]>([]);
  
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

  const send = async (content: string, replyToId: string | null) => {
    if (!selected) return;
    setSending(true);
    try {
      await sendPropertyMessage({
        property_id: selected.property.id, content,
        sender_role: 'admin', sender_name: 'Administration SapSapHouse',
        reply_to_id: replyToId,
      });
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

          {/* Quick admin status actions */}
          <div className="px-4 py-2 border-b bg-muted/30 flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                await supabase.from('properties').update({ admin_status: 'published' }).eq('id', selected.property.id);
                toast.success('Bien approuvé');
              }}
              className="px-2.5 h-7 rounded-md bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1"
            >
              <Check size={11} /> Approuver
            </button>
            <button
              onClick={async () => {
                await supabase.from('properties').update({ admin_status: 'corrections' }).eq('id', selected.property.id);
                toast.success('Corrections demandées');
              }}
              className="px-2.5 h-7 rounded-md bg-amber-500 text-white text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw size={11} /> Corrections
            </button>
            <button
              onClick={async () => {
                await supabase.from('properties').update({ admin_status: 'rejected' }).eq('id', selected.property.id);
                toast.success('Bien rejeté');
              }}
              className="px-2.5 h-7 rounded-md bg-red-600 text-white text-[11px] font-semibold flex items-center gap-1"
            >
              <XIcon size={11} /> Rejeter
            </button>
          </div>

          {/* Quick remarks chips */}
          <div className="px-4 py-2 border-b bg-card flex gap-1.5 flex-wrap">
            {QUICK_REMARKS.map(r => (
              <button
                key={r.label}
                onClick={() => send(r.message, null)}
                className="text-[10px] px-2 py-1 rounded-full border border-border bg-muted hover:bg-muted/70"
                title={r.message}
              >
                {r.label}
              </button>
            ))}
          </div>


          <div className="flex-1 overflow-hidden">
            <PropertyChatThread
              messages={messages}
              meRole="admin"
              sending={sending}
              templates={TEMPLATES}
              placeholder="Répondre au propriétaire…"
              onSend={send}
            />
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
