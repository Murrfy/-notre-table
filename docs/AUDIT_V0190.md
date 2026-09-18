# Audit V0.190

## Objet
Raccorder les impressions sponsorisées à une frontière de visibilité réelle.

## Invariants
- aucun comptage au chargement provider ;
- interaction réelle exigée avant impression de carrousel ;
- ouverture explicite = visibilité explicite ;
- déduplication conservatrice par session d’écran ;
- télémétrie produit toujours soumise au consentement analytics ;
- aucun changement du classement organique.

## Validation
Validation locale : **256/256 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **918 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **368 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.
