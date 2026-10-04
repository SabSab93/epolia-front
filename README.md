# Epolia Front

Application mobile frontend d'Epolia, marketplace mettant en relation des particuliers
avec des etudiantes, etudiants, apprenties et apprentis proposant des services.

Ce repository contient uniquement le socle frontend mobile. Le backend et la
documentation vivent dans des repositories separes.

## Stack

- Vue 3, TypeScript et Vite
- Composition API avec `<script setup>`
- Vue Router
- Pinia
- Tailwind CSS
- Capacitor pour Android et iOS
- Storybook
- Vitest
- ESLint, Prettier, Husky et lint-staged

Aucune bibliotheque UI complete n'est installee a ce stade. Ce choix reste a
arbitrer par l'equipe apres inventaire et comparaison.

## Prerequis

- Node.js LTS 22.22.2 ou plus recent
- npm
- Android Studio pour ouvrir le projet Android
- Xcode et CocoaPods pour generer puis ouvrir le projet iOS

## Installation

```sh
npm install
```

Copier les variables d'environnement d'exemple si necessaire :

```sh
cp .env.example .env
```

## Developpement

```sh
npm run dev
```

## Qualite

```sh
npm run typecheck
npm run lint
npm run format
npm run test
```

## Build

```sh
npm run build
```

## Storybook

```sh
npm run storybook
npm run build-storybook
```

## Capacitor

Le build Vite produit les fichiers web dans `dist`, utilise ensuite par
Capacitor.

```sh
npm run cap:sync
npm run cap:open:android
npm run cap:open:ios
```

Le projet Android est initialise dans `android/`. La generation du projet iOS
necessite CocoaPods disponible localement, puis :

```sh
npx cap add ios
```

Les plugins natifs seront ajoutes uniquement au moment des features qui en ont
besoin.

## Variables d'environnement

| Variable       | Description                 | Exemple                 |
| -------------- | --------------------------- | ----------------------- |
| `VITE_API_URL` | URL de base de l'API Epolia | `http://localhost:3000` |

Ne jamais commiter de secret. Seules les valeurs non sensibles doivent apparaitre
dans `.env.example`.

## Structure

```txt
src/
  assets/        Styles globaux minimaux
  components/    Composants reutilisables strictement necessaires
  router/        Routes Vue Router
  services/      Services techniques, dont la base API
  stores/        Stores Pinia
  tests/         Setup de tests
  views/         Ecrans routes
```

## Hooks Git

Le pre-commit Husky lance lint-staged sur les fichiers modifies :

- ESLint avec correction automatique sur les fichiers JavaScript, TypeScript et Vue
- Prettier sur les fichiers JSON, Markdown et CSS

Les tests et builds complets restent executes manuellement et dans la CI pour
garder les commits rapides.
