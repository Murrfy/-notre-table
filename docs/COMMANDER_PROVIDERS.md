# Commander providers — V0.176

## Sources organiques multiples
`CommanderPlaceProvider` peut maintenant être configuré seul (compatibilité historique) ou comme liste de providers.

- chaque source reçoit la même adresse active et le même rayon borné à **10 km** ;
- `Promise.allSettled` permet à une source disponible de continuer si une autre tombe ;
- si toutes les sources échouent, l'erreur remonte au lieu de produire de faux résultats ;
- les lignes `sponsored=true` restent exclues de ce chemin organique.

## Dédoublonnage prudent
Les doublons sont fusionnés uniquement sur identités fortes :
- `source + id` ;
- même téléphone normalisé ;
- même nom normalisé + même adresse normalisée.

La première source reste la fiche canonique. Une source secondaire peut compléter des champs descriptifs manquants, catégories et chemins de commande, mais ne remplace pas silencieusement la vérité de livraison du premier résultat.

## Providers de livraison multiples
`CommanderDeliveryProvider` conserve l'API historique et accepte aussi une liste ordonnée de providers.

- seuls les restaurants encore `delivery=unknown` sont envoyés au provider suivant ;
- `confirmed` et `unavailable` sont des décisions explicites et ne sont pas réinterprétées par une source suivante ;
- une panne d'un provider passe au suivant ;
- aucun provider de livraison ne peut créer un établissement absent du catalogue.

## Chemins de commande
Une fiche peut conserver plusieurs `CommanderOrderPath` vérifiés :
- officiel ;
- plateforme ;
- téléphone.

La fonction de sélection respecte la règle décidée : préférence utilisateur connue, sinon officiel, puis plateforme, puis téléphone.

## Sponsorisé
`CommanderSponsoredProvider` reste une frontière commerciale totalement séparée. Aucun sponsor n'entre dans le classement naturel.

## État
V0.176 n'active aucune nouvelle source réelle. Google Places reste opt-in côté serveur ; aucun provider de livraison ou commercial n'est configuré par défaut.
