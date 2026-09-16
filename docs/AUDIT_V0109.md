# Audit V0.109 — refus RLS silencieux et garde Premium

## Objet
Durcissement P1 sans nouvelle fonction produit.

## Garanties ajoutées
- `can_write_household(uuid)` fait partie du contrat RPC client.
- Un UPDATE/DELETE direct qui retourne zéro ligne vérifie la règle serveur avant de conclure au succès.
- Les refus `FAMILY_PLAN_REQUIRED` deviennent actionnables dans les écrans collaboratifs.
- Le smoke réel doit exécuter le garde RPC.

## Validation locale
- 18 tables client / 10 RPC / 6 Realtime.
- 92/92 tests de régression.
- 16/16 tests gate EAS.
- 79 TS/TSX transpilés, 0 erreur.
- backend audit + release audit : PASS.

## Non prouvé
Supabase distant, RevenueCat/Stores réels, npm installé/lockfile, vrai `tsc`, exports Expo, build EAS et test multi-appareils.
