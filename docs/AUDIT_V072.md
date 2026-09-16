# Audit V0.72 — parité migrations / snapshot

Aucune nouvelle fonction métier. Garde-fou P1 backend/release uniquement.

- `backend:audit` inspecte désormais toutes les migrations postérieures à la migration initiale ;
- chaque fonction `create or replace`, trigger et déclaration de privilège ajoutée par une migration ultérieure doit être reflétée dans `supabase/schema.sql` ;
- une divergence migration → snapshot fait échouer l’audit au lieu d’être seulement signalée ;
- la V0.72 confirme la parité actuelle entre `202609140001`, `202609140002`, `202609140003` et le snapshot ;
- `release:audit` signale explicitement l’absence actuelle de `package-lock.json` comme blocage de reproductibilité à résoudre sur un runner ayant accès au registre npm.

Validation locale : `npm run verify`. Le build installé/EAS et le backend distant restent des preuves externes.
