# Audit V0.38 — qualité et localisation native

Date : 2026-09-13

## Ce qui a été réellement vérifié

- `node scripts/audit-project.cjs` : PASS.
- 50 fichiers TypeScript/TSX transpilés, 0 diagnostic de transpilation.
- 474 clés anglaises avec parité FR/ES/HE.
- 0 nom de concurrent dans le runtime.
- 0 alerte heuristique de texte UI français codé en dur.
- `node scripts/regression-tests.cjs` : **15/15 tests passés**.
- `app.json` et `package.json` synchronisés en 0.38.0.
- 4 fichiers de locale native présents : EN/FR/ES/HE.
- Dialogues iOS Photos/Camera localisés ; microphone ImagePicker désactivé.

## Ce qui n’est PAS encore vérifié

Une nouvelle tentative d’installation `npm install --ignore-scripts --no-audit --no-fund` a expiré dans l’environnement de travail avant qu’un `node_modules` exploitable soit créé. Par conséquent :

- `tsc --noEmit` complet avec les types réels Expo/React Native n’est pas validé ;
- un export/bundle Expo complet n’est pas validé ;
- aucune compilation native iOS/Android n’est revendiquée ;
- le SQL Supabase n’a toujours pas été exécuté contre un projet de développement réel.

Ces points restent des validations de pré-lancement, pas des étapes à faire refaire au porteur du projet maintenant.

## Pourquoi cette version existe

À mesure que l’application grossit, la priorité n’est plus seulement d’ajouter des fonctions. V0.38 met en place un filet de régression exécutable et traite aussi l’internationalisation des dialogues système, qui ne passe pas par la couche React de traduction.
