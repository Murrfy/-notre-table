# Audit V0.71 — Supabase live smoke durci

Aucune nouvelle fonction métier. Durcissement P1 pré-lancement uniquement.

- isolation RLS inter-foyers testée en lecture et en écriture ;
- insert/update/delete Courses interdits depuis un foyer étranger ;
- élévation directe via `household_members` interdite ;
- création d’invitation par un simple membre interdite ;
- collaboration autorisée conservée pour le membre du même foyer ;
- nettoyage ordonné : suppression des foyers smoke avant les utilisateurs Auth ;
- toute erreur de cleanup fait échouer le smoke au lieu d’être ignorée.

Validation locale : `npm run verify`. Le smoke distant reste à exécuter sur un projet Supabase réel avec `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SERVICE_ROLE_KEY` disponibles uniquement dans un environnement de confiance.

La lane de build reste bloquée ici par l’accès npm : `npm install --package-lock-only` expire également. Aucun lockfile ni build natif n’est donc prétendu validé dans ce runtime.
