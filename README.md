# Mon Bien Immo 🏠

Plateforme immobilière intelligente pour Ouagadougou, Burkina Faso.

## Fonctionnalités

- 🗺️ **Carte interactive** — Visualisez les biens sur une carte Leaflet avec clustering et navigation par quartier
- 🔍 **Filtres avancés** — Filtrez par type (villa, maison, bureau, commerce, boutique), prix, chambres et disponibilité
- 🏘️ **Exploration par quartier** — Ouaga 2000, Zone du Bois, Koulouba, Tampouy, Patte d'Oie, Dassasgho, Zogona
- 🎙️ **Recherche vocale** — Trouvez un bien par la voix
- 🤖 **Comparateur IA** — Comparez des biens avec l'aide de l'intelligence artificielle
- 🏠 **Visites virtuelles 360°** — Explorez les biens en immersion
- 📱 **Responsive** — Optimisé mobile, tablette et desktop

## Stack technique

- **Frontend** : React 18 · TypeScript · Vite · Tailwind CSS
- **UI** : shadcn/ui · Framer Motion · Recharts
- **Carte** : Leaflet · React-Leaflet · MarkerCluster
- **Backend** : Lovable Cloud (base de données, edge functions, authentification)

## Démarrage rapide

```bash
# Cloner le dépôt
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## Structure du projet

```
src/
├── components/       # Composants React (Header, FilterBar, InteractiveMap, etc.)
├── hooks/            # Hooks personnalisés (voix, mobile)
├── integrations/     # Client Supabase auto-généré
├── lib/              # Données de simulation (mockData)
├── pages/            # Pages (Index, NotFound)
└── assets/           # Images et ressources
```

## Licence

Projet privé — Tous droits réservés.
