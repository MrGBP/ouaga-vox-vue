import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Send, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import {
  listMyOwnerConversations, listPropertyMessages, sendPropertyMessage,
  type PropertyMessageRow,
} from '@/lib/propertyMessagesService';
import { supabase } from '@/integrations/supabase/client';

type Conversation = Awaited<ReturnType<typeof listMyOwnerConversations>>[number];

export default function OwnerMessages() {
  const { user } = useAuth();
  const ownerName = (user?.user_metadata as any)?.full_name || user?.email || 'Propriétaire';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<PropertyMessageRow[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try { setConversations(await listMyOwnerConversations(user.id)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  const openConv = async (c: Conversation) => {
    setSelected(c);
    try {
      const msgs = await listPropertyMessages(c.property.id);
      setMessages(msgs);
      // mark admin messages as read by client (l'owner agit comme client ici)
      await supabase.from('messages').update({ read_by_client: true })
        .eq('property_id', c.property.id).eq('sender_role', 'admin');
    } catch (e: any) { toast.error(e.message); }
  };

  const send = async () => {
    if (!selected || !text.trim() || !user) return;
    setSending(true);
    try {
      await sendPropertyMessage({
        property_id: selected.property.id, content: text,
        sender_role: 'owner', sender_name: ownerName,
      });
      setText('');
      const msgs = await listPropertyMessages(selected.property.id);
      setMessages(msgs);
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  if (selected) {
    return (
      <div className="space-y-3">
        <button onClick={() => { setSelected(null); reload(); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour aux conversations
        </button>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-bold truncate">{selected.property.title}</h3>
            <p className="text-[11px] text-muted-foreground">Échange avec l'administration</p>
          </div>
          <div className="p-4 space-y-2.5 max-h-[55vh] overflow-y-auto bg-muted/30">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground italic py-6">Aucun message pour le moment.</p>
            ) : messages.map(m => (
              <div key={m.id} className={`flex ${m.sender_role === 'owner' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                  m.sender_role === 'owner' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
                }`}>
                  <div className="text-[10px] opacity-70 mb-0.5">{m.sender_name} • {new Date(m.created_at).toLocaleString('fr-FR')}</div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 flex gap-2 bg-card">
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
              placeholder="Écrire à l'administration…"
              className="flex-1 text-xs border border-border rounded-lg px-3 py-2 resize-none bg-background" />
            <button onClick={send} disabled={sending || !text.trim()}
              className="self-end px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
              <Send size={12} /> Envoyer
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Messages</h2>
        <p className="text-sm text-muted-foreground">Échanges avec l'administration au sujet de tes biens.</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/60" />
          <p className="font-medium text-foreground mb-1">Aucun bien à suivre</p>
          <p className="text-xs">Publie un bien pour commencer à recevoir des retours de l'administration.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <button key={c.property.id} onClick={() => openConv(c)}
              className="w-full text-left rounded-xl border border-border bg-card p-3 flex gap-3 items-center hover:bg-muted/40 transition">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {c.property.images?.[0] ? (
                  <img src={c.property.images[0]} alt={c.property.title} className="w-full h-full object-cover" />
                ) : <ImageIcon size={18} className="text-muted-foreground/50" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold truncate">{c.property.title}</h4>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5">{c.unread}</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.lastMessage ? `${c.lastMessage.sender_name}: ${c.lastMessage.content}` : 'Aucun message — démarrer la conversation'}
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
