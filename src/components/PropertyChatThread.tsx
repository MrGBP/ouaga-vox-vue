import { useMemo, useRef, useState, useEffect } from 'react';
import { Send, Reply, X, Check, CheckCheck } from 'lucide-react';
import type { PropertyMessageRow } from '@/lib/propertyMessagesService';

interface Props {
  messages: PropertyMessageRow[];
  meRole: 'admin' | 'owner';
  onSend: (text: string, replyToId: string | null) => Promise<void> | void;
  sending?: boolean;
  templates?: string[];
  placeholder?: string;
}

/**
 * Fil de discussion type WhatsApp avec reply-to par message.
 * - Long-press / clic sur l'icône ↩ pour citer un message
 * - Aperçu de la citation au-dessus de la zone de saisie
 * - Bulles avec heure + double-check de lecture
 */
export default function PropertyChatThread({
  messages, meRole, onSend, sending = false, templates = [], placeholder = 'Écrire un message…',
}: Props) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<PropertyMessageRow | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const byId = useMemo(() => Object.fromEntries(messages.map(m => [m.id, m])), [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    await onSend(t, replyTo?.id ?? null);
    setText(''); setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[hsl(var(--muted))]/30">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground italic py-6">
            Aucun message — démarre la conversation ci-dessous.
          </p>
        ) : messages.map(m => {
          const mine = m.sender_role === meRole;
          const quoted = m.reply_to_id ? byId[m.reply_to_id] : null;
          const read = meRole === 'admin' ? m.read_by_client : m.read_by_admin;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
              <div className={`relative max-w-[82%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                mine
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border rounded-bl-md'
              }`}>
                {quoted && (
                  <div className={`mb-1 rounded-md px-2 py-1 text-[10px] border-l-2 ${
                    mine ? 'bg-primary-foreground/10 border-primary-foreground/50' : 'bg-muted border-primary/60'
                  }`}>
                    <div className="font-semibold opacity-80">{quoted.sender_name}</div>
                    <div className="opacity-70 line-clamp-2 whitespace-pre-wrap">{quoted.content}</div>
                  </div>
                )}
                <div className="text-[10px] opacity-70 mb-0.5 flex items-center gap-1">
                  <span className="font-semibold">{m.sender_name}</span>
                  <span>· {new Date(m.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-70">
                  {mine && (read
                    ? <CheckCheck className="h-3 w-3" />
                    : <Check className="h-3 w-3" />)}
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(m)}
                  title="Répondre à ce message"
                  className={`absolute -top-2 ${mine ? '-left-2' : '-right-2'} h-6 w-6 rounded-full bg-background border border-border text-foreground opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow`}
                >
                  <Reply className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t bg-card">
        {replyTo && (
          <div className="px-3 pt-2 pb-1 flex items-start gap-2 bg-muted/40 border-b">
            <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
              <div className="text-[10px] font-semibold text-primary">Réponse à {replyTo.sender_name}</div>
              <div className="text-[11px] text-muted-foreground line-clamp-2 whitespace-pre-wrap">{replyTo.content}</div>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {templates.length > 0 && (
          <div className="flex gap-1.5 flex-wrap p-2 pb-0">
            {templates.map(t => (
              <button key={t} onClick={() => setText(t)} type="button"
                className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted">
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 flex gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
            rows={2}
            placeholder={placeholder}
            className="flex-1 text-xs border border-border rounded-lg px-3 py-2 resize-none bg-background"
          />
          <button
            type="button"
            onClick={submit}
            disabled={sending || !text.trim()}
            className="self-end px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            <Send size={12} /> Envoyer
          </button>
        </div>
        <p className="px-3 pb-2 text-[10px] text-muted-foreground">
          Astuce : passe la souris sur un message et clique <Reply className="inline h-2.5 w-2.5" /> pour citer. ⌘/Ctrl+Entrée pour envoyer.
        </p>
      </div>
    </div>
  );
}
