// Templates email transactionnels SapSapHouse — style Booking.com
// Pour l'instant, génère l'HTML et logge en console.
// Envoi réel via edge function / Resend à brancher ultérieurement.

import type { PublicReservationRow } from './reservationsPublicService';

const SUPPORT = {
  email: 'support@sapsaphouse.com', // à mettre à jour
  whatsapp: '+226 XX XX XX XX', // à mettre à jour
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

export interface ConfirmationProperty {
  id: string;
  title: string;
  quartier: string;
  address?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  agent_name?: string;
  agent_phone?: string;
  rules?: {
    pets?: boolean;
    smokers?: boolean;
  };
  keys_instructions?: string;
}

export function generateConfirmationEmail(
  reservation: PublicReservationRow,
  property: ConfirmationProperty,
) {
  const subject = `✅ Réservation confirmée — ${property.title}`;
  const firstName = reservation.user_name.split(' ')[0];
  const mapsLink = property.latitude && property.longitude
    ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
    : '';
  const waAgent = property.agent_phone ? `https://wa.me/${property.agent_phone.replace(/\D/g, '')}` : '';
  const waSupport = `https://wa.me/${SUPPORT.whatsapp.replace(/\D/g, '')}`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a3560;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(26,53,96,0.08);">
      <!-- Header -->
      <tr><td style="background:#1a3560;padding:24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">SapSapHouse</h1>
        <p style="margin:4px 0 0;color:#a8b8d4;font-size:12px;">Mon bien Immo en un clic</p>
      </td></tr>

      <!-- Salutation -->
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 12px;font-size:16px;">Bonjour <strong>${firstName}</strong>,</p>
        <p style="margin:0;font-size:15px;line-height:1.5;color:#334155;">
          Votre réservation est <strong style="color:#16a34a;">confirmée ✅</strong>
        </p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">
          Numéro de réservation : <strong style="color:#1a3560;">${reservation.confirmation_number}</strong>
        </p>
      </td></tr>

      <!-- Le bien -->
      <tr><td style="padding:20px 28px;">
        <h2 style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Le bien</h2>
        ${property.image ? `<img src="${property.image}" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:8px;display:block;"/>` : ''}
        <p style="margin:12px 0 0;font-size:16px;font-weight:600;">${property.title}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${property.quartier}, Ouagadougou</p>
      </td></tr>

      <!-- Votre séjour -->
      <tr><td style="padding:8px 28px 20px;">
        <h2 style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Votre séjour</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;">Arrivée</td><td style="padding:8px 0;text-align:right;"><strong>${fmtDate(reservation.check_in)}</strong><br/><span style="color:#64748b;font-size:12px;">à partir de 14h00</span></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Départ</td><td style="padding:8px 0;text-align:right;"><strong>${fmtDate(reservation.check_out)}</strong><br/><span style="color:#64748b;font-size:12px;">avant 11h00</span></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Durée</td><td style="padding:8px 0;text-align:right;"><strong>${reservation.nights} nuit${reservation.nights > 1 ? 's' : ''}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Voyageurs</td><td style="padding:8px 0;text-align:right;"><strong>${reservation.guests_count}</strong></td></tr>
        </table>
      </td></tr>

      <!-- Montant -->
      <tr><td style="padding:8px 28px 20px;">
        <h2 style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Montant payé</h2>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:14px;color:#64748b;">${reservation.nights} nuit${reservation.nights > 1 ? 's' : ''} × ${fmt(reservation.price_per_night)} FCFA / nuit</p>
          <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#1a3560;">${fmt(reservation.total_price)} FCFA</p>
        </div>
      </td></tr>

      <!-- Accès -->
      <tr><td style="padding:8px 28px 20px;">
        <h2 style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Accès au bien</h2>
        <p style="margin:0 0 8px;font-size:14px;">📍 <strong>${property.address || property.quartier}</strong></p>
        ${mapsLink ? `<p style="margin:0 0 12px;font-size:13px;"><a href="${mapsLink}" style="color:#1a3560;">🗺️ Ouvrir dans Google Maps</a></p>` : ''}
        <p style="margin:12px 0 4px;font-size:13px;"><strong>🔑 Récupération des clés :</strong></p>
        <p style="margin:0 0 8px;font-size:13px;color:#475569;">${property.keys_instructions || 'Les instructions de récupération vous seront communiquées 24h avant votre arrivée.'}</p>
        ${property.agent_name ? `<p style="margin:8px 0 0;font-size:13px;">Contact sur place : <strong>${property.agent_name}</strong></p>` : ''}
        ${waAgent ? `<p style="margin:4px 0 0;font-size:13px;">📱 <a href="${waAgent}" style="color:#16a34a;">WhatsApp : ${property.agent_phone}</a></p>` : ''}
      </td></tr>

      <!-- Règlement -->
      <tr><td style="padding:8px 28px 20px;">
        <h2 style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Règlement maison</h2>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#475569;line-height:1.8;">
          <li>Arrivée : 14h00 – 20h00</li>
          <li>Départ : avant 11h00</li>
          <li>Animaux : ${property.rules?.pets ? 'autorisés' : 'non autorisés'}</li>
          <li>Fumeurs : ${property.rules?.smokers ? 'autorisés' : 'non autorisés'}</li>
          <li>Fêtes : non autorisées</li>
        </ul>
      </td></tr>

      <!-- Support -->
      <tr><td style="padding:8px 28px 24px;border-top:1px solid #e2e8f0;">
        <h2 style="margin:16px 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Besoin d'aide ?</h2>
        <p style="margin:0;font-size:13px;">📧 <a href="mailto:${SUPPORT.email}" style="color:#1a3560;">${SUPPORT.email}</a></p>
        <p style="margin:6px 0 0;font-size:13px;">📱 <a href="${waSupport}" style="color:#16a34a;">WhatsApp SapSapHouse : ${SUPPORT.whatsapp}</a></p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;padding:20px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#64748b;">Merci de votre confiance,</p>
        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a3560;">L'équipe SapSapHouse</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    `Bonjour ${firstName},`,
    ``,
    `Votre réservation est confirmée. Numéro : ${reservation.confirmation_number}`,
    ``,
    `Bien : ${property.title} — ${property.quartier}, Ouagadougou`,
    `Arrivée : ${fmtDate(reservation.check_in)} (14h00)`,
    `Départ  : ${fmtDate(reservation.check_out)} (avant 11h00)`,
    `Durée  : ${reservation.nights} nuit(s)`,
    `Total  : ${fmt(reservation.total_price)} FCFA (${reservation.nights} × ${fmt(reservation.price_per_night)} FCFA)`,
    ``,
    `Support : ${SUPPORT.email} · WhatsApp ${SUPPORT.whatsapp}`,
    ``,
    `L'équipe SapSapHouse`,
  ].join('\n');

  return { subject, html, text, to: reservation.user_email };
}

/** Stub d'envoi — pour l'instant logge en console. À brancher sur edge function plus tard. */
export function sendConfirmationEmail(reservation: PublicReservationRow, property: ConfirmationProperty) {
  const mail = generateConfirmationEmail(reservation, property);
  console.info('[Email Confirmation]', { to: mail.to, subject: mail.subject });
  console.info('[Email HTML preview]', mail.html);
  return mail;
}
