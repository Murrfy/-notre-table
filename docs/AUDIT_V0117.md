# AUDIT V0.117 — continuité de checkpoint

Aucun changement produit. Ce checkpoint empêche les fichiers de reprise et de release de dériver vers des versions différentes.

- `continuity:audit` vérifie l'alignement package/app/README/PROJECT_STATE/VERIFICATION/audit courant.
- `npm run verify` exécute désormais ce contrôle avant les audits backend/release.
- Le release audit exige que ce garde reste câblé dans `package.json`.
- Le README expose à nouveau les checkpoints récents V0.114 → V0.117 en tête pour éviter les reprises ambiguës.
