# Audit V0.49 — états vides et cohérence de marque

- Aucun ajout fonctionnel métier.
- `EmptyState` partagé sur Recettes, Courses, Placard et Activité.
- États vides conçus pour guider sans ajouter de bruit visuel.
- Recettes : distinction bibliothèque vide / aucun résultat de filtre.
- Nom produit invariant : **Notre Table** dans les quatre langues.
- Garde-fous d’audit ajoutés pour l’usage du composant commun et l’absence de traduction de la marque.
- Validation : `npm run audit` + `npm run regression`.
- Le build Expo natif complet reste distinct et non revendiqué tant que toutes les dépendances ne peuvent pas être installées dans l’environnement.
