# AUDIT V0.122 — statut de permission notifications iOS

Aucun changement produit. Ce checkpoint rend le flux de rappels locaux conforme au modèle de permission iOS exposé par Expo.

- Android conserve le booléen `permission.granted`.
- iOS lit `NotificationPermissionsStatus.ios.status`.
- Les statuts `AUTHORIZED`, `PROVISIONAL` et `EPHEMERAL` permettent la programmation locale.
- Les autres statuts déclenchent une demande de permission puis, si nécessaire, le verdict `permission-denied`.

## Validation locale
- 132/132 régressions.
- 17/17 gates EAS.
- 82 TS/TSX transpilés sans erreur.
- Audits continuité, hygiène source, backend et release : PASS.
