## Refonte `OwnerPropertyFormModal` — 13 points demandés

Périmètre : `src/owner/components/OwnerPropertyFormModal.tsx` (formulaire propriétaire uniquement, **on ne touche PAS** au formulaire admin `AdminBiensLive.tsx` qui reste comme avant — l'utilisateur a confirmé que la version admin est "nettement mieux", c'est seulement le formulaire propriétaire qui est refondu).

### 1. Nouvelle structure en 4 étapes

```
Étape 1 — Informations principales
  Titre, description, type de bien, prix (+ cadence si meublé)

Étape 2 — Détails du bien & Médias
  Chambres*, SDB, pièces* (+aide), surface, étage, capacité
  Caractéristiques (cocher) — DÉPLACÉ depuis l'étape 3
  À proximité (POI cochables) — NOUVELLE UX
  Médias (photos/vidéos) avec choix image principale

Étape 3 — Localisation
  Ville (auto-déduite du pays détecté), Quartier (autocomplete),
  Adresse, MapPicker auto-centré sur le quartier choisi
  Contacts : WhatsApp (pré-rempli depuis profil) + tél. secondaire

Étape 4 — Aperçu & validation finale
  Récapitulatif complet read-only + case "Je confirme…"
  Bouton "Publier" actif uniquement si case cochée + contrôles OK
```

### 2. Suppressions

- Champ "Pays" (sélecteur `selectedCountry` retiré de l'UI ; on garde la variable interne dérivée de `useCountryConfig()` pour l'indicatif téléphone et l'enregistrement BDD).
- Toggle "Bien meublé" manuel : le caractère meublé est **dérivé automatiquement** de `isTypeFurnished(type)` (déjà présent dans `mockData`). La cadence nuit/mois reste car nécessaire pour les meublés.
- Champ libre "distance en mètres" pour les POI (remplacé par un message d'aide invitant à citer des repères connus).

### 3. Validations renforcées

- **Chambres obligatoires** (≥ 1) pour tous types sauf bureau/local commercial.
- **Pièces obligatoires** (≥ 1) avec tooltip d'aide : *"Le nombre de pièces correspond au total des espaces principaux : salon, chambres, bureau, salle à manger…"*
- **Contrôle de cohérence non-bloquant** : si `rooms < bedrooms + 1 (salon implicite)`, afficher avertissement *"Le nombre de pièces semble inférieur…"* avec bouton "Confirmer quand même".
- WhatsApp obligatoire (déjà en place) + format E.164.
- Contrôles bloquants à l'étape 4 : titre, prix, quartier, lat/lng, WhatsApp, ≥ 1 média, chambres si requis.

### 4. WhatsApp depuis le profil

- Au montage : lire `profiles.phone` de l'utilisateur connecté → pré-remplir `waLocal`.
- Si l'utilisateur modifie le numéro et publie : proposer (toast léger, non-bloquant) *"Mettre à jour votre numéro principal dans votre profil ?"* avec action `Mettre à jour`.
- Numéro secondaire facultatif inchangé.

### 5. Carte auto-centrée sur le quartier

- Quand `quartier` change : `SELECT lat,lng FROM locations WHERE name = quartier AND country_code = X` ; si trouvé, repositionner `lat`/`lng` sur ce point (l'utilisateur garde la possibilité de l'ajuster via `MapPicker`).
- Fallback : centre de la ville (déjà en place).

### 6. POI simplifiés

- Liste cochable de catégories courantes (école, université, marché, mosquée, église, pharmacie, hôpital, centre commercial, supermarché, station-service).
- Pour chaque catégorie cochée : un champ texte facultatif *"Nom (facultatif)"*.
- À la publication : on enregistre dans `property_pois` avec `distance_m = NULL` (la vérification web/calcul automatique = travail futur côté serveur, hors scope front).
- Section ouverte par défaut, libellée avec une note explicative sur l'utilité des repères connus.

### 7. Autosave (brouillon local)

- Clé `localStorage` : `sapsap_owner_draft_v1` (un seul brouillon actif par utilisateur, écrasé à chaque publication réussie).
- Sauvegarde **debounced 800 ms** à chaque changement d'état (titre, description, prix, features, contacts, step…). Pas de médias `File` (impossible à sérialiser) — uniquement les URLs et métadonnées.
- À l'ouverture du modal (mode création uniquement) : si brouillon présent + `updated_at` < 7 jours, proposer une bannière *"Annonce non terminée du DATE — Reprendre / Recommencer"*.
- Suppression du brouillon : après publication OK, après "Recommencer", après "Quitter et abandonner".

### 8. Confirmation avant abandon

- Si `dirty === true` (au moins un champ modifié) et l'utilisateur clique sur la croix de fermeture ou presse `Escape` :
  - Afficher un `ConfirmDialog` (composant existant `src/admin/components/ConfirmDialog.tsx`) :
    - *"Vous êtes sur le point de quitter. Vos modifications non publiées sont sauvegardées en brouillon. Continuer l'édition ou Quitter ?"*
  - Boutons : `Continuer l'édition` (annule) / `Quitter` (ferme + garde brouillon).
- `beforeunload` listener pour la fermeture navigateur.

### 9. Étape 4 — Aperçu

Composant `<StepReview>` interne affichant :
- Section "Le bien" : titre, type, prix, surface, chambres/SDB/pièces, description.
- Section "Caractéristiques" : badges des features cochées + customs.
- Section "À proximité" : liste des POI cochés.
- Section "Localisation" : adresse, quartier, mini-carte read-only.
- Section "Contacts" : WhatsApp + tél secondaire.
- Section "Médias" : grille de miniatures avec étiquette "Image principale" sur la première.
- Case *"☐ Je confirme que toutes les informations fournies sont exactes."* (obligatoire).
- Bouton "Publier" désactivé tant que case décochée OU contrôles bloquants en échec ; les erreurs sont listées dessus.

### Détails techniques

- Fichier modifié : `src/owner/components/OwnerPropertyFormModal.tsx` (édition lourde mais ciblée, pas de réécriture complète — on garde la logique upload média/POI/save existante).
- Pas de migration BDD nécessaire (schéma actuel suffit).
- Nouveau hook léger inline `useDraftAutosave(state, key)` ou simple `useEffect + setTimeout` dans le composant.
- Internationalisation : ajout des clés FR/EN nécessaires dans `src/i18n/fr.json` et `en.json` sous `owner.form.*` (ex. `step4_title`, `confirm_quit`, `confirm_truthful`, `rooms_help`, `bedrooms_required`, `coherence_warning`, `resume_draft`).
- Aucun changement d'API ou de service backend.

### Ce qui n'est PAS fait dans cette itération

- La vérification web automatique des POI (recherche internet du nom de l'école/marché et calcul de distance) : ce sera une edge function ultérieure. Pour l'instant on stocke nom + catégorie + `distance_m = NULL` et l'UI publique affichera "à proximité" sans distance.
- Aucun changement sur `AdminBiensLive.tsx` (formulaire admin reste tel quel).
- Aucun changement sur les pages publiques d'affichage du bien.
