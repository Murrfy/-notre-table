# Audit V0.170

## Périmètre
- Éditeur d’adresse actif dans Commander.
- Surcharge de session uniquement ; aucune écriture foyer.

## Garde-fous
- Adresse vide non applicable.
- Éditeur accessible et état expanded exposé.
- Rechargement provider sur changement d’adresse.
- Rayon 10 km inchangé.

## Validation
- `npm run verify` : PASS.
- **204/204 régressions**, **17/17 gates EAS**, **107 TS/TSX** sans erreur de transpilation, **892 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **326 fichiers** ; backend **21 tables client / 17 RPC / 7 Realtime**, migrations **001 → 018**. Le build installé, Supabase distant et les appareils physiques ne sont pas revendiqués.
