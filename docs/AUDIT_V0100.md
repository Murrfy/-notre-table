# Audit V0.100 — cycle d'identité RevenueCat aux call-sites

## Risque traité
Un adaptateur pouvait contenir les bons appels SDK sans que les changements de session, la suppression de compte ou les paywalls ne l'utilisent réellement. Ce faux positif aurait pu autoriser une build Production avec un entitlement associé au mauvais compte ou un paywall non alimenté.

## Gate fail-closed
La build Production exige désormais :
- `syncRevenueCatUser` réellement appelé depuis le cycle de session Supabase ;
- `clearRevenueCatIdentityAfterDeletion` réellement appelé par le chemin de suppression ;
- CustomerInfo RevenueCat comme source de l'état d'accès ;
- Offering Store localisée transmise aux paywalls planning, recettes et foyer.

Aucun de ces chemins n'est simulé dans la build actuelle : l'absence du vrai SDK maintient Production bloquée, ce qui est le comportement voulu.
