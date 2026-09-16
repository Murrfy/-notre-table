# Audit V0.7 — Notre Table

## Ajouts fonctionnels
- Responsable/cuisinier assignable à chaque repas.
- Sélection « qui mange ? » pour chaque créneau.
- Membres du foyer chargés avec profil et préférences alimentaires.
- Alertes de conflit recette/personne sur allergies, aliments détestés et régimes courants.
- Résumé du cuisinier et du nombre de participants directement dans le planning.
- Vue foyer enrichie avec les préférences de chaque membre.

## Backend préparé
- Lecture des participants d'un repas.
- Enregistrement du cuisinier et des participants.
- Validation SQL empêchant d'assigner comme cuisinier ou participant une personne hors du foyer.

## Vérifications effectuées
- 23 fichiers TypeScript/TSX analysés avec le parseur TypeScript : 0 erreur de syntaxe.
- Le typecheck complet Expo n'est pas déclaré validé : l'installation npm n'a pas terminé dans l'environnement de travail, donc les types des dépendances Expo/React Native n'étaient pas disponibles localement.

## À faire ensuite
- Import d'une recette par URL.
- Import d'une recette par photo/OCR.
- Notifications.
- Auth Apple/Google.
- Backend réel Supabase dès qu'une connexion gratuite stable est disponible.
