# Audit V0.77 — historique distant de migrations auto-verrouillé

Aucune nouvelle fonction métier. Durcissement P1 du contrôle Supabase distant.

- le contrôle `table_exists` est maintenant strictement limité au schéma `public` ;
- `backend:audit` vérifie que **chaque version de migration présente dans `supabase/migrations/`** est explicitement attendue par `verify_backend.sql` ;
- une future migration ajoutée sans mise à jour de la preuve distante fera donc échouer l’audit local au lieu d’être oubliée.
