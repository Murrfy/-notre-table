# Audit V0.94 — paywall Production fail-closed

## P1 traité
Le paywall conservait des prix business de référence (4,99 €/39,99 €) utiles en Preview. Même avec le gate RevenueCat, ces valeurs ne doivent jamais pouvoir être présentées comme prix Store en Production.

## Correctifs
- branche Production explicite dans `PaywallScreen` ;
- prix Production uniquement via packages Store localisés fournis par l'adaptateur RevenueCat ;
- aucun fallback vers les références EUR en Production ;
- CTA achat désactivé sans package Store réel ;
- restauration Production exposée uniquement avec l'adaptateur réel ;
- callback de trial local rendu optionnel dans `RecipesScreen` ;
- gate EAS renforcé : un simple fichier `revenuecat.ts` ne suffit plus, les primitives réelles configure/Offerings/purchase/restore/CustomerInfo/entitlement sont exigées ;
- tests statiques et gate ajoutés.

## Limite
Aucun achat réel n'est revendiqué : `react-native-purchases`, les produits Store, l'Offering et les clés réelles ne sont pas encore installés/configurés dans cet environnement.
