# Audit V0.51 — 2026-09-14

## Portée
Version de simplification du parcours Courses. Aucun nouveau concept métier, aucune nouvelle table backend et aucune nouvelle dépendance.

## Changements vérifiés
- seuls les articles non cochés occupent la liste principale ;
- les articles cochés sont regroupés dans une section repliée par défaut ;
- les outils secondaires sont rendus après la liste active ;
- état spécifique lorsque tout est coché ;
- bouton d’ajout désactivé sur champ vide ;
- lignes de courses adaptées au RTL ;
- exports texte/PDF conservent la liste complète, y compris les articles cochés.

## Garde-fous ajoutés
`npm run audit` échoue désormais si :
- la section des articles cochés n’est plus repliée par défaut ;
- la liste principale ne filtre plus les articles cochés ;
- les outils secondaires repassent avant la liste active ;
- les adaptations RTL des lignes disparaissent.

## Validation locale
- 61 fichiers TypeScript/TSX transpilés ;
- 0 erreur de transpilation ;
- 535 clés de traduction anglaises avec parité FR/ES/HE ;
- 0 référence concurrente dans le runtime ;
- 0 avertissement heuristique de texte UI français codé en dur ;
- 26/26 tests de régression réussis.

## Limite de validation
Le build Expo natif complet n’est pas revendiqué : `node_modules` n’est pas installé dans ce runtime. Le backend Supabase reste également à migration-tester sur un projet réel avant publication.
