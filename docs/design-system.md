# Socle UI

Vue, shadcn-vue, Reka UI et Tailwind 4. Les composants restent dans le dépôt,
sans importer toute la collection. L’application et Storybook partagent
`src/assets/main.css` ; les imports internes utilisent `@/`.

## Accessibilité — indispensable

Pour chaque composant, vérifier :

- Contraste du texte courant ≥ 4,5:1 ; aucune information portée uniquement par la couleur.
- Zones tactiles ≥ 48 × 48 px CSS, appui perceptible et focus clavier visible.
- Navigation clavier et noms accessibles ; labels et erreurs associés aux champs.
- Texte agrandi à 200 %, libellés longs et réduction des animations.

Reka facilite l’accessibilité mais ne garantit pas celle du composant final.
Voir les [règles de design mobile et leurs sources](design-rules.md).

## Espacements

Une échelle commune dans `main.css` : `2xs` 4, `xs` 8, `sm` 12, `md` 16,
`lg` 24, `xl` 32 et `2xl` 48 px à la taille racine habituelle, définis en rem.
Utiliser `gap-epolia-xs`, `p-epolia-md`, `mr-epolia-sm`, etc. pour les gaps,
marges et paddings, y compris dans les stories et le code généré.

## Textes et fonds

Deux styles de texte : `text-epolia-body` (courant) et `text-epolia-body-small`
(secondaire). Les titres utilisent le composant partagé, avec quatre tailles,
une graisse et une largeur adaptées à chaque niveau. Les familles et tailles sont dans
`typography.css`, importé par `main.css` pour l’application et Storybook.
Pour les fonds : `bg-epolia-page` et `bg-epolia-surface` ; pour la couleur du
texte : `text-epolia-text` et `text-epolia-text-secondary`. Choisir les niveaux HTML
selon la hiérarchie du contenu.

Toutes les couleurs sont définies une seule fois dans `main.css`, sous
`--color-epolia-*` : `bg-epolia-primary` pour l’action principale,
`text-epolia-primary-text` pour son libellé, `border-epolia-border` pour les
bordures et `ring-epolia-focus` pour le focus. Les états utilisent les suffixes
`-hover` et `-active`. Aucun alias de couleur générique (`bg-primary`, etc.).

## Icônes

Les icônes sont celles du Figma : **Google Material Symbols** (style Outlined,
licence Apache 2.0). Elles passent par
[unplugin-icons](https://github.com/unplugin/unplugin-icons) (MIT) et les données
`@iconify-json/material-symbols`, deux dépendances de développement. Chaque icône
importée est compilée en composant Vue au build : rien n'est chargé au lancement
(pas de CDN ni de police distante), l'app fonctionne hors ligne, et seules les
icônes importées entrent dans le bundle.

```vue
<script setup lang="ts">
import IconArrowForward from '~icons/material-symbols/arrow-forward'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseIcon from '@/shared/components/BaseIcon.vue'
</script>

<template>
  <BaseButton label="Continuer">
    <template #icon-right><BaseIcon :icon="IconArrowForward" :size="20" /></template>
  </BaseButton>
</template>
```

- **Trouver le nom** : nom Figma avec `_` remplacé par `-`. Style « Contour » =
  suffixe `-outline` s'il existe (`favorite-outline`), « Plein » = nom seul
  (`favorite`). Liste : [Iconify, Material Symbols](https://icon-sets.iconify.design/material-symbols/).
- **Taille** : `:size="20"` dans un bouton, `24` (défaut) pour la navigation. En
  rem, l'icône suit le zoom du texte. La zone tactile reste celle du contrôle parent.
- **Couleur** : celle du texte (`currentColor`) ; la changer avec une classe de
  token, par exemple `class="text-epolia-primary"`.
- **Accessibilité** : sans `label`, l'icône est décorative et masquée aux lecteurs
  d'écran (cas d'une icône à côté d'un texte). Avec `label`, elle est annoncée
  comme une image. L'icône n'est jamais focusable. Une action sans texte devra
  porter son nom sur le bouton (pas de bouton icône seule pour l'instant).
- **BaseButton** : un seul slot à la fois, `icon-left` ou `icon-right` (le
  composant ne le vérifie pas). Pendant
  le chargement, le spinner prend la place de l'icône (à gauche sans icône).
- **SVG de marque** (logo, pictogramme absent de Material Symbols) : un composant
  Vue local contenant le `<svg>`, en `fill="currentColor"`, passé à `BaseIcon`.

**Comparaison (novembre 2026).** Même jeu de 6 icônes (retour, recherche, accueil,
favori, fermer, validé), mini-app Vite 7 + Vue 3.5, build de production, poids
gzip du JS comparé à la même app sans icône :

| Solution                          | Poids ajouté (gzip) | Requêtes ajoutées | Licence          | Cohérence avec le Figma              |
| --------------------------------- | ------------------- | ----------------- | ---------------- | ------------------------------------ |
| unplugin-icons + Material Symbols | 0,9 Ko              | 0                 | MIT / Apache 2.0 | Identique                            |
| SVG locaux copiés à la main       | 0,9 Ko              | 0                 | Apache 2.0       | Identique, mais maintenance manuelle |
| Lucide (`@lucide/vue`)            | 1,7 Ko              | 0                 | ISC              | Autre dessin                         |
| Font Awesome Free (SVG + Vue)     | 27 Ko               | 0                 | MIT / CC BY 4.0  | Autre dessin                         |

Pour reproduire : créer une app Vite + Vue vide, ajouter les six icônes avec
chaque solution, lancer `vite build` et comparer la taille gzip de
`dist/assets/*.js` à celle de l'app sans icône.

## Ajouter un composant

Installer avec `npm ci`, puis ajouter uniquement le composant nécessaire :

```sh
npx shadcn-vue@2.8.2 add input
```

Relire le code généré et le lockfile ; conserver les imports `@/`, les stories
et tests à côté du composant, sans doublon. Adapter ses classes de couleur aux
noms `epolia-` et ses espacements à notre échelle. Personnaliser les tokens plutôt
que disperser les couleurs. La palette reste provisoire, sans mode sombre validé.
Les fichiers Inter et Bricolage Grotesque sont embarqués localement. Répartition
proposée : Inter pour les textes, Bricolage Grotesque pour les titres.

## Vérifications

Exécuter lint, typecheck, tests et builds application/Storybook.
**Les WebView Android, iPhone et iPad ne sont pas encore testées** : vérifier
portrait/paysage, zones sûres, claviers tactile/externe, focus, portails et lecteur
d’écran. Sur iPad, vérifier aussi le redimensionnement en multitâche et le pointeur.
Noter les plateformes réellement vérifiées.
Un build réussi ne prouve ni l’accessibilité ni le fonctionnement natif.
