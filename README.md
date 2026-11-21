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

Le socle des composants partages utilise shadcn-vue, Reka UI et Tailwind 4.
Les composants sont ajoutes au besoin et leur code reste dans le depot.
Voir [les conventions UI](docs/design-system.md).

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

Le serveur n'est accessible que depuis ton ordinateur. Pour tester sur un
téléphone branché au même Wi-Fi, lancer `npm run dev:lan` : le serveur devient
alors visible par tout le réseau local. À éviter sur un réseau public (école,
café), et à arrêter une fois l'essai fini.

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

Tout build (`npm run build`, quel que soit le mode) refuse de compiler si
`VITE_API_URL` manque ou n'est pas en `https`. Seuls `http://localhost` et
`http://127.0.0.1` sont acceptés, pour tester avec l'API locale.

Le texte des [CGU de démonstration](src/domains/auth/content/cgu-test-v1.json)
est séparé du formulaire et porte la version `cgu-test-v1`. Configurer la même valeur dans `REGISTRATION_TERMS_VERSION` sur
l’API de test. Pour un build de démonstration, définir aussi
`VITE_REGISTRATION_TERMS_VERSION=cgu-test-v1` avant compilation. Utiliser des
données fictives pour ce parcours de démonstration.

Ne jamais commiter de secret. Seules les valeurs non sensibles doivent apparaitre
dans `.env.example`.

## Structure

```txt
src/
  domains/auth/                 Parcours, API et modèles d’authentification
  shared/api/                   Client HTTP commun
  shared/components/            Composants Vue partagés
    stories/                    Exemples Storybook de ces composants
  shared/models/types/          Types utilisés par plusieurs composants
  router/                       Routes Vue Router
  assets/                       Styles, polices et images
  tests/                        Préparation et suites Vitest
    domains/auth/               Suites des vues et du store
    shared/components/          Tests de comportement des composants
    storybook/components/       Tests des exemples Storybook
  HomeView.vue
  App.vue
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

## Tests et modèles

Pour tester une fonctionnalité, reprendre son chemin sous `src/tests/`. Par exemple,
`domains/auth/stores/authStore.ts` a sa suite dans `tests/domains/auth/stores/authStore.spec.ts`.
Pour un composant partagé, ranger sa story dans `shared/components/stories/` et les tests
de cette story dans `tests/storybook/components/`. Les tests de son comportement restent
dans `tests/shared/components/`. Tous ces chemins partent de `src/`.

Un DTO décrit les données envoyées ou reçues par l’API, comme `LoginInputDto`.
Valider le JSON reçu avant de l’utiliser. Un type décrit une donnée manipulée dans
l’application, comme l’état de session. Un enum fournit des valeurs nommées utilisées
dans le code, comme les rôles proposés à l’inscription. Réutiliser les modèles existants
et garder un type propre à un seul composant près de ses props.

## Appels API

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

Le store Pinia d'authentification partage la session entre les ecrans. Marquer
une route privee avec `meta.requiresAuth` pour que le routeur verifie la session
avant d'afficher la page. Au redemarrage, l'API `/api/auth/me` confirme la session
avant tout acces prive.

Seul le jeton de session est conserve sur l'appareil. Android utilise le
Keystore et iOS le trousseau local, via
[le plugin Capacitor Secure Storage](https://github.com/aparajita/capacitor-secure-storage/blob/v7.1.3/README.md).
Executer `npm run cap:sync` apres installation. Dans le navigateur (Vite en
developpement comme build web de recette), le jeton est conserve dans
`sessionStorage` : il survit au rechargement de l'onglet et disparait a sa
fermeture. Jamais dans `localStorage`.

## Hooks Git

Le pre-commit Husky lance lint-staged sur les fichiers modifies :

- ESLint avec correction automatique sur les fichiers JavaScript, TypeScript et Vue
- Prettier sur les fichiers JSON, Markdown et CSS

Les tests et builds complets restent executes manuellement et dans la CI pour
garder les commits rapides.
