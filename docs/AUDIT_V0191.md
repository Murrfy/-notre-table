# Audit V0.191

## Objet
Rendre explicite la destination Commander lorsque « ici » et « maison » diffèrent.

## Invariants
- localisation précise déjà consentie ;
- aucune permission demandée par ce checkpoint ;
- aucun provider interrogé avant le choix ;
- refus/absence de localisation => fallback foyer ;
- aucune persistance silencieuse de l’adresse courante.

## Validation
Validation locale : **258/258 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **922 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **369 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.
