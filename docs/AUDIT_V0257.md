# Audit V0.257

Checkpoint: **0.257.0**

## Portée
- quota **30 trajets/mois/foyer** pour `En route avec LIA` ;
- compteur de production partagé côté Supabase, jamais par appareil uniquement ;
- incrément atomique par RPC `reserve_lia_navigation_trip` ;
- appartenance foyer + accès Family vérifiés côté backend ;
- aucune écriture directe du client sur le compteur ;
- aucun trajet consommé si le moteur réel de navigation n’est pas disponible ;
- avertissements LIA discrets uniquement à 5, 2, 1 puis épuisement.

## Limites volontairement conservées
- Google Navigation SDK n’est pas encore lié au build iOS ;
- aucune route ou ETA n’est simulée ;
- la facturation Google/API key ne doit être activée qu’au moment du premier build utilisant réellement le moteur.

## Validation
**587/587 régressions PASS**, **17/17 gates EAS PASS**, audits principaux PASS et **199 TS/TSX** transpilés sans diagnostic par l’audit projet.
