// ── Analytics (Lot 3) ─────────────────────────────────────────────────────
// Lightweight event tracker.
// - In dev: logs to console with a stable tag.
// - In prod: best-effort insert into `analytics_events` if the table exists.
//   Failures are swallowed so analytics never breaks the UX.

import { supabase } from '@/integrations/supabase/client';

export type AnalyticsEvent =
  | 'property_viewed'
  | 'property_card_clicked'
  | 'reservation_started'
  | 'reservation_submitted'
  | 'contact_phone_clicked'
  | 'contact_whatsapp_clicked'
  | 'contact_email_clicked'
  | 'favorite_added'
  | 'favorite_removed'
  | 'search_performed'
  | 'city_switched'
  | 'filter_applied'
  | 'auth_modal_opened'
  | 'auth_signin_success'
  | 'auth_signup_success'
  | 'auth_whatsapp_continue'
  | 'auth_otp_sent'
  | 'auth_otp_verified'
  | 'auth_profile_created'
  | 'visit_requested'
  | 'contact_requested';

interface TrackOptions {
  /** Arbitrary properties — must be JSON-serializable. */
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

export function track(event: AnalyticsEvent, props: TrackOptions = {}): void {
  // Console log (always in dev, silent in prod)
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props);
  }

  // Best-effort cloud insert (silently noop if table missing or no auth required)
  try {
    void supabase
      .from('analytics_events' as never)
      .insert({
        event,
        props,
        url: typeof window !== 'undefined' ? window.location.pathname : null,
        created_at: new Date().toISOString(),
      } as never)
      .then(() => { /* ok */ }, () => { /* swallow */ });
  } catch {
    /* swallow */
  }
}
