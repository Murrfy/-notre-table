# Audit V0.74 — smoke Supabase 9/9 RPC + Storage RLS

Aucune nouvelle fonction métier. Renforcement P1 de la preuve backend réelle.

## Renforcement

- `backend:live-smoke` exécute désormais les **9 RPC réellement appelées par le client** ;
- il vérifie création recette, planning, copie de semaine, génération/ajout courses et placard en plus du parcours foyer/invitation ;
- le bucket privé `profile-avatars` est testé avec propriétaire autorisé, membre du même foyer autorisé en lecture et utilisateur extérieur refusé en lecture/écriture ;
- le nettoyage couvre aussi les objets Storage ;
- le smoke destructif refuse de démarrer sans `SUPABASE_SMOKE_TARGET=development|staging` et `SUPABASE_SMOKE_ALLOW_DESTRUCTIVE=1` ;
- `backend:audit` empêche désormais la régression de cette couverture.

La preuve distante reste à exécuter sur un projet Supabase de développement/staging autorisé.
