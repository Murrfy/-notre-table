# Audit V0.171

## Périmètre
- Favoris restaurants dans Commander.
- Séparation stricte Favoris / Mémos.
- Stockage local démo + persistance Supabase privée.

## Garde-fous
- RLS propriétaire sur `commander_favorites`.
- Aucun favori ne crée automatiquement un Mémo.
- Aucun provider, restaurant ou lien de commande n'est inventé.
- Mutation favorite single-flight et états accessibles `selected/disabled/busy`.

## Validation
- `npm run verify` : PASS attendu après alignement du checkpoint.
- **206/206 régressions**, **17/17 gates EAS**, **108 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 019**.
- Build installé, Supabase distant et appareils physiques non revendiqués.
