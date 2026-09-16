# Audit V0.142 — chargements autonomes accessibles

## Portée
Durcissement d’accessibilité uniquement. Aucun changement produit, backend ou visuel.

## Invariants
- 14 loaders autonomes utilisent `accessibilityRole="progressbar"`.
- Chaque loader autonome utilise le libellé localisé `common.loading`.
- Les spinners inclus dans des boutons `busy` restent enfants du bouton sans rôle séparé.

## Validation
- `npm run verify` : PASS
- Régressions : 152/152
- Gates EAS : 17/17
- TypeScript/TSX transpiled : 82, 0 diagnostic
- Clés EN : 629 avec parité locale
- Audits continuité / hygiène / backend / release : PASS
- Aucun build installé/distant n’est revendiqué.
