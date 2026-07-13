# SapSapHouse — Refonte produit complète

Document stratégique. **Aucune ligne de code ne sera écrite tant que tu n'as pas validé cette vision.**

---

## 1. Diagnostic de l'existant

### Ce qui existe aujourd'hui (audit du code)
- **Web (Header.tsx)** : logo carré + titre + slogan, nav horizontale (Biens / Carte / Quartiers), sélecteur de ville pills, notif, compte, contact. Dense mais bien structuré.
- **PWA (MobileHeader + MobileBottomNav)** : header sticky safe-area (logo + cloche + burger drawer), bottom nav 5 onglets (Accueil / Carte / Chercher / Favoris / Profil).
- **Home (Index.tsx)** : Hero avec search — les sections Quartiers, Recommandés, Testimonials, RecentlyViewed existent mais sont juxtaposées sans rythme narratif.
- **Design system (index.css)** : tokens HSL propres (navy `220 70% 32%`, rouge CTA, blanc dominant), shadows/gradients définis. **Solide base — à conserver.**
- **Backend** : Supabase (Cloud) opérationnel avec RLS, notifications, push, favoris, réservations, chat, admin, owner. **Ne rien casser côté data.**

### Ce qui coince (problèmes UX réels)
1. **La Home ne raconte rien** — c'est un moteur de recherche déguisé en page d'accueil (Jakob's Law mal appliquée : on copie Airbnb sans le storytelling).
2. **Hero générique** — bg image + search bar, sans ancrage émotionnel africain, sans promesse.
3. **Quartiers sous-exploités** — juste une grille cliquable, alors que c'est LE différenciant marché africain.
4. **PWA = version réduite du web** — pas de traitement natif (pas de gestures, pas de splash, pas de mise en avant install).
5. **Cartes biens plates** — infos noyées, pas de hiérarchie confiance (vérifié, note propriétaire, temps réponse).
6. **Nav mobile confuse** — "Chercher" séparé de "Accueil" alors que la home EST la recherche → duplication (Hick's Law).
7. **Aucune section "Pourquoi nous"** — zéro construction de confiance pour un marché où la confiance est LE frein #1.

---

## 2. À conserver / supprimer / fusionner

### CONSERVER
- Tokens design (`index.css`) : navy `#1a3560`, rouge CTA, blanc dominant, radius, shadows.
- Stack technique complète (React 18, Vite, Tailwind, shadcn, Leaflet, i18n, Supabase, PWA).
- Toute la logique métier : auth, favoris, réservations, chat, notifications push, admin, owner.
- Composants fonctionnels : `InteractiveMap`, `PropertyDetailPanel`, `UniversalSheet`, `NotificationBell`, `usePushNotifications`.
- Les 2 villes (Ouaga/Abidjan) et le sélecteur.

### SUPPRIMER / SIMPLIFIER
- Slogan "Mon bien Immo en un clic" du header (redondant avec le Hero).
- Onglet "Chercher" du bottom nav mobile (fusionne dans Accueil).
- Bouton "Contact" téléphone du header desktop (déplacé en footer).
- CTA "Publier un bien" caché dans le drawer PWA → doit remonter en action visible.

### FUSIONNER
- "Accueil" + "Chercher" (PWA) → un seul onglet **Explorer**.
- "Biens" + "Carte" (Header web) → un seul onglet **Explorer** avec toggle liste/carte.
- Tests + "Pourquoi nous" → une seule section **Confiance**.

---

## 3. Nouvelle architecture UX

### Navigation Web (Header)
```
[Logo SapSapHouse]   Explorer  ·  Quartiers  ·  Publier un bien       [🇧🇫/🇨🇮] [🔔] [Se connecter]
```
- 3 liens seulement (Hick's Law : moins de choix = décision plus rapide).
- "Publier un bien" en lien nav (pas en CTA rouge) car c'est un parcours secondaire.
- Bouton "Se connecter" en outline navy (pas rouge — le rouge reste réservé aux CTA de conversion).

### Navigation PWA (Bottom Tab Bar — 4 onglets)
```
[Explorer 🧭]  [Quartiers 📍]  [Favoris ❤️]  [Compte 👤]
```
- 4 au lieu de 5 (Fitts's Law : cibles plus grandes, plus faciles à toucher).
- "Publier un bien" = FAB flottant navy au-dessus du bottom nav (action primaire propriétaire, visible sans surcharger).

### Header PWA
- Réduit à : logo mini + ville active (tap = switch) + cloche notifications.
- Safe-area top respectée (fix déjà appliqué).
- Se cache au scroll down, réapparaît au scroll up (comme Instagram/Airbnb).

---

## 4. Nouvelle Home — storytelling

Ordre validé, chaque section a une identité visuelle **différente** (rythme clair/sombre/photo/illustration) :

```
1. HERO IMMERSIF               [photo pleine largeur, quartier africain vivant au coucher de soleil]
   ↓                            fond photo · overlay dégradé navy bas
2. EXPLORER PAR BESOIN         [fond blanc · 4 cards illustrées: Louer / Colocation / Meublé / Bureau]
   ↓
3. QUARTIERS POPULAIRES        [fond navy foncé · carousel horizontal cards riches quartier]
   ↓
4. BIENS RECOMMANDÉS           [fond blanc · grille 3 col / 1 col mobile · PropertyCard v2]
   ↓
5. POURQUOI SAPSAPHOUSE        [fond crème #faf7f2 · 3 piliers avec pictos: Vérifié / Local / Rapide]
   ↓
6. VISITES IMMERSIVES          [fond noir · vidéo/360 · badge "Nouveau"]
   ↓
7. COMMENT ÇA MARCHE           [fond blanc · 3 étapes numérotées grand format]
   ↓
8. ESPACE PROPRIÉTAIRE         [fond navy · split image + CTA "Publier gratuitement"]
   ↓
9. PARTENAIRES                 [fond blanc · logos en niveaux de gris]
   ↓
10. FOOTER                     [fond navy très foncé · nav + légal + contact + langue]
```

**Principes appliqués** :
- **Gestalt (proximité)** : chaque section a padding vertical généreux (min 96px desktop, 64px mobile).
- **Progressive disclosure** : détails quartier/bien accessibles au clic, pas exposés d'emblée.
- **Loi de la simplicité (Occam)** : jamais plus de 3 CTA visibles simultanément.

---

## 5. Hero — refonte détaillée

### Desktop
- **Full-bleed**, hauteur 85vh (pas 100 pour laisser deviner section suivante = scroll incentive).
- Photo : quartier africain moderne, heure dorée, présence humaine discrète (pas de mannequin agence).
- Overlay : dégradé navy bas → transparent haut (lisibilité texte, respect image).
- Slogan H1 : **"Trouvez votre chez-vous, en toute confiance."** — 56px, poids 600, letter-spacing serré.
- Sous-titre : "La plateforme immobilière moderne du Burkina et de la Côte d'Ivoire."
- Barre de recherche : **flottante glassmorphique**, arrondie (radius 16), 4 champs (Ville · Type · Budget · Dates) + bouton rouge "Rechercher".
- Logo : intégré en haut à gauche mais **plus grand** (48px), avec le nom en display font.

### PWA (Hero mobile)
- Photo pleine largeur, hauteur 60vh.
- Slogan sur 2 lignes max, 32px.
- **1 seul champ visible** : "Où cherchez-vous ?" → tap ouvre l'overlay recherche universelle.
- Chips tags sous la barre : `Villa` · `Meublé` · `Colocation` · `Bureau` (scroll horizontal).

---

## 6. Quartiers = produit à part entière

Chaque QuartierCard (Web + PWA) affiche :
- Photo hero du quartier (16:9)
- Nom + ville
- Badge sécurité (🛡️ Élevée / Bonne / Modérée) — codes couleur discrets
- Prix médian /mois
- Temps trajet centre-ville
- 3 pictos : 🏫 écoles · 🚌 transport · 🛒 commerces (comptage)
- "Profil idéal" en 1 phrase : *"Familles, cadres, calme résidentiel"*
- CTA "Découvrir le quartier"

Page quartier dédiée (v2) : bio, biens du quartier, carte zoomée, POI, témoignages résidents.

---

## 7. Property Card v2

Hiérarchie visuelle stricte (Gestalt) :
```
┌──────────────────────────────┐
│  [Photo 4:3, coins arrondis] │  ← badges: Vérifié ✓ · Nouveau
│                              │
├──────────────────────────────┤
│  350 000 FCFA/mois           │  ← 20px semi-bold navy
│  Villa moderne 4 pièces      │  ← 15px medium
│  📍 Ouaga 2000 · 5 min centre│  ← 13px muted
│  🛏 4 · 🚿 2 · 📐 180m²      │  ← icônes 12px
│  ─────────────────────────── │
│  ⭐ 4.8 (24)   [Voir] [❤️]  │
└──────────────────────────────┘
```

---

## 8. PWA — traitement natif

- **Splash screen** premium : logo animé sur fond navy (fade in 400ms).
- **Install banner** contextuel : après 2 visites OU 30s d'engagement (pas au premier écran).
- **Gestures** : swipe back sur détail bien, pull-to-refresh sur listes, swipe carousel photos.
- **Offline élégant** : page dédiée avec dernières annonces vues en cache + illustration.
- **Transitions pages** : slide horizontal (250ms, ease-out) — pas de fade lourdaud.
- **Bottom sheet** : détail bien s'ouvre en sheet draggable (snap points 50% / 90%).
- **Haptic** : vibration légère sur tap favori (navigator.vibrate 10ms).
- **Skeleton** loading systématique.

---

## 9. Design System (extension)

À ajouter aux tokens existants :
- **Typographie** : `Sora` (display, H1-H3) + `Inter` (body, UI) — pas Poppins/générique.
- **Rythme d'espacement** : échelle 4/8/12/16/24/32/48/64/96.
- **Radius** : sm 8 · md 12 · lg 16 · xl 24 (cards) · full (pills).
- **Shadows** : `elevation-1` (cards), `elevation-2` (hover), `elevation-3` (modales, sheets).
- **Motion** : durées 150/250/400ms, easing `cubic-bezier(0.4, 0, 0.2, 1)` (Apple standard).
- **Dark mode** : tokens déjà prêts dans index.css — activer plus tard sans refonte.

---

## 10. Justifications UX (principes)

| Décision | Principe |
|---|---|
| 3 liens nav web / 4 tabs PWA | **Hick's Law** — moins de choix, décision plus rapide |
| Bottom nav mobile, FAB "Publier" | **Fitts's Law** — cibles pouce, zone atteignable |
| Sections alternées clair/sombre | **Gestalt** (similarité/contraste) — rythme visuel |
| Storytelling Home 10 sections | **Progressive Disclosure** — info dévoilée au bon moment |
| Barre recherche flottante Hero | **Jakob's Law** — pattern familier (Airbnb, Booking) |
| Quartier = destination | **Peak-End Rule** — expérience mémorable au bon endroit |
| Badges vérifié/note visibles card | **Trust signals** — confiance = frein #1 marché AF |
| Photos humaines discrètes | **Emotional design (Norman)** — attachement |
| 1 seul CTA rouge par vue | **Von Restorff** — l'unique attire l'œil |

---

## 11. Performance / Accessibilité

- Images : `<img loading="lazy" srcset>` + AVIF/WebP + placeholder blur.
- Fonts : `font-display: swap`, préchargement Sora Regular + Inter Regular.
- Code splitting : routes déjà lazy (Admin, Owner) ✅ — étendre à sections lourdes Home.
- **WCAG AA** : ratios ≥ 4.5:1 vérifiés, navigation clavier complète, focus visibles, alt textes.
- Lighthouse target : Perf ≥ 90, A11y ≥ 95, Best Practices 100, SEO ≥ 95.

---

## 12. Roadmap d'implémentation (après ta validation)

**Phase 1 — Fondations (1 chantier)**
Design system étendu (fonts Sora/Inter, tokens motion/spacing/shadow), Header + Nav web + PWA refondus.

**Phase 2 — Home storytelling (2 chantiers)**
Hero immersif → sections 2 à 5 → sections 6 à 10.

**Phase 3 — Composants clés (1 chantier)**
QuartierCard v2 + PropertyCard v2 + page Quartier dédiée.

**Phase 4 — PWA native feel (1 chantier)**
Splash, transitions, gestures, install banner intelligent, offline élégant.

**Phase 5 — Polish**
Audit Lighthouse + a11y + micro-interactions finales.

---

## Ce dont j'ai besoin de toi avant de coder

1. **Valide** cette vision globale (oui / ajustements).
2. **Choisis les fonts** : Sora + Inter proposé, ou tu préfères autre chose ?
3. **Photo Hero** : tu me fournis une image (Ouagadougou/Abidjan idéalement) ou je génère une image premium AI ?
4. **Priorité de phase** : je démarre par Phase 1 (fondations + nav) ou tu veux voir directement le nouveau Hero d'abord ?

Rien ne sera touché tant que tu n'as pas répondu.
