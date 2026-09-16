# Audit V0.99 — identité RevenueCat et accès Production

## Risque traité
Le futur adaptateur RevenueCat pouvait satisfaire les anciens marqueurs du gate sans être réellement relié aux paywalls ni à l'état d'accès. En parallèle, `loadAccessState()` pouvait encore lire un ancien cache local en Production. Un état Preview `family` ne doit jamais devenir une preuve d'abonnement.

## Durcissement
- Production retourne `free / revenuecat` avant toute lecture du cache local ;
- le vrai CustomerInfo RevenueCat devra remplacer cet état ;
- le gate exige `Purchases.logIn` pour commuter entre UUID Supabase authentifiés ;
- le gate exige aussi `Purchases.logOut` pour le chemin spécifique de suppression définitive ;
- une build Production reste bloquée tant que l'état RevenueCat et les Offerings Store ne sont pas câblés de bout en bout jusqu'aux paywalls.

## Preuve encore externe
Le SDK `react-native-purchases` n'est pas installé dans cet environnement et aucun projet RevenueCat/Store réel n'est connecté. Aucun achat, restore ou entitlement réel n'est donc revendiqué.
