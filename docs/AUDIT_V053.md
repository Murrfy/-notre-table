# Audit V0.53 — 2026-09-14

## Portée
Version de simplification de l’écran Foyer. Aucun nouveau concept métier, aucune nouvelle table backend et aucune nouvelle dépendance.

## Changements vérifiés
- la liste des membres reste centrée sur identité + rôle ;
- allergies, régimes et aliments détestés ne sont plus affichés en permanence dans la liste des membres ;
- Mon profil reste accessible en un geste depuis la carte Foyer ;
- rappels, langue, apparence et confidentialité sont regroupés sous Réglages, replié par défaut ;
- l’activité récente reste repliée par défaut ;
- le statut d’abonnement est présenté sous forme de ligne de compte compacte ;
- le message d’invitation hébreu conserve la marque Notre Table sans la traduire.

## Garde-fous ajoutés
`npm run audit` échoue désormais si :
- les réglages du Foyer ne sont plus repliés par défaut ;
- les préférences alimentaires détaillées reviennent dans la liste principale des membres ;
- le résumé des réglages disparaît ;
- le statut d’abonnement redevient une grande carte promotionnelle.

## Validation locale
- 61 fichiers TypeScript/TSX transpilés ;
- 0 erreur de transpilation ;
- 536 clés de traduction anglaises avec parité FR/ES/HE ;
- 0 référence concurrente dans le runtime ;
- 0 avertissement heuristique de texte UI français codé en dur ;
- 26/26 tests de régression réussis.

## Limite de validation
Le build Expo natif complet n’est pas revendiqué : `node_modules` n’est pas installé dans ce runtime. Le backend Supabase reste également à migration-tester sur un projet réel avant publication.
