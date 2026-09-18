# Audit V0.173

## Périmètre
- Contrat `CommanderDeliveryProvider`.
- Fusion par identifiant avec les résultats organiques existants.
- Suppression des restaurants confirmés non livrables.
- Enrichissement facultatif ETA/frais/minimum/order URL.

## Garde-fous
- Aucun provider de livraison n’est configuré par défaut.
- Le provider ne reçoit qu’une adresse active et un rayon déjà borné à 10 km.
- Il ne peut pas créer de restaurants : seules les lignes organiques existantes sont fusionnées.
- Une panne de vérification conserve l’état de découverte et ne fabrique jamais une confirmation.
- `unavailable` est filtré pour l’adresse active.

## Validation
- Validation locale : **215/215 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **335 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.
- Aucun appel de livraison réel ni test appareil n’est revendiqué.
