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
**Les WebView Android/iOS ne sont pas encore testées** : vérifier zones sûres,
clavier, focus, portails et lecteur d’écran, puis noter les plateformes vérifiées.
Un build réussi ne prouve ni l’accessibilité ni le fonctionnement natif.
