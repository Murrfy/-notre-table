# AUDIT V0.123 — permission iOS minimale pour les rappels

Aucun changement produit. Ce checkpoint réduit la demande de permission iOS aux capacités réellement utilisées par Notre Table.

- `allowAlert: true`.
- `allowSound: false`.
- `allowBadge: false`.
- Les statuts iOS granulaires V0.122 restent la source de vérité avant programmation.
- Android reste inchangé.

## Validation locale
- 133/133 régressions.
- 17/17 gates EAS.
- 82 TS/TSX transpilés sans erreur.
- Audits continuité, hygiène source, backend et release : PASS.
