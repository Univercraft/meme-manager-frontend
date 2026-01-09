# Meme Manager - Frontend (Angular)

Frontend du projet Meme Manager développé avec Angular 18 et Tailwind CSS.

## 📋 Prérequis

- Node.js (version 18+)
- npm ou yarn
- Angular CLI (`npm install -g @angular/cli`)

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

## ▶️ Démarrage

Démarrer le serveur de développement :
```bash
npm start
```

L'application sera accessible sur : http://localhost:4200

## 🏗️ Build

### Build de développement
```bash
npm run build
```

### Build de production
```bash
npm run build:prod
```

Les fichiers compilés seront dans le dossier `dist/`.

## 📁 Structure

```
src/
├── app/
│   ├── core/              # Services, guards, interceptors
│   │   ├── services/      # Services métier
│   │   ├── guards/        # Guards de navigation
│   │   └── interceptors/  # Intercepteurs HTTP
│   ├── pages/             # Composants de pages
│   │   ├── home/          # Page d'accueil
│   │   ├── memes/         # Page de gestion des mèmes
│   │   ├── profile/       # Page profil utilisateur
│   │   └── auth/          # Pages d'authentification
│   └── shared/            # Composants partagés
│       ├── components/    # Composants réutilisables
│       └── models/        # Modèles TypeScript
├── environments/          # Configuration environnement
├── assets/               # Ressources statiques
└── styles.css           # Styles globaux (Tailwind)
```

## 🔧 Configuration

La configuration du backend se fait dans `src/environments/` :

- `environment.ts` : Configuration de développement
- `environment.development.ts` : Configuration de développement (alternative)

Par défaut, l'API backend est configurée sur : http://localhost:8055

## 🎨 Technologies utilisées

- **Angular 18** : Framework principal
- **Tailwind CSS 4** : Framework CSS utility-first
- **RxJS** : Programmation réactive
- **TypeScript** : Langage typé

## 🔑 Fonctionnalités

- 🔐 Authentification via GitHub OAuth
- 📝 Création et édition de mèmes
- 🔍 Recherche de mèmes (via Meilisearch)
- 💾 Sauvegarde de mèmes favoris
- 🔔 Notifications en temps réel
- 👤 Gestion du profil utilisateur

## 🛠️ Scripts disponibles

- `npm start` : Démarre le serveur de développement
- `npm run build` : Build de développement
- `npm run build:prod` : Build de production optimisé
- `npm run watch` : Build en mode watch (reconstruction automatique)
- `npm test` : Lance les tests unitaires

## 📝 Notes

- Le frontend nécessite que le backend soit démarré sur http://localhost:8055
- L'authentification GitHub nécessite une configuration OAuth valide
- Les styles sont gérés avec Tailwind CSS 4
