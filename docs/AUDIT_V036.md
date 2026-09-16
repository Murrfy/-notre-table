# Audit V0.36 — présence du jour

Date : 2026-09-13

## Correction produit
- « Qui est là cette semaine ? » est remplacé par « Qui est là aujourd’hui ? ».
- Suppression de la navigation semaine précédente/suivante dans l’écran de présence.
- Tous les membres sont présents par défaut au début de chaque jour.
- Seules les absences du jour sont lues par le planning.
- Les repas futurs ne sont plus pré-remplis à partir d’absences planifiées.
- L’exception manuelle reste possible pour un repas du jour.

## Backend
- Aucun changement de schéma nécessaire : `member_absences` reste daté et protégé par RLS.
- L’UI V0.36 interroge uniquement la date du jour.
- Les éventuelles anciennes lignes futures créées pendant les tests V0.35 sont ignorées par le produit V0.36.

## Validation
- 50 fichiers TypeScript/TSX transpilés ;
- 0 diagnostic de transpilation ;
- 467 clés i18n anglaises avec parité FR/ES/HE ;
- 0 nom de concurrent dans le runtime ;
- 0 avertissement heuristique de texte UI français codé en dur ;
- `npm run audit` : PASS.

Ce contrôle ne constitue pas un build natif Expo complet.
