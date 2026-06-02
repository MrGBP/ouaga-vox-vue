// ── Notifications (Lot 3) ─────────────────────────────────────────────────
// Multichannel owner notifications: in-app + email + WhatsApp.
// MVP scope:
//   • In-app: insert a row in `messages` (already RLS-protected).
//   • Email: best-effort call to `send-transactional-email` edge function
//     if the email infra is set up; silently noop otherwise.
//   • WhatsApp: returns a `wa.me` deep link the caller can open (no Twilio
//     dependency for the MVP).
//
// This module never throws — failures degrade silently.

import { supabase } from '@/integrations/supabase/client';

const SAPSAP_WHATSAPP = '22657976660';

export interface NotifyOwnerOptions {
  ownerId?: string;
  propertyId?: string;
  reservationId?: string;
  ownerPhone?: string;       // e.g. '+22670000000'
  ownerEmail?: string;
  /** Short human title (e.g. "Nouvelle réservation"). */
  title: string;
  /** Full message body (plain text). */
  body: string;
  /** Sender display name. */
  senderName?: string;
}

export interface NotifyResult {
  inApp: boolean;
  email: boolean;
  whatsappLink: string | null;
}

function buildWaLink(phone: string | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function notifyOwner(opts: NotifyOwnerOptions): Promise<NotifyResult> {
  const result: NotifyResult = { inApp: false, email: false, whatsappLink: null };

  // 1) In-app message (only if we have a reservation context — current RLS scopes by reservation)
  if (opts.reservationId) {
    try {
      const { error } = await supabase.from('messages').insert({
        reservation_id: opts.reservationId,
        property_id: opts.propertyId ?? null,
        sender_role: 'system',
        sender_name: opts.senderName ?? 'SapSapHouse',
        content: `${opts.title}\n\n${opts.body}`,
      });
      result.inApp = !error;
    } catch { /* swallow */ }
  }

  // 2) Email (best-effort — edge function may not exist yet)
  if (opts.ownerEmail) {
    try {
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          to: opts.ownerEmail,
          subject: opts.title,
          text: opts.body,
        },
      });
      result.email = !error;
    } catch { /* swallow */ }
  }

  // 3) WhatsApp deep link (caller decides when to open it)
  result.whatsappLink = buildWaLink(opts.ownerPhone, `${opts.title}\n${opts.body}`);

  return result;
}

/** Fallback: open SapSap support WhatsApp with a prefilled message. */
export function openSapSapWhatsApp(message: string): void {
  const url = `https://wa.me/${SAPSAP_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
}
