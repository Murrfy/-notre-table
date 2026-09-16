# Audit V0.35 — présence du foyer

Date : 2026-09-13

## Ajout produit
- Registre d’absences par membre et par date.
- Écran famille pour modifier les présences de la semaine.
- Les nouveaux repas proposent automatiquement uniquement les membres présents.
- Dérogation manuelle possible, avec avertissement non bloquant.
- Aucun suivi de position ou géolocalisation.

## Backend prévu
- `member_absences` avec unicité `(household_id,user_id,absence_date)`.
- RLS : lecture/écriture limitées aux membres du même foyer ; la cible doit appartenir au foyer.
- Realtime préparé pour rafraîchir planning et écran de présence.
- Le SQL n’a pas encore été exécuté sur une instance Supabase réelle.

## Audit local
- 50 fichiers TypeScript/TSX transpilés.
- 0 diagnostic de transpilation.
- 467 clés i18n anglaises, parité FR/ES/HE.
- 0 nom de concurrent dans le runtime.
- 0 avertissement heuristique de texte UI français codé en dur.

Ce contrôle n’est pas un build natif Expo complet.
