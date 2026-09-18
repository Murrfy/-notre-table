# Audit V0.175

## Périmètre
- Fiche restaurant enrichie sur données provider vérifiées.
- Téléphone / appel facultatif.
- ETA min-max, frais et minimum de commande.
- Devise obligatoire avant affichage de montants commerciaux.
- Image facultative sans activation d'une nouvelle source photo Google.
- Conservation du contexte Commander au retour de la fiche.

## Garde-fous
- `orderUrl` absent => aucun bouton de commande externe.
- `phone` absent => aucun bouton d'appel.
- `currencyCode` absent => aucun frais/minimum formaté.
- Aucun provider live nouveau n'est activé par ce checkpoint.
- Les règles de livraison, sponsorisés, Favoris et Mémos restent inchangées.

## Validation
- Validation locale : **221/221 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **905 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **337 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.
- Aucun provider de livraison/commande réel supplémentaire, build Expo installé ou appareil physique n’est revendiqué.
