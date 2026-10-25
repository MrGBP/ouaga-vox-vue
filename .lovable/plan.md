# Refonte visuelle : icônes réalistes, carte sobre, vignettes, identité vivante

Périmètre : toutes les versions (mobile, tablette, desktop). La fiche détaillée du bien ne change pas.

## 1. Barre de navigation et onglets en relief (skeuomorphisme léger)
- Onglets du bas (Accueil, Explorer, Favoris, Profil) et onglets/outils (Liste/Carte, Filtres, SapSap AI) : boutons en relief doux (ombre portée, reflet, effet "enfoncé" quand actif).
- Animation très courte au toucher (pression ~120 ms, petit rebond), onglet actif qui "s'allume".

## 2. Icônes réalistes par type de bien
- Un jeu d'icônes illustrées cohérentes, ressemblant au vrai bien : studio meublé, appartement meublé, villa meublée, maison, chambre, magasin, bureau, hôtel (pas de terrain).
- Une seule source pour ces icônes, utilisée partout : filtres, barre de types, carte, vignettes.

## 3. Carte mobile sobre
- Chaque repère = icône du type + prix abrégé à côté (ex. 25k, 1,2M), sans "/ mois" ni "/ nuit" sur la carte (affiché dans la vignette au clic).
- Regroupement automatique quand les biens sont proches : une bulle montre le nombre et les icônes des types présents ; zoomer les sépare. Aucun bien ni type n'est oublié.
- Fond de carte : OpenStreetMap gratuit (plan) et vue satellite gratuite conservée par défaut, avec mention légale OSM obligatoire.

## 4. Vignettes des biens (toute la plateforme)
- Photo plus grande et dominante ; infos à côté (ou dessous sur petits écrans) sans rien poser sur la photo, sauf le cœur.
- Jusqu'à 3 caractéristiques maximum, choisies selon ce qui compte le plus pour les locataires : chambres, climatisation, Wi-Fi (ou surface si pas de chambres). Remplace la règle actuelle "aucune caractéristique sur les vignettes".

## 5. Identité SapSapHouse sur tout le site
- Palette harmonisée : blanc, bleu marine #1a3560, orange poussière en accent.
- Boutons unifiés (principal, secondaire, discret) avec micro-animations courtes au survol et au clic ; retours visuels clairs (succès, ajout favori, erreur).

## Détails techniques
- Composant d'icônes partagé par type (SVG illustrés) + helper prix abrégé ; tests sur l'abréviation du prix et le choix des 3 caractéristiques.
- Regroupement avec leaflet.markercluster ; tuiles OSM standard en plan.
- Tokens CSS (ombres relief, durées) dans index.css ; variantes de bouton dans le composant Button.
