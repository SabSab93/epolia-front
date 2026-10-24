# Règles de design mobile Epolia

Référence de travail pour Vue / Tailwind / Capacitor, à ajuster avec la future
charte. Les valeurs ci-dessous sont des **conventions Epolia**, pas des règles
UX universelles. Les exigences d'accessibilité restent à vérifier sur les écrans.

## Espacement et lecture

Une seule échelle Epolia, définie en `rem` dans `src/assets/main.css` :

| Token        | Valeur   | Équivalent à 16 px de base |
| ------------ | -------- | -------------------------- |
| `epolia-2xs` | 0,25 rem | 4 px                       |
| `epolia-xs`  | 0,5 rem  | 8 px                       |
| `epolia-sm`  | 0,75 rem | 12 px                      |
| `epolia-md`  | 1 rem    | 16 px                      |
| `epolia-lg`  | 1,5 rem  | 24 px                      |
| `epolia-xl`  | 2 rem    | 32 px                      |
| `epolia-2xl` | 3 rem    | 48 px                      |

- Écran : `px-epolia-md` (16 px hors zones sûres).
- Carte / groupe : `p-epolia-md` ; éléments liés : `gap-epolia-xs`.
- Sections : `gap-epolia-lg` ou `gap-epolia-xl`.
- Actions voisines : `gap-epolia-xs` minimum ; empiler si le texte ne tient pas.
- Même échelle pour toutes les directions : `mr-epolia-sm`, `mt-epolia-2xs`,
  `py-epolia-sm`, `space-y-epolia-lg`, etc. Préférer `gap` entre enfants d'un
  conteneur flex/grid et les marges logiques `ms`/`me` quand elles sont adaptées.

Utiliser ces noms pour les espacements de l'application, des composants et des
stories, y compris après génération shadcn. Pas d'espacement numérique isolé ou
arbitraire ; `0` et `auto` restent valables. Modifier les tokens communs pour
ajuster l'échelle, sans créer des valeurs différentes pour gap/margin/padding.
Les bordures, rayons, typographies et dimensions tactiles restent distincts.

## Typographie et fonds

Deux styles suffisent pour les textes : `text-epolia-body` (16 px) et
`text-epolia-body-small` (14 px), en rem avec un interligne de 1,5.
Ajouter `font-semibold` uniquement pour une emphase utile ; aucun rôle séparé
« label » ou « caption ». Le petit texte ne sert pas à faire tenir une information importante.

Les titres passent par `BaseTitle` avec une seule prop : `level="h1/h2/h3/h4"`.
Le niveau choisit à la fois la balise HTML et sa taille (32/24/20/18 px).
La police Bricolage Grotesque et l'interligne 1,25 sont automatiques.
H1 : extra-gras (800), largeur normale ; H2 : gras (700), condensé (75 %) ;
H3 : semi-gras (600) ; H4 : medium (500), tous deux de largeur normale.
La condensation utilise l'axe de largeur de la police, jamais une transformation
CSS qui déforme le texte. Elle est réservée au titre H2 et non aux paragraphes.
Le texte est fourni dans le slot ; le niveau par défaut est `h2`.
Choisir le niveau selon la hiérarchie du contenu, pas pour obtenir une taille.
Les tailles restent centralisées dans `typography.css`.
Un header de page est une structure de mise en page, pas une autre typographie.

Utiliser `bg-epolia-page` pour l'écran, `bg-epolia-surface` pour une carte,
`text-epolia-text` pour le texte et `text-epolia-text-secondary` pour une information
secondaire. Les couleurs d'action utilisent aussi le préfixe `epolia-`, par
exemple `bg-epolia-primary` et `text-epolia-primary-text` pour son libellé.
Les valeurs et états sont centralisés dans `main.css` (`--color-epolia-*`),
sans alias de couleur générique ni valeur couleur dans les vues.
Adapter les classes du code généré par shadcn à ces noms.

Une colonne sur petit écran ; contenus et boutons peuvent grandir et revenir
à la ligne. Les polices sont chargées localement par `typography.css`, également
utilisé dans Storybook. Proposition actuelle : Inter pour les textes et Bricolage
Grotesque pour les titres HTML, avec `font-epolia-heading` si une famille de titre
est nécessaire ailleurs. Familles et tailles restent indépendantes. Les fichiers
WOFF2 incluent les sous-ensembles latin/latin étendu et utilisent `font-display: swap`.
Les licences originales accompagnent les fichiers, sans appel à un CDN.

## Actions et formulaires

