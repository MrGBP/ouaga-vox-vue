import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listMessages, sendMessage, subscribeMessages, markRead, type MessageRow } from '@/lib/messagesService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  reservationId: string;
  /** 'client' (user side) or 'admin' (admin dashboard) */
  viewerRole: 'client' | 'admin';
  viewerName: string;
}

export default function ReservationChat({ reservationId, viewerRole, viewerName }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await listMessages(reservationId);
        if (!mounted) return;
        setMessages(list);
        await markRead(reservationId, viewerRole);
      } catch (e: any) {
        toast.error(e?.message ?? 'Erreur de chargement');
      } finally { if (mounted) setLoading(false); }
    })();
    const unsub = subscribeMessages(reservationId, (row) => {
      setMessages(prev => prev.some(m => m.id === row.id) ? prev : [...prev, row]);
      markRead(reservationId, viewerRole).catch(() => {});
    });
    return () => { mounted = false; unsub(); };
  }, [reservationId, viewerRole]);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  const onSend = async () => {
    const content = text.trim();
    if (!content) return;
    if (content.length > 1000) { toast.error('Message trop long (1000 max)'); return; }
    setSending(true);
    try {
      await sendMessage({ reservation_id: reservationId, content, sender_role: viewerRole, sender_name: viewerName });
      setText('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Envoi impossible');
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-[460px] border border-border rounded-xl bg-card overflow-hidden">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
        {loading && <div className="text-center text-sm text-muted-foreground py-8">Chargement…</div>}
        {!loading && messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Aucun message. Démarrez la conversation 👋
          </div>
        )}
        {messages.map(m => {
          const mine = viewerRole === m.sender_role || (user?.id && m.sender_id === user.id);
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                {!mine && <div className="text-[10px] opacity-70 mb-0.5">{m.sender_name}</div>}
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className="text-[10px] opacity-60 mt-0.5 text-right">
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-2 border-t border-border bg-card flex gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Écrire un message…"
          maxLength={1000}
          disabled={sending}
        />
        <Button onClick={onSend} disabled={sending || !text.trim()} size="icon">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
