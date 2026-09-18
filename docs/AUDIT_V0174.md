# Audit V0.174

## Périmètre
- Distance restaurant calculée depuis la destination active.
- Champ `distanceKm` facultatif.
- Carrousel Commander <= 3 km.
- Distance affichée dans les surfaces restaurant.

## Garde-fous
- Aucun faux kilométrage si le provider ne fournit/calcul pas la distance.
- Seules les distances <= 3 km entrent dans le carrousel proche.
- Distance et livraison restent des concepts séparés.

## Validation
- Validation locale : **218/218 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **900 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **336 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.
- Aucun appel provider réel, déploiement Edge, build Expo installé ou appareil physique n’est revendiqué.