- Zone tactile **au moins 48 × 48 px CSS** pour les contrôles de l'app ; une icône
  peut être plus petite dans cette zone. Ce choix mobile est plus généreux que
  le minimum WCAG 2.2 AA de 24 × 24 px CSS, qui comporte des exceptions.
  Apple recommande 44 × 44 pt et Android 48 × 48 dp : ces unités natives ne
  doivent pas être confondues avec les pixels CSS ou physiques.
- Une action principale par groupe. Libellé explicite : « Enregistrer » plutôt
  que « OK ». Un bouton déclenche une action ; un lien sert à naviguer.
- Un seul composant **`BaseButton`** : `default` rempli pour l'action principale,
  `secondary` avec contour pour l'alternative, `tertiary` sans contour pour
  l'action discrète. Le nom `outline` n'est pas une quatrième variante.
- Même taille tactile pour les trois variantes ; `type="button"` par défaut,
  `type="submit"` explicite pour envoyer un formulaire.
- États à prévoir : normal, appuyé, focus visible, désactivé, chargement.
  Le chargement conserve le libellé et bloque les doubles clics ; il ne remplace
  pas l'idempotence serveur. Respecter la réduction des animations.
- Label visible associé à chaque champ ; aide/erreur reliée avec
  `aria-describedby`, `aria-invalid` si nécessaire. Le placeholder ne sert pas de label.
  Choisir `autocomplete`, `inputmode` et le type de clavier adaptés.
- Garder les saisies après erreur ; expliquer comment corriger et annoncer le
  résultat. Ne pas utiliser uniquement une couleur pour transmettre un état.

## Couleurs et accessibilité

Texte courant : contraste **≥ 4,5:1**. Texte grand : **≥ 3:1** (24 px normal ou
environ 18,67 px gras). Les éléments visuels nécessaires pour identifier un
contrôle ou son état doivent atteindre 3:1 avec les couleurs adjacentes selon
WCAG 1.4.11. Les composants inactifs ont des exceptions ; les garder lisibles.

Ratios calculés en sRGB sur les aplats de la palette provisoire :

| Texte / fond                  | Ratio approximatif | Usage                                                                               |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| Blanc / vert `#5C6B25`        | 5,86:1             | Action principale et texte courant autorisés.                                       |
| Anthracite `#2A2A25` / blanc  | 14,42:1            | Texte courant.                                                                      |
| Anthracite / orange `#E37744` | 4,80:1             | Accent avec texte anthracite.                                                       |
| Blanc / orange                | 3,00:1 arrondi     | Ne pas utiliser pour le texte courant ; ne pas déduire une conformité d'un arrondi. |

Recalculer pour chaque fond réel et chaque état (opacité, hover, appui, erreur).
Tous les composants consomment les tokens de `main.css`, également chargés par
Storybook. Aucun mode sombre n'est validé.

## Mobile et vérification avant livraison

- Respecter les encoches et barres système avec les zones sûres
  `env(safe-area-inset-*)`, selon la configuration native. Éviter le double padding
  si le conteneur natif applique déjà ces marges ; le faire au niveau du layout.
- Autoriser le défilement quand le clavier s'ouvre ; le champ actif, son erreur
  et l'action doivent rester atteignables. Ne pas installer un plugin clavier
  sans besoin constaté ; vérifier le comportement réel de la WebView.
- Vérifier à 320, 375 et 430 px CSS de large, en paysage et avec texte agrandi à
  200 %. Ni contenu tronqué ni défilement horizontal pour les écrans courants.
- Parcours clavier : ordre logique, focus visible et non masqué par une barre
  fixe. Dialogues : nom accessible, focus géré et rendu au déclencheur à la fermeture.
- Storybook : trois variantes, désactivé, chargement, texte long, pleine largeur.
  Puis vérifier sur Android et iOS : toucher, clavier, zones sûres et lecteur
  d'écran. Toujours indiquer les plateformes non testées ; un build ne prouve
  pas l'accessibilité ni le fonctionnement natif.

## Sources

- [Tailwind 4 : tokens de thème et utilitaires](https://tailwindcss.com/docs/theme).

- [Material : grille de 8 et sous-grille de 4 (guide M2)](https://m2.material.io/design/layout/understanding-layout.html).
- [Android : zones tactiles et espacement](https://support.google.com/accessibility/android/answer/7101858?hl=en-GB) ; [Apple : boutons et hiérarchie](https://developer.apple.com/design/human-interface-guidelines/buttons).
- [WCAG : taille des cibles](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [contraste du texte](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [contraste hors texte](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [WCAG : redistribution du contenu](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [agrandissement du texte](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [focus non masqué](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- [MDN : zones sûres CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) ; [Capacitor : clavier](https://capacitorjs.com/docs/apis/keyboard).
