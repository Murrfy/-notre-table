# Audit V0.138 — Switch notifications accessible

## Portée
Durcissement d’accessibilité uniquement. Aucun changement produit, visuel, backend ou de règle métier.

## Invariant ajouté
- Le seul `Switch` runtime est celui des réglages de notifications.
- Il expose `accessibilityLabel={title}` et `accessibilityHint={subtitle}`.
- Il conserve sa sémantique native : aucun `accessibilityRole="button"` n’est ajouté au `Switch`.

## Validation
- `npm run verify` : PASS
- Régressions : 148/148
- Gates EAS : 17/17
- TypeScript/TSX transpiled : 82, 0 diagnostic
- Clés EN : 628 avec parité locale
- Audits continuité / hygiène / backend / release : PASS
- Limite inchangée : aucune preuve de build installé, Supabase distant ou EAS distant n’est revendiquée dans cet environnement.
