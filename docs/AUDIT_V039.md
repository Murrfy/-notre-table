# Audit V0.39 — présence du jour repas par repas

Date : 2026-09-13

## Décision produit

« Qui est là aujourd’hui ? » reste volontairement limité à aujourd’hui, mais une présence journée entière était encore trop grossière : dans une famille, quelqu’un peut être absent au déjeuner et présent au dîner. V0.39 remplace donc l’absence journée par une disponibilité **par repas**.

## Vérifications exécutées

- `node scripts/audit-project.cjs` : PASS.
- 51 fichiers TypeScript/TSX transpilés, 0 diagnostic de transpilation.
- 477 clés anglaises avec parité FR/ES/HE.
- 0 nom de concurrent dans le runtime.
- 0 alerte heuristique de texte UI français codé en dur.
- `node scripts/regression-tests.cjs` : **17/17 tests passés**.
- Test ajouté : un membre peut être absent au déjeuner et présent au dîner le même jour.
- Test ajouté : le comptage des absences repas ne mélange pas deux dates.
- `app.json` et `package.json` synchronisés en 0.39.0.

## Données / backend

- `member_absences.meal_type` accepte uniquement `breakfast`, `lunch`, `dinner`, `snack`.
- Unicité : `household_id + user_id + absence_date + meal_type`.
- Le schéma contient une migration idempotente depuis l’ancien modèle journée entière : les lignes historiques sans `meal_type` sont réparties sur les quatre repas avant passage en NOT NULL.
- RLS et Realtime restent ceux du foyer ; aucune géolocalisation n’est collectée.

## Ce qui n’est toujours pas revendiqué

- pas de `tsc --noEmit` avec les types Expo/React Native réels, faute de dépendances installables dans cet environnement ;
- pas d’export/bundle Expo complet ;
- pas de compilation native iOS/Android ;
- pas d’exécution du SQL contre un projet Supabase réel.

Ces validations restent obligatoires avant bêta externe ou publication.
