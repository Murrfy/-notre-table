# Audit V0.159 — découverte LIA plafonnée avant abonnement

## Objectif
Permettre à LIA de convaincre un nouvel utilisateur sans transformer les téléchargements non convertis en facture IA incontrôlée.

## Politique produit
- Avant authentification : présentation LIA locale/scriptée, donc aucun appel IA payant requis.
- Après authentification, avant abonnement : découverte cloud autorisée avec plafond interne à vie de **0,05 USD par compte**.
- À **0,035 USD**, le routage passe en mode économie.
- À **0,05 USD**, les appels cloud gratuits s’arrêtent ; l’app et les aides locales restent utilisables.
- Après abonnement : le foyer quitte totalement ce plafond de découverte et repasse sous la politique normale de coût LIA par foyer.

## Enforcement serveur
- Migration `202609160014_lia_discovery_budget.sql`.
- Tables service-only `lia_discovery_usage` et `lia_discovery_charges`.
- RPC `reserve_lia_discovery_budget(uuid,uuid,bigint)` exécutable uniquement par `service_role`.
- Verrou `FOR UPDATE` pour sérialiser les réservations concurrentes.
- `request_id` unique + replay idempotent pour empêcher une double consommation lors d’un retry réseau.
- Le client mobile ne possède aucun droit de lecture/écriture directe sur ces compteurs.
- Le futur endpoint fournisseur LIA devra réserver le coût dans ce garde serveur avant de déclencher l’appel payant ; cette version n’affirme pas qu’un fournisseur IA cloud est déjà connecté.

## Risque maximal d’acquisition
Avec le plafond de 0,05 USD, **90 000 comptes non abonnés** ne peuvent représenter que **4 500 USD** de budget IA de découverte si chacun atteint le plafond complet. Les écrans locaux pré-auth n’entrent pas dans ce montant.

## Limite anti-abus
Un plafond par compte ne suffit pas à empêcher un attaquant de créer de nombreux comptes. Le futur endpoint IA devra ajouter rate limiting et détection d’abus. V0.159 n’affirme pas résoudre l’identité multi-comptes.

## Validation
- Vérification complète : audits continuité/hygiène/backend/release PASS.
- 17/17 gates EAS PASS.
- 91 fichiers TypeScript/TSX transpilés sans diagnostic.
- 716 clés EN avec parité des langues actives.
- 180/180 régressions PASS.
- Hygiène source : 282 fichiers inspectés.
- Limite maintenue : `node_modules` absent ; aucun vrai `tsc` installé ni export Expo iOS/Android n’est revendiqué dans cet environnement.
