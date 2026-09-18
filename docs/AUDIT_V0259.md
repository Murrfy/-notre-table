# Audit V0.259

Checkpoint **0.259.0**.

- Vue native Expo enregistrée dans le module iOS `LiaNavigation`.
- `GMSMapView` n'est instancié que si `GoogleMaps` et `GoogleNavigation` sont réellement importables.
- Aucun faux itinéraire ni fallback cartographique web.
- Événements explicites `onReady` / `onUnavailable`.
- Le guidage `setDestinations` reste hors de ce checkpoint et sera branché après résolution réelle de destination.

## Validation finale locale

- Régressions : **593/593 PASS**.
- Gates EAS : **17/17 PASS**.
- Audits continuité/hygiène/backend/release/acceptation/projet : **PASS**.
- Audit projet : **200 TS/TSX**, 0 diagnostic.
- Build iPhone physique encore requis pour prouver le rendu Google réel.
