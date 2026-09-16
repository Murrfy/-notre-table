# Audit V0.148 — actions sensibles single-flight

## Constat
Les boutons d’achat, de restauration et de suppression de compte utilisaient déjà l’état React `busy`, mais deux taps extrêmement rapprochés pouvaient entrer avant le rerender.

## Correction
- Verrou synchrone `billingInFlight` pour achat, démarrage d’essai et restauration.
- Verrou synchrone `deleteInFlight` pour la suppression de compte.
- Les états `busy`/`disabled` existants restent inchangés pour l’interface et l’accessibilité.
- Déverrouillage garanti dans les `finally`.

## Validation
- 160/160 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Hygiène source : 260 fichiers inspectés.
- Audits continuité, hygiène source, backend et release : PASS.
- Aucun changement produit, backend, navigation ou tarification.
