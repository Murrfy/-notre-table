# Audit V0.95 — suppression de compte + RevenueCat

## P0/P1 traité
Une suppression de compte conforme ne doit ni laisser les données du client chez le prestataire de billing, ni laisser penser que la suppression du compte arrête la facturation Store. RevenueCat précise que supprimer un client n'annule pas les abonnements Apple/Google ; Apple indique également que la facturation auto-renouvelable continue jusqu'à annulation par l'utilisateur.

## Correctifs
- avertissement abonnement visible avant la confirmation irréversible ;
- liens de gestion d'abonnement Apple/Google ;
- effacement RevenueCat server-side dans la fonction `delete-account` ;
- activation explicite par secret Edge `REVENUECAT_CUSTOMER_DELETION_ENABLED=true` ;
- clé `REVENUECAT_SECRET_API_KEY` uniquement côté serveur ;
- échec RevenueCat avant toute mutation locale destructive lorsque ce nettoyage est activé ;
- 200/404 acceptés comme suppression idempotente ;
- smoke distant optionnellement fail-closed avec `EXPECT_REVENUECAT_DELETION=true` ;
- release lane mise à jour avec le contrat App User ID = UUID Supabase Auth.

## Limites
Aucun projet RevenueCat réel n'est connecté et aucune suppression RevenueCat réelle n'est revendiquée. La preuve distante nécessite le projet Supabase déployé, la fonction Edge et les secrets RevenueCat réels.
