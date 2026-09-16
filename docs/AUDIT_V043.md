# Audit V0.43 — simplification de l’interface foyer

Date : 2026-09-13

## Objectif
Réduire la charge visuelle sans supprimer les capacités déjà construites.

## Changements
- aucune nouvelle fonction métier ;
- profil/préférences, rappels, langue, apparence et confidentialité regroupés dans une seule carte **Réglages** ;
- activité récente conservée mais repliée par défaut ;
- le flux Realtime de l’activité n’est ouvert que lorsque l’historique est déplié ;
- suppression de l’accès redondant « Qui est là aujourd’hui ? » depuis les réglages du foyer : la présence reste disponible dans le planning, au moment où elle influence réellement un repas ;
- suppression des deux cartes explicatives permanentes sur les alertes et l’isolation des données, qui alourdissaient l’écran principal sans nécessiter une action.

## Garde-fous
`npm run audit` bloque désormais :
- la réintroduction de `PresenceScreen` dans le tableau de bord foyer ;
- une activité toujours ouverte ;
- la dispersion des réglages secondaires en cartes indépendantes ;
- le retour des cartes explicatives non actionnables sur l’écran principal.

## Validation
À exécuter avec `npm run verify`.

Cette validation reste un audit de code + tests de régression. Elle ne remplace pas un build Expo natif complet.
