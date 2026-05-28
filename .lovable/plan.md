Ce chantier est volumineux (9 sections, ~8 fichiers majeurs + nouvelle table). Je propose de l'exécuter en 3 lots, dans l'ordre, avec validation entre chaque lot pour limiter les régressions.

## Lot 1 — Backend & fondations (priorité)

1. **Table `reservations` (Supabase)** — migration avec champs spec (confirmation_number auto `SSH-XXXXXXXX`, property_id, dates, nights, prix, status, contact), RLS lecture/insert publiques, GRANTs anon+authenticated.
   - Note: la table existante `reservations` a une structure différente (liée à `auth.users`, status enum). Je crée la nouvelle table sous un nom dédié **`public_reservations`** pour éviter de casser l'existant (admin, owner dashboard, RLS). Tous les services front pointeront dessus.
2. **`src/lib/reservationsPublicService.ts`** — `getReservedDates(propertyId)` + `createReservation(...)`.
3. **`src/lib/emailTemplates.ts`** — `generateConfirmationEmail(reservation, property)` retournant `{ subject, html, text }` style Booking.com (logo, sections bien/séjour/montant/accès/règlement/support). Logué en console + affiché à l'écran pour l'instant.

## Lot 2 — UX réservation & fiche bien

4. **Refonte `ReservationFlow.tsx`** — 3 étapes avec barre de progression :
   - Étape 1 : calendrier (2 mois desktop / 1 scrollable mobile) basé sur `react-day-picker` déjà présent, jours réservés en rouge clair avec label "Réservé", validation en temps réel (popup d'indisponibilité **avant** confirmation), compteur adultes/enfants.
   - Étape 2 : nom / email / téléphone WhatsApp / message.
   - Étape 3 : récap (photo, dates, X nuits × prix = total, **aucune réduction**), bouton "Confirmer", bouton paiement mobile grisé "disponible prochainement".
   - À la confirmation : insert dans `public_reservations` + génération email (console.log + écran de succès avec n° `SSH-XXXX`).
5. **`PropertyDetailPanel.tsx`** :
   - Suppression de toute logique de prix mensuel/réduction (formule unique nuits × prix).
   - Section agent : uniquement **Appeler** (`tel:`) + **WhatsApp** (`wa.me/`). Suppression email + "Demander un rappel".
   - Bouton partage : URL unique `/bien/${id}`, Web Share API si dispo, sinon panel WhatsApp + Copier le lien.

## Lot 3 — Index, i18n, Footer

6. **Pagination desktop `Index.tsx`** — numéros visibles, Précédent/Suivant, ellipses, info "X–Y sur Z biens".
7. **i18n** — install `i18next` + `react-i18next`, `src/i18n/index.ts`, `fr.json`, `en.json` avec les clés listées. Switcher FR/EN dans `Header.tsx` (desktop) et onglet Profil mobile.
8. **Footer** — `CONTACT_INFO` + `LEGAL_LINKS` placeholders, liens mailto/wa.me cliquables, 3 routes légales (`/mentions-legales`, `/politique-confidentialite`, `/conditions-utilisation`) avec page "Contenu en cours de rédaction".

## Hors-scope explicite

- Envoi réel d'email (Resend / edge function) — non demandé maintenant, juste console.log + affichage écran.
- Paiement mobile — bouton grisé uniquement.
- Réductions admin — non implémentées (futur).

## Risques / points d'attention

- La table `reservations` existante est utilisée par `OwnerReservations`, `AdminReservations`, `reservationsService.ts` — **je n'y touche pas**. La nouvelle table publique est séparée.
- Le calendrier 2 mois utilisera `react-day-picker` (déjà dans le projet via shadcn `calendar.tsx`).
- i18n : je traduis uniquement les clés du brief + composants principaux (Header, MobileBottomNav, hero, PropertyCard CTA, ReservationFlow). Pas de migration totale du site.

Confirme et je lance le **Lot 1** (migration + services + template email) — j'enchaînerai les Lots 2 et 3 après.