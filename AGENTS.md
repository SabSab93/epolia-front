# Epolia Front

- Avant d’ajouter un fichier, suivre le [classement des tests et des modèles](README.md#tests-et-modèles). Les suites Vitest vont dans `src/tests/` et les stories des composants partagés dans `src/shared/components/stories/`.
- Pour un contrat d’API, un type de domaine ou un enum, consulter d’abord les modèles du domaine dans `src/domains/<domaine>/models/`. Réutiliser le contrat existant et contrôler les données reçues de l’API.
- Utiliser les imports internes `@/`, y compris dans les tests. Pour les composants Vue, consulter les [conventions UI](docs/design-system.md).
- Pour les modèles TypeScript du frontend, préfixer les interfaces par `I` et suffixer les interfaces d’échange API par `Dto` (exemple `IEducationDto`). Suffixer les alias de type par `Types` (`SchoolAddressOptionTypes`) et les enums par `Enum` (`AccountRoleEnum`). Conserver les noms imposés par les bibliothèques et les valeurs échangées avec le backend.
