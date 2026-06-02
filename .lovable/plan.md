# Production-ready : multi-pays + admin éditable

## Objectif
Aucun bouton non fonctionnel. Chaque pays a son email + WhatsApp service client. L'admin peut tout éditer depuis le dashboard. Solution palliative email via `mailto:` (zéro infra, zéro coût) ; upgrade vers Lovable Emails plus tard quand un domaine sera acheté.

---

## 1. Configuration par pays (table DB + admin UI)

### Migration : nouvelle table `country_configs`
Champs par pays (BF, GH, ML) :
- `code` (BF/GH/ML), `name`, `flag_emoji`, `currency` (XOF/GHS/XOF), `language` (fr/en/fr)
- `support_email` (ex: `bf@sapsaphouse.com` ou ton gmail perso pour l'instant)
- `support_whatsapp` (BF: +22657976660, GH: à fournir, ML: +22377018912)
- `commission_rate` (5–7%)
- `enabled` (bool — masquer un pays côté public sans suppression)
- RLS : lecture publique, écriture admin uniquement

### Seed initial
- BF : `support_whatsapp = +22657976660`, commission 6%
- ML : `support_whatsapp = +22377018912`, commission 6%
- GH : `support_whatsapp = null` (désactivé tant que pas fourni), langue EN, devise GHS

---

## 2. Couche applicative : `useCountryConfig` hook

Nouveau hook qui :
- Détermine le pays actif (depuis `useCountry` existant)
- Récupère la config depuis Supabase (cache via React Query)
- Expose : `supportEmail`, `supportWhatsapp`, `commissionRate`, `currency`, `enabled`
- Fallback : si pays désactivé → redirige vers BF (pays par défaut)

---

## 3. Helpers contact universels (`src/lib/contact.ts`)

Trois fonctions, utilisables partout :
- `openWhatsApp(phone, message)` → `https://wa.me/<phone>?text=<encoded>`
- `openEmail({ to, subject, body })` → `mailto:` pré-rempli
- `openSupport(country, context)` → ouvre WhatsApp service client du pays avec message contextuel

Tous les boutons "Contact", "Réserver via WhatsApp", "Email propriétaire" passent par ces helpers → **aucun bouton mort**.

---

## 4. Notifications propriétaires (mailto + wa.me)

Quand un client soumet une réservation :
1. La réservation est enregistrée en DB (déjà fait)
2. Le client voit un écran de confirmation avec **2 boutons fonctionnels** :
   - "Notifier le propriétaire par WhatsApp" → `wa.me` pré-rempli avec détails résa
   - "Notifier par email" → `mailto:` pré-rempli
3. Bonus : message in-app dans `messages` (déjà fait)

Le propriétaire reçoit donc une notification réelle, gratuite, sans serveur email.

---

## 5. Admin Dashboard — nouvel onglet "Pays"

Page admin qui liste les 3 pays en cartes éditables :
- Toggle activé/désactivé
- Inputs : email support, WhatsApp support, taux commission, devise, langue
- Bouton "Enregistrer" → update DB
- Lecture seule pour les non-admins

Aussi : afficher dans le Kanban réservations le pays + montant commission calculé.

---

## 6. Audit "boutons morts" — passe complète

Je vérifie et corrige chaque bouton de l'app :
- Header : Connexion, Favoris, Compte → tous fonctionnels (déjà ok via AuthModal)
- PropertyDetailPanel : Réserver, Contact tel/wa/email → via helpers
- ReservationFlow : Soumettre → DB + écran notif propriétaire
- Footer / About / CGU → liens vers pages existantes ou supprimés si vides
- Tout bouton sans handler → soit câblé, soit retiré

---

## 7. Ce qui reste hors scope (à activer plus tard)

- **Envoi auto d'emails serveur** : nécessite un domaine. Je préparerai le code mais inactif.
- **WhatsApp Business API** : payant + compte Meta Business. Le `wa.me` couvre 95% des besoins.
- **Pays additionnels** (Côte d'Ivoire, Sénégal…) : ajout en 2 min via la table `country_configs`.

---

## Détails techniques

```
Migration  → country_configs (table + RLS + seed BF/GH/ML)
Hook       → src/hooks/useCountryConfig.ts
Helpers    → src/lib/contact.ts (openWhatsApp, openEmail, openSupport)
Admin      → src/components/admin/CountrySettings.tsx (nouvel onglet)
Refacto    → PropertyDetailPanel, ReservationFlow, Header utilisent les helpers
Confirm    → src/components/ReservationConfirmation.tsx (2 boutons notif owner)
```

Livraison en une passe. Tu pourras tester immédiatement : ouvre une fiche, clique "Email proprio" → ton app mail s'ouvre pré-remplie. Clique "WhatsApp service client" → WhatsApp s'ouvre avec le bon numéro selon le pays sélectionné.