# Audit V0.31 — 2026-09-13

## Objet
Compléter l’invitation prévue au cahier des charges : lien + code.

## Vérification externe
Expo SDK 57 vérifié : `expo-linking` recommandé en `~57.0.9`.

## Comportement
- schéma applicatif `notretable://`;
- route `join?code=XXXXXX`;
- validation stricte du code à 6 caractères alphanumériques ;
- code conservé pendant onboarding/authentification puis prérempli à l’écran Rejoindre ;
- aucun domaine web n’est inventé avant réservation officielle.

## Dernier audit local
46 fichiers TypeScript/TSX transpilés, 0 diagnostic, 415 clés anglaises avec parité fr/es/he, 0 nom de concurrent dans le runtime, 0 alerte heuristique de texte UI français codé en dur.

## Limite
Le build natif complet et la validation réelle des deep links sur iOS/Android restent à faire dans un environnement où les dépendances peuvent être installées et l’app compilée.
