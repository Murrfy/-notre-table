# Audit V0.139 — états busy accessibles

## Portée
Durcissement d’accessibilité uniquement. Aucun changement produit, backend ou visuel.

## Invariant ajouté
- Les commandes qui restent visibles pendant un traitement asynchrone exposent `accessibilityState.busy`.
- Le contrat courant couvre exactement 10 commandes classifiées.
- `busy` décrit uniquement la tâche propre au contrôle ; il ne remplace pas `disabled`, `selected` ou `checked`.

## Validation
- `npm run verify` : PASS
- Régressions : 149/149
- Gates EAS : 17/17
- TypeScript/TSX transpiled : 82, 0 diagnostic
- Clés EN : 628 avec parité locale
- Audits continuité / hygiène / backend / release : PASS
- Aucun build installé/distant n’est revendiqué.
