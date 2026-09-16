# Audit V0.37 — 2026-09-13

## Fonction ajoutée
- Vue « Aujourd’hui à table » intégrée au planning courant.
- Repas du jour actionnables directement : petit-déjeuner, déjeuner, dîner, snack.
- Résumé cuisinier / convives / portions sans créer de modèle de données parallèle.
- Accès direct à « Qui est là ? » avec rechargement des présences à la fermeture.
- Aucune présence future demandée ou déduite.

## Garde-fous
- Le runtime reste indépendant des marques concurrentes ; Jow a été ajouté au contrôle automatique des noms interdits dans `src/`.
- `app.json` et `package.json` sont tous deux en `0.37.0`; l’audit vérifie désormais leur parité.
- Parité de traduction FR/EN/ES/HE conservée, y compris les nouveaux textes du tableau quotidien.

## Validation exécutée
`npm run audit` : PASS.
- 50 fichiers TypeScript/TSX transpilés ;
- 0 diagnostic de transpilation ;
- 474 clés i18n anglaises avec parité fr/es/he ;
- 0 violation de nom concurrent dans le runtime ;
- 0 alerte heuristique de texte UI français codé en dur.

## Limite connue
`npm run typecheck` ne peut pas être utilisé comme validation native dans ce runtime car les dépendances du projet ne sont pas installées (`react`, `react-native`, modules Expo, `expo/tsconfig.base`, etc.). Les erreurs observées sont donc principalement des modules/types absents et non un build applicatif exécuté. Le build Expo iOS/Android et le SQL Supabase réel restent à tester avant publication.
