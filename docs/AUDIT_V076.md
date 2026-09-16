# Audit V0.76 — vérification Supabase distante exécutable

Aucune nouvelle fonction métier. Correction P1 de l’outil de vérification backend.

## Problème corrigé

`verify_backend.sql` utilisait `has_function_privilege('public', ...)`. PostgreSQL traite `PUBLIC` comme un pseudo-rôle ACL, pas comme un rôle utilisateur ordinaire. Le contrôle pouvait donc échouer au moment même où il devait vérifier les RPC.

## Correction

- les privilèges PUBLIC sont maintenant lus via `aclexplode(...)` avec `grantee = 0` ;
- les privilèges `authenticated` restent contrôlés avec `has_function_privilege` ;
- le script vérifie aussi existence/RLS des tables, nombre de policies, Realtime, bucket avatar, policies Storage et historique des migrations 001–004 ;
- `backend:audit` bloque le retour de l’ancien contrôle incorrect.

Le script reste en lecture seule pour les données applicatives.
