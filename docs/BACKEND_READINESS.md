# Backend readiness — V0.55

Cette étape ne rajoute aucune fonction produit. Elle prépare le passage du mode démo au backend réel sans improvisation.

## Ce qui est verrouillé

- Les seules informations Supabase autorisées côté mobile sont le Project URL et la **publishable key**.
- Une clé privilégiée (`service_role`, `sb_secret_*`) est refusée par la configuration runtime et ne doit jamais entrer dans une variable `EXPO_PUBLIC_*`.
- Une configuration partielle, factice ou avec URL non HTTPS laisse l'application en mode backend non configuré au lieu d'essayer des requêtes ambiguës.
- Chaque table utilisée directement par le client doit exister dans `schema.sql`, avoir RLS activé et avoir au moins une policy.
- Chaque RPC utilisé par le client doit exister, révoquer l'exécution par défaut/Public et accorder explicitement `EXECUTE` à `authenticated`.
- Chaque table écoutée en Realtime par l'app doit être ajoutée à `supabase_realtime`.
- Le bucket `profile-avatars` reste privé et protégé par policies.

## Migrations

`supabase/migrations/202609140001_initial_schema.sql` est le point de départ versionné pour un nouveau backend vierge. À partir de V0.55, toute modification SQL future doit être ajoutée comme **nouvelle migration**, puis reflétée dans `supabase/schema.sql` comme snapshot courant. On ne réécrit pas silencieusement une migration déjà destinée à être appliquée.

## Vérifications

`npm run backend:audit` vérifie statiquement le contrat entre le code mobile et le schéma SQL.

Après déploiement réel, `supabase/verify_backend.sql` fournit le diagnostic détaillé. Exécuter ensuite `supabase/assert_backend.sql` : ce script ne modifie aucune donnée applicative mais lève une exception au premier invariant distant violé et termine par `NOTRE_TABLE_BACKEND_ASSERTIONS_PASS` uniquement si RLS, Realtime, Storage, signatures/ACL RPC et historique de migrations sont conformes.

## Ce qui n'est pas revendiqué

Aucune migration n'a encore été exécutée sur un projet Supabase réel et aucune policy n'a encore été testée avec deux comptes authentifiés réels. Ce contrôle devra être fait avant de considérer le backend comme validé en production.

## V0.113 — preuve Edge membre léger

Avant de considérer le smoke backend réel comme PASS, `light-response` doit être déployée depuis `supabase/functions/light-response` avec la configuration versionnée `verify_jwt=false`. Le smoke ne se contente plus d'appeler les RPC privilégiés : il charge réellement la page publique, vérifie ses en-têtes anti-cache/referrer/frame, passe par l'endpoint HTTP pour le contexte et la réponse, vérifie l'anti-rejeu et provoque une course réelle de prise en charge. Le verdict attendu couvre désormais **15/15 RPC client**.
