# Audit V0.140 — annonces accessibles des messages dynamiques

## Portée
Durcissement d’accessibilité uniquement. Aucun changement produit, backend ou visuel.

## Invariants
- 8 messages purement d’erreur utilisent le rôle `alert` et une live region `assertive`.
- 5 messages mixtes de succès/statut utilisent une live region `polite`.
- Les textes statiques ne deviennent pas des live regions.

## Validation
- `npm run verify` : PASS
- Régressions : 150/150
- Gates EAS : 17/17
- TypeScript/TSX transpiled : 82, 0 diagnostic
- Clés EN : 628 avec parité locale
- Audits continuité / hygiène / backend / release : PASS
- Aucun build installé/distant n’est revendiqué.
