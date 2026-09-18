# Audit V0.189

## Objet
Éviter les répétitions immédiates lorsque LIA reçoit « autre chose » dans Commander.

## Invariants
- mémoire uniquement en session ;
- aucune écriture profil/Mémo/analytics ;
- recherche uniquement dans le carrousel actif ;
- aucun recalcul du classement ;
- si tout a déjà été vu, cycle normal autorisé.

## Validation
Validation locale : **255/255 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **918 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **367 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.
