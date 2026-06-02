// Universal contact helpers — ouvrent WhatsApp ou l'app mail du user.
// Aucune dépendance serveur : fonctionne en production immédiatement.

import type { CountryConfig } from '@/hooks/useCountryConfig';

const sanitizePhone = (raw: string) => raw.replace(/\D/g, '');

export function openWhatsApp(phone: string | null | undefined, message: string) {
  if (!phone) return false;
  const num = sanitizePhone(phone);
  if (!num) return false;
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function openEmail(opts: { to?: string | null; subject?: string; body?: string }) {
  const params = new URLSearchParams();
  if (opts.subject) params.set('subject', opts.subject);
  if (opts.body) params.set('body', opts.body);
  const qs = params.toString();
  const to = opts.to || '';
  const href = `mailto:${to}${qs ? `?${qs}` : ''}`;
  window.location.href = href;
  return true;
}

/** Ouvre le canal WhatsApp service client du pays actif. */
export function openCountrySupport(country: CountryConfig, context = '') {
  const greeting = country.language === 'en'
    ? `Hello SapSapHouse ${country.name} support,`
    : `Bonjour service client SapSapHouse ${country.name},`;
  const msg = `${greeting}${context ? `\n\n${context}` : ''}`;
  if (country.support_whatsapp) return openWhatsApp(country.support_whatsapp, msg);
  if (country.support_email) return openEmail({ to: country.support_email, subject: 'Demande de support', body: msg });
  return false;
}

/** Construit un message de notification réservation prêt à envoyer au propriétaire. */
export function buildReservationOwnerMessage(args: {
  propertyTitle: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  totalPrice?: number;
  currencySymbol?: string;
  confirmationNumber?: string;
}) {
  const lines: string[] = [
    `🏠 Nouvelle demande de réservation — SapSapHouse`,
    ``,
    `Bien : ${args.propertyTitle}`,
    `Client : ${args.clientName}`,
    `Téléphone : ${args.clientPhone}`,
  ];
  if (args.clientEmail) lines.push(`Email : ${args.clientEmail}`);
  if (args.checkIn && args.checkOut) lines.push(`Dates : ${args.checkIn} → ${args.checkOut}`);
  if (args.guests) lines.push(`Personnes : ${args.guests}`);
  if (args.totalPrice != null) lines.push(`Total : ${args.totalPrice.toLocaleString()} ${args.currencySymbol || ''}`);
  if (args.confirmationNumber) lines.push(`Réf : ${args.confirmationNumber}`);
  lines.push(``, `Merci de confirmer la disponibilité au plus vite.`);
  return lines.join('\n');
}
