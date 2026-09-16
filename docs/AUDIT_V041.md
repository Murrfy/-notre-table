# Audit V0.41 — Qui fait les courses ?

## Intention produit
Réduire le flou familial autour de la liste sans demander de prévoir la semaine à l’avance : un membre se propose seulement quand c’est décidé.

## Garde-fous
- aucune assignation automatique ;
- pas de classement ni score de charge ;
- responsabilité limitée à la semaine de la liste ;
- RLS foyer sur `shopping_responsibilities` ;
- cible d’assignation obligatoirement membre du même foyer ;
- mode démo persistant localement ;
- temps réel prévu quand Supabase sera branché.

## Validation
Exécuter `npm run verify`. Le build Expo natif complet reste séparé et ne doit pas être revendiqué tant que les dépendances ne sont pas réellement installées et compilées.
