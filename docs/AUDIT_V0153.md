# Audit V0.153 — réactions recettes single-flight

## Constat
La carte de réaction recette utilisait seulement l’état React `busy`. Deux taps quasi simultanés pouvaient franchir le garde avant le rerender et envoyer deux mutations.

## Correction
- Ajout d’un verrou synchrone `tasteInFlight`.
- Garde `if(busy||tasteInFlight.current)return;`.
- Verrou pris avant tout `await` et relâché dans `finally`.
- Aucun changement produit, backend, navigation ou rendu visuel.

## Validation
- 164/164 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Hygiène source : 265 fichiers inspectés.
- Audits continuité, hygiène source, backend et release : PASS.
