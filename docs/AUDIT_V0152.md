# Audit V0.152 — recettes et présence single-flight

## Constat
Les derniers effets de bord importants encore protégés uniquement par l’état React se trouvaient dans les imports/mutations de recettes et la bascule de présence.

## Correction
- Import URL : `importInFlight`.
- Import photo : `photoImportInFlight`.
- Favoris : Set `favoriteInFlight` par recette.
- Ajout recette aux courses : `shoppingInFlight`.
- Création de recette : `saveInFlight`.
- Présence : `toggleInFlightRef`, en conservant le `busyKey` existant pour l’UI/accessibilité.
- Aucun changement produit, backend, navigation ou rendu visuel.

## Validation
- 164/164 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Hygiène source : 264 fichiers inspectés.
- Audits continuité, hygiène source, backend et release : PASS.
