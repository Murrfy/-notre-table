# Audit V0.28 — 2026-09-13

## Objet
Préparer les droits de portabilité et d’effacement pour un lancement international.

## Choix de sécurité
- export portable en JSON sur l’appareil puis feuille de partage native ;
- export limité au compte courant et au contenu qu’il a créé, afin de réduire les fuites de données d’autres membres ;
- suppression de compte uniquement via un endpoint serveur de confiance authentifié par le token utilisateur ;
- aucun secret `service_role` dans l’application mobile ;
- absence d’endpoint = action refusée explicitement, jamais simulée comme réussie.

## Vérification externe
Documentation Expo SDK 57 vérifiée pour `expo-file-system`, version recommandée `~57.0.6`.

## Limites
Le build natif et l’endpoint d’effacement réel restent à valider avant publication.
