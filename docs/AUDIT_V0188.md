# Audit V0.188

## Objet
LIA peut piloter le carrousel Commander que l’utilisateur a réellement activé.

## Invariants
- aucune modification du classement naturel ;
- rayon Commander maximal inchangé à 10 km ;
- aucune modification de la vérité livraison ;
- aucune modification des règles sponsorisées ;
- l’auto-défilement n’élit pas le carrousel actif ;
- une commande n’agit que sur des cartes déjà présentes dans le carrousel actif ;
- les commandes inconnues n’exécutent aucune action.

## Commandes couvertes
- suivant / précédent ;
- ouvre celui-là ;
- ordinal 1 à 8, dont « le troisième » ;
- autre chose ;
- variantes principales EN / ES / HE.

## Validation
Validation locale : **254/254 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **918 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **366 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.
