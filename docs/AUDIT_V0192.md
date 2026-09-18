# Audit V0.192

## Objet
Empêcher une panne publicitaire de rendre Commander indisponible.

## Invariants
- organique et sponsorisé attendus séparément ;
- panne sponsorisée => aucune carte sponsorisée ;
- panne organique => erreur Commander honnête ;
- aucun fallback inventé ;
- classement naturel inchangé.

## Validation
Validation locale : **259/259 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **922 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **370 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.
