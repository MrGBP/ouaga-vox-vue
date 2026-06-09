# SapSapHouse — Passage en mode MVP Production

Objectif : tout ce qui s'affiche doit être réel. Le code mort/mockData n'est pas supprimé — il est **masqué derrière un flag réactivable**.

## Principe central : Flag `MOCK_MODE` réactivable

Création de `src/lib/mockMode.ts` :

```ts
// Toggle global. false = MVP production. true = remet toutes les données mock.
export const MOCK_MODE = false;
// Persisté aussi en localStorage ('sapsap_mock_mode') pour bascule rapide
// depuis la console : localStorage.setItem('sapsap_mock_mode','1');
```

Chaque endroit qui utilise `mockProperties`, `adminMockData`, `MobileCarousel`, `AIComparator`, `AIProfileSection`, `VoiceSearch` devient conditionnel : `if (isMockEnabled()) { ... }`. **Aucun fichier supprimé**, juste import paresseux / branchements masqués.

---

## Lot 1 — Admin 100 % Supabase (mockData masqué)

1. **RPC `get_dashboard_stats`** (migration) — KPIs en un appel (biens publiés/pending, réservations totales/pending/confirmées ce mois, users totaux/nouveaux 7j).
2. **`AdminDashboard.tsx`** — remplace adminMockData par : `supabase.rpc('get_dashboard_stats')`, liste réelle des biens `admin_status='pending'` (jointure `profiles`), 20 dernières réservations.
3. **Empty states propres** quand 0 résultat (✅ « Aucun bien en attente »).
4. **Realtime** : channel `admin-live` sur INSERT `reservations` + `properties` → feed live.
5. **`adminMockData.ts` conservé**, imports gatés par `isMockEnabled()`.

## Lot 2 — Wizard publication en 3 étapes (`PublishPropertyWizard.tsx`)

Remplace `OwnerPropertyFormModal` (gardé en fallback si MOCK_MODE).

- **Étape 1** — Choix du type (grille emoji + hint « courte durée / nuit » vs « longue durée / mois »).
- **Étape 2** — Champs **adaptatifs** via `getFieldsForType(type)` :
  - Meublé → chambres, SDB, étage, équipements, prix/nuit
  - Non meublé longue durée → chambres, SDB, étage, caution, prix/mois
  - Bureau/local → surface, pièces, parking, PMR
  - Communs : titre, quartier (autocomplete BDD), surface, **min 1 photo (au lieu de 3 pour ne pas bloquer)**.
- **Étape 3** — Pin sur la carte OU mode « quartier_only » + 3 POI, mini-preview, soumission → `admin_status='pending'`.

Upload photos direct Supabase Storage (`property-media`, 5 Mo max, jpg/png/webp), retour `publicUrl` avant insert.

## Lot 3 — UI adaptative dans `PropertyDetailPanel`

- Meublé → calendrier + bouton **Réserver**
- Non meublé longue durée → bouton **Demander une visite** (jamais de calendrier)
- Bureau/local → **Contacter** + **Planifier visite**
- Helper `isTypeFurnished(type)` + `isCommercial(type)` centralisé dans `filterOptions.ts`.

## Lot 4 — `OwnerDashboard` réel

Page `/proprietaire` enrichie :
- Liste de mes biens (Supabase, RLS owner_id), carte par bien avec KPI vues/favoris + badge statut.
- Actions selon statut : Modifier / **Mettre en pause** (admin_status='paused') / Réactiver / Stats.
- Réservations liées à mes biens (jointure).
- Calendrier global multi-biens (couleur par bien).

Ajout d'un statut `'paused'` dans le check constraint `admin_status` (migration).

## Lot 5 — Calendrier propriétaire (`blocked_dates`)

Migration : table `blocked_dates` (property_id, owner_id, date_from, date_to, reason, RLS owner-only, GRANT authenticated).
- Sélection plage → blocage. `ReservationFlow` vérifie blocked_dates **+** reservations existantes avant validation.

## Lot 6 — Notifications temps réel

Migration : table `notifications` (user_id, type, title, body, data jsonb, read, RLS own + GRANT authenticated, ALTER PUBLICATION supabase_realtime).
- Insert serveur (triggers) sur INSERT reservation, UPDATE property.admin_status.
- Cloche dans `Header.tsx` + `MobileNavbar.tsx` avec badge count temps réel.

## Lot 7 — Médias robustes

- `public/placeholder-property.svg` (icône 🏠 fond gris).
- Wrapper `<PropertyImage>` avec onError → placeholder. Migration progressive : remplacer `<img>` dans PropertyCard, PropertyDetailPanel, MobileApp, OwnerDashboard.

## Lot 8 — Fix superpositions modals / Leaflet

Hook `useLockBackdrop(open)` : bloque scroll body + cache `.leaflet-control/.leaflet-top/.leaflet-bottom`. Appliqué dans `AuthModal`, `ReservationFlow`, `VirtualTourModal`. Z-index hiérarchie documentée dans `index.css`.

## Lot 9 — Nettoyage **masqué** (pas supprimé)

Composants `MobileBottomSheet`, `MobileCarousel`, `AIComparator`, `AIProfileSection`, `VoiceSearch`, hooks voice : **imports gardés** mais rendu conditionné par `isMockEnabled()`. Fusion des états mobiles dupliqués Index ↔ MobileApp : un seul propriétaire (MobileApp).

## Lot 10 — Hiérarchie géographique

Migration table `locations` (country_code, city, quartier, commune, arrondissement, lat/lng, active). Seed Ouaga (12 arrondissements) + Bamako (6 communes). Ghana `active=false`. Autocomplete quartier branchée sur cette table dans le wizard + FilterBar.

---

## Migrations SQL groupées (un seul fichier)

1. `get_dashboard_stats()` SECURITY DEFINER
2. ALTER `properties.admin_status` check constraint pour inclure `'paused'`
3. CREATE TABLE `blocked_dates` + GRANT + RLS + policies owner
4. CREATE TABLE `notifications` + GRANT + RLS + policies own + realtime publication
5. CREATE TABLE `locations` + GRANT (SELECT anon) + seed Ouaga/Bamako
6. Triggers insert notifications (new_reservation → owner, status change → owner)

---

## Ordre d'exécution proposé

1. **Migration SQL unique** (Lots 1, 4, 5, 6, 10)
2. **`mockMode.ts` + gating admin** (Lot 1 + Lot 9 partiel)
3. **Wizard publication** (Lot 2) + helpers types (Lot 3)
4. **PropertyDetailPanel adaptatif** (Lot 3)
5. **OwnerDashboard + blocked_dates UI** (Lots 4, 5)
6. **Notifications cloche** (Lot 6)
7. **PropertyImage + placeholder** (Lot 7)
8. **useLockBackdrop** (Lot 8)
9. **Autocomplete locations** (Lot 10)

---

## Question avant exécution

Le plan est dense (10 lots, 1 grosse migration, ~15 fichiers touchés). **Tu veux que je lance tout en une seule passe**, ou **je découpe en 2-3 livraisons** (par ex. d'abord Lots 1+2+3+9 = admin réel + wizard + UI adaptative + mock toggle, puis le reste) pour que tu puisses tester entre chaque ?
