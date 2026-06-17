# Plan — 5 modules prioritaires SapSapHouse

## Module 1 — Auth OTP style TikTok (WhatsApp + Email)

**Remplacer entièrement** `src/components/AuthModal.tsx` et `src/pages/Auth.tsx` par un flux OTP sans mot de passe.

Écrans :
1. Choix méthode : 2 gros boutons "Continuer avec WhatsApp" / "Continuer avec l'email"
2. Saisie : sélecteur pays (BF +226 / ML +223 / GH +233, auto-sélection via `useGeoCity`), champ unique (téléphone E.164 ou email)
3. OTP : 6 cases (composant `OTPInput`), focus auto, paste auto, validation auto au 6ème chiffre, countdown 60s + bouton renvoyer
4. 1ère connexion : champ prénom uniquement → upsert dans `profiles.full_name`

API Supabase :
- WhatsApp : `supabase.auth.signInWithOtp({ phone, options: { channel: 'whatsapp' } })`
- Email : `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: undefined } })`
- Vérif : `supabase.auth.verifyOtp({ phone|email, token, type: 'sms'|'email' })`

Note : l'envoi WhatsApp OTP nécessite un provider SMS configuré côté Supabase (Twilio avec channel WhatsApp). Si non configuré, l'envoi retournera une erreur lisible à l'utilisateur — on ne peut pas l'activer depuis le code. À indiquer après la livraison.

Supprimer : l'ancien formulaire email+mot de passe, la page `/auth`, `/forgot-password`, `/reset-password` (garder les routes mais rediriger vers la nouvelle modale, ou les supprimer si non utilisées ailleurs).

## Module 2 — Formulaire publication simplifié

Dans `src/admin/components/PropertyFormModal.tsx` et `src/owner/components/OwnerPropertyFormModal.tsx` :
- Retirer la section "Visite 360° (URL)" et tout champ "Ajouter un lien et valider"
- Dans `MediaUploader` : retirer les onglets/cases "image / vidéo / 360", garder un seul uploader universel qui détecte le `kind` automatiquement à partir du MIME (image/* → image, video/* → video, image avec ratio 2:1 → 360 — ou simplement tout marquer `image` par défaut et laisser le rendu décider). Garder le champ `kind` en DB pour compatibilité.

## Module 3 — SapSapHouse comme propriétaire officiel

DB :
- Ajouter colonne `is_official BOOLEAN DEFAULT false` sur `properties` (migration)
- Le profil officiel ne peut pas avoir un id "sapsaphouse-official-id" littéral (les profils sont liés à `auth.users.id` UUID). À la place :
  - Créer un compte auth dédié `official@sapsaphouse.com` manuellement (ou via flag `is_official` sur `profiles`)
  - Ajouter colonne `is_official BOOLEAN DEFAULT false` sur `profiles`
- Le contact "officiel" est lu depuis `country_configs.support_whatsapp` selon le pays du bien

Front :
- `PropertyDetailPanel` : si `property.is_official === true` → badge "✓ Bien SapSapHouse Officiel", nom = "SapSapHouse", téléphone = `countryConfig.support_whatsapp` du pays du bien
- Sinon : nom + téléphone du propriétaire (logique actuelle)

Formulaires admin/owner : ajouter checkbox "Publier comme bien SapSapHouse Officiel" (visible **uniquement aux admins**)

## Module 4 — RLS réservations corrigé

Migration :
- Remplacer la policy INSERT existante par une qui exige `auth.uid() IS NOT NULL AND user_id = auth.uid()`
- Garder la lecture pour user + owner + admin (déjà en place via `is_property_owner` / `has_role`)
- Ajouter colonne `confirmation_number TEXT UNIQUE` sur `reservations` si absente

Front (`ReservationFlow.tsx`) :
- Vérifier `auth.getUser()` avant insert, sinon `requireAuth(...)` puis retry
- Toujours envoyer `user_id: user.id` dans le payload
- Générer `confirmation_number` style `SSH-XXXXXX` côté front
- Toast d'erreur explicite si RLS bloque, navigation vers écran de confirmation au succès

## Module 5 — Calendrier réservation

Dans le composant calendrier de `ReservationFlow.tsx` :
- `disabled={{ before: today }}` pour bloquer dates passées
- Charger via `Promise.all` : reservations actives (pending/confirmed) + blocked_dates ≥ aujourd'hui
- Calculer un `Set<string>` de jours indisponibles, les marquer `modifiers={{ unavailable }}` en rouge avec tooltip
- À la sélection d'une plage : vérifier immédiatement chevauchement, afficher alerte inline
- Bouton "Confirmer" `disabled` si : dates manquantes / chevauchement / coordonnées incomplètes

## Détails techniques

- **OTP UI** : utiliser le composant existant `src/components/ui/input-otp.tsx` (déjà basé sur `input-otp`)
- **Sélecteur pays auth** : 3 entrées en dur (BF/ML/GH) avec drapeau + indicatif, défaut = `activeCity?.country`
- **Profil officiel** : créé manuellement via SQL une fois (insertion d'une ligne dans `profiles` avec un UUID stable, et marquage `is_official=true`). Le `id` reste un vrai UUID — pas de string littéral.
- **`is_official` sur properties** : exposé en lecture publique (déjà couvert par la policy SELECT existante sur `properties`)
- **Migrations à créer** :
  1. ALTER TABLE properties ADD COLUMN is_official BOOLEAN DEFAULT false
  2. ALTER TABLE profiles ADD COLUMN is_official BOOLEAN DEFAULT false
  3. ALTER TABLE reservations ADD COLUMN confirmation_number TEXT UNIQUE
  4. DROP + CREATE POLICY pour reservations INSERT
- **Configuration Supabase requise (action utilisateur)** : activer le provider Phone (Twilio + WhatsApp channel). Sans ça l'OTP WhatsApp ne partira pas. L'OTP email fonctionne sans config supplémentaire.

## Ordre d'exécution

1. Migrations DB (modules 3, 4)
2. Refonte AuthModal (module 1)
3. Simplification formulaires + MediaUploader (module 2)
4. PropertyDetailPanel + checkbox officiel (module 3)
5. ReservationFlow + calendrier (modules 4, 5)
6. Insertion du profil SapSapHouse officiel (data seed)

## Points à confirmer avant build

- **Numéro WhatsApp officiel SapSapHouse par pays** : déjà en DB (`country_configs.support_whatsapp`). Confirmé pour BF (+226 57 97 66 60), à vérifier pour ML et GH (actuellement hérite de BF).
- **Twilio/WhatsApp provider Supabase** : à activer manuellement par l'utilisateur dans la console Cloud après livraison. Sinon seul l'OTP email fonctionnera.
- **Compte officiel SapSapHouse** : je crée un UUID stable + ligne `profiles` marquée `is_official=true`, sans compte `auth.users` lié (le bien sera créé par un admin qui coche la case, pas connecté en tant que "SapSapHouse"). OK ?
