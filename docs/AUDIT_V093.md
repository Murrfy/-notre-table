# Audit V0.93 — suppression permanente de compte de bout en bout

## P0 traité
Le simple appel serveur `auth.admin.deleteUser()` pouvait être bloqué par les clés étrangères `created_by ... ON DELETE RESTRICT` et par la protection du dernier administrateur. Une conformité Store seulement « visuelle » aurait donc pu échouer en production.

## Correctifs
- migration additive `202609140008_account_deletion_integrity.sql` ;
- `households.created_by` devient nullable et `ON DELETE SET NULL` afin qu’un foyer partagé puisse survivre au départ de son créateur ;
- RPC `prepare_account_deletion(uuid)` réservée à `service_role` : elle supprime le contenu attribuable au compte, supprime un foyer solitaire, ou maintient un foyer partagé en promouvant déterministement un membre restant lorsque le compte supprimé est le dernier admin ;
- Edge Function `supabase/functions/delete-account/index.ts` : identité dérivée uniquement du bearer JWT, suppression de l’avatar privé, préparation SQL idempotente, puis suppression Auth permanente ;
- après succès serveur, le mobile efface uniquement la session locale du téléphone ;
- le smoke réel appelle la fonction Edge déployée et vérifie les scénarios foyer partagé et foyer solitaire.

## Limites
Aucun déploiement Supabase réel n’est revendiqué. La migration, la fonction Edge et le smoke doivent encore être exécutés sur un projet development/staging réel.

## Référence Store
Apple et Google demandent la suppression du compte et des données associées. Apple précise que cela inclut le contenu utilisateur partagé avec d’autres personnes, sauf obligation légale de conservation.
