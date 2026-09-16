# Audit V0.147 — sauvegarde notifications single-flight

## Constat
Le bouton Enregistrer restait actif pendant les appels asynchrones de sauvegarde et de programmation native. Deux taps rapides pouvaient donc lancer deux opérations concurrentes.

## Correction
- Verrou synchrone `saveInFlight`.
- État React `saving`.
- Bouton `disabled` et `accessibilityState={{disabled,busy}}` pendant l’opération.
- Déverrouillage garanti en `finally`.
- Libellé `notifications.saving` localisé en quatre langues.

## Validation
- 159/159 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Audits continuité, hygiène source, backend et release : PASS.
