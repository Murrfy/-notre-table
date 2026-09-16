# Audit V0.47

Objectif : poursuivre le polissage sans élargir le périmètre fonctionnel.

- Aucun nouveau bloc métier.
- Ordre quotidien des repas centralisé dans `src/domain/meals.ts` et partagé par Planning/Présence.
- Focus du repas principal déterministe et couvert par tests de régression.
- Nouveau `MealGlyph` : pictogrammes React Native originaux, indépendants des emoji et sans bibliothèque externe.
- Nouveau `ScreenHeader` partagé par Recettes, Courses et Foyer pour une hiérarchie cohérente.
- Écran Présence allégé d’un encart explicatif redondant.
- Métadonnées quotidiennes localisées sans emoji de cuisinier/convives/portions.
- Placeholder de recette sans photo remplacé par une géométrie originale.
- Styles legacy inutilisés supprimés du Planning.
- Garde-fous d’audit ajoutés pour empêcher le retour des emoji de repas sur les surfaces principales et la divergence des en-têtes.
- Vérification attendue : 59 fichiers TS/TSX, 0 diagnostic de transpilation, 523 clés i18n alignées, 26/26 régressions, 0 nom concurrent runtime.
- Le build Expo natif complet n’est toujours pas revendiqué tant que les dépendances ne sont pas installables dans cet environnement.
