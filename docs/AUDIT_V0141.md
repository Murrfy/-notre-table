# Audit V0.141 — saisie robuste des identifiants sensibles

## Portée
Durcissement de saisie uniquement. Aucun changement produit, backend ou visuel.

## Invariants
- E-mail : pas d’autocorrection ni capitalisation automatique.
- Mots de passe : pas d’autocorrection ni capitalisation automatique.
- Code foyer : normalisation explicite en majuscules, pas d’autocorrection.
- Les hints `autoComplete` V0.134 restent inchangés.

## Validation
- `npm run verify` : PASS
- Régressions : 151/151
- Gates EAS : 17/17
- TypeScript/TSX transpiled : 82, 0 diagnostic
- Clés EN : 628 avec parité locale
- Audits continuité / hygiène / backend / release : PASS
- Aucun build installé/distant n’est revendiqué.
