# Audit V0.258

Checkpoint **0.258.0**.

- Configuration Google Navigation iOS optionnelle et centralisée.
- Permission Always demandée uniquement par le flux navigation.
- `UIBackgroundModes` conserve audio et ajoute location.
- `NSLocationAlwaysAndWhenInUseUsageDescription` + `NSMotionUsageDescription` présents.
- Préflight Swift conditionnel `GoogleMaps`/`GoogleNavigation`.
- Conditions d’utilisation Google obligatoires avant état `ready`.
- Aucun faux guidage tant que le package Swift et la carte native ne sont pas reliés.

## Validation finale locale

- Régressions : **591/591 PASS**.
- EAS pre-install gates : **17/17 PASS**.
- Audits continuité, hygiène source, contrat backend, release, acceptation et projet : **PASS**.
- Audit projet : **200 fichiers TS/TSX transpilés, 0 diagnostic**.
- Limite non revendiquée : aucun build physique iPhone ni trajet Google réel tant que le package Swift, la clé API et la facturation ne sont pas effectivement reliés.
