# Socle UI

Le choix retenu est shadcn-vue / Reka UI / Tailwind 4, dans l'application Vue
existante. shadcn fournit du code de composants versionne dans le depot ; Reka
fournit les primitives d'interaction. Aucune collection complete n'est importee.

## Premiere etape de #10

- Vite utilise deja le plugin Tailwind et l'alias `@/` vers `src/`.
- Storybook importe deja `src/assets/main.css` ; ses styles restent partages
  avec l'application, sans second theme.
- `components.json` configure TypeScript, Tailwind 4 et les chemins existants.
- Reka UI est installe ; `class-variance-authority` servira aux variantes du
  composant temoin. `cn` combine les classes avec `clsx` et resout leurs conflits
  Tailwind avec `tailwind-merge`. `tw-animate-css` fournit les utilitaires
  d'animation attendus par les composants shadcn.
- Tailwind est declare directement dans les dependances de developpement,
  au meme niveau que son plugin Vite ; le lockfile fixe les versions installees.

Le `BaseButton` et sa story restent, a cette etape, les exemples d'initialisation.
La prochaine etape les remplacera par un composant temoin commun a l'application
et a Storybook, reutilisable dans #14. Aucun bouton produit n'est encore livre.
Les champs, formulaires et autres composants generiques relevent de #14.

## Ajouter et personnaliser un composant

Avec la version de Node indiquee dans `package.json`, installer avec `npm ci`.
Pour ajouter uniquement le composant necessaire, par exemple un champ :

```sh
npx shadcn-vue@2.8.2 add input
```

Relire le code genere, les dependances et le lockfile. Les primitives vont dans
`src/shared/components/ui/`, les stories et tests a cote du composant.
Utiliser uniquement des imports internes `@/`, y compris dans le code genere.
Ne pas ajouter un composant concurrent d'un composant deja utilise.

Personnaliser les tokens de `src/assets/main.css`, puis utiliser leurs classes
semantiques (`bg-primary`, `text-primary-foreground`, `border-input`, etc.).
La palette neutre est provisoire, la police Inter utilise un repli systeme ;
aucune charte definitive ni police distante n'est imposee. Les espacements
restent ceux de Tailwind et les rayons partagent `--radius`.

Verifier `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
et `npm run build-storybook` avant livraison.

## Verifications mobiles restantes

Aucun test WebView Android ni iOS n'est realise pour cette premiere etape.
Le projet Android existe ; le projet iOS n'est pas encore genere dans le depot.
Les builds web ne valident pas les zones sures, le clavier virtuel, le focus
natif ou les portails. Verifier ces points sur les plateformes disponibles lors
de l'integration des composants concernes et indiquer celles non testees.

References : [installation Vite](https://www.shadcn-vue.com/docs/installation/vite),
[configuration](https://www.shadcn-vue.com/docs/components-json),
[tokens](https://www.shadcn-vue.com/docs/theming), [Reka UI](https://reka-ui.com/).
