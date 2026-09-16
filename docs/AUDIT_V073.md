# Audit V0.73 — suppression de foyer compatible avec la protection du dernier admin

Aucune nouvelle fonction métier. Correction P0/P1 d’intégrité backend.

## Problème identifié

La migration V0.65 empêchait la suppression/démotion du dernier administrateur. Mais la suppression d’un foyer déclenche aussi, par clé étrangère `ON DELETE CASCADE`, la suppression de ses lignes `household_members`. Le trigger pouvait donc bloquer la suppression du foyer lui-même, alors qu’il devait seulement protéger un foyer encore actif.

## Correction

- nouvelle migration `202609140004_allow_household_delete_cascade.sql` ;
- si la ligne parent `households` n’existe déjà plus pendant la cascade, le trigger autorise la suppression du membre admin ;
- une suppression/démotion directe du dernier admin d’un foyer actif reste interdite ;
- `backend:audit` vérifie explicitement cet invariant ;
- le smoke réel V0.71 devient ainsi capable de supprimer ses foyers de test avant les comptes Auth, et une erreur de cleanup reste fatale.

Validation locale : `npm run verify`. La preuve définitive de la cascade reste incluse dans le smoke Supabase distant.
