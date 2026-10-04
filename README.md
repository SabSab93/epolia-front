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

Les imports internes utilisent exclusivement `@/`, qui correspond a la racine
`src/`, meme entre fichiers du meme dossier. Exemple :
`import BaseButton from '@/shared/components/BaseButton.vue'`.
Cet alias est pris en charge par Vite, TypeScript, Vitest et Storybook.
ESLint interdit les imports relatifs dans `src/` et `.storybook/`.

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
  shared/
    api/
      apiClient.ts
      apiClient.spec.ts
    components/
      BaseButton.vue
      BaseButton.stories.ts
  router/        Routes Vue Router
  assets/        Styles globaux minimaux
  tests/         Setup de tests
  App.vue
  HomeView.vue    Ecran technique d'initialisation
  HomeView.spec.ts
  main.ts
```

## Architecture par domaine

Le code metier est organise dans `src/domains/<domain>/`. Les domaines suivent
les responsabilites fonctionnelles du backend : `auth`, `profile`, `student`,
`discovery`, `messaging`, `missions`, `payments` ou `reviews`, selon les besoins
reels. Aucun domaine ni sous-dossier vide n'est cree par anticipation.
L'ecran technique `HomeView.vue` reste a la racine avec le bootstrap ; les futurs
ecrans metier appartiendront aux `views/` de leur domaine.

Dans chaque domaine, creer uniquement les dossiers necessaires :

- `api/` : appels aux endpoints du domaine, via `@/shared/api/apiClient`.
- `components/` : composants Vue propres au domaine.
- `composables/` : logique Vue extraite lorsqu'elle isole une responsabilite
  significative ou permet une reutilisation.
- `models/dtos/` : contrats de donnees echanges avec l'API.
- `models/types/` et `models/enums/` : structures et valeurs propres au domaine,
  avec une seule source de verite par modele.
- `stores/` : etat Pinia reellement partage entre composants ou ecrans ; l'etat
  local reste dans le composant.
- `views/` : ecrans complets assemblant les composants du domaine.

`shared/` accueille uniquement le code transversal ou clairement destine a
plusieurs domaines. Les composants specifiques restent dans leur domaine.
Les stories et les tests sont places a cote du code concerne.

Le client `apiFetch(path, options)` centralise l'URL de base, `fetch`, les headers
et les erreurs HTTP. Il renvoie une `Response`, y compris pour les reponses sans
contenu, et conserve les options `RequestInit` (signal, body, credentials, etc.).
Il fournit `Accept: application/json` par defaut ; le domaine indique le
`Content-Type` adapte au body. Aucun endpoint metier ni logique de session n'est
ajoute au client. Les composants Vue ne font pas directement d'appels HTTP.

Exemple de flux pour une future fonctionnalite :

```txt
domains/auth/views/LoginView.vue
  -> domains/auth/components/LoginForm.vue
  -> domains/auth/composables/useLoginForm.ts
  -> domains/auth/api/useAuthApi.ts
  -> shared/api/apiClient.ts
  -> API REST epolia-back
```

Le composable pourra utiliser `domains/auth/stores/auth.store.ts` pour l'etat de
session partage. Cette convention ne necessite pas de couches supplementaires
de repositories, use-cases, adapters ou mappers sans besoin concret.

## Hooks Git

Le pre-commit Husky lance lint-staged sur les fichiers modifies :

- ESLint avec correction automatique sur les fichiers JavaScript, TypeScript et Vue
- Prettier sur les fichiers JSON, Markdown et CSS

Les tests et builds complets restent executes manuellement et dans la CI pour
garder les commits rapides.
