# Audit V0.25 — 2026-09-13

## Scope
Checkpoint après durcissement de l'architecture internationale, du module recettes et des garde-fous de propriété intellectuelle.

## Vérifications automatiques
`node scripts/audit-project.cjs`

Résultat :
- 40 fichiers `.ts/.tsx` transpilés ;
- 0 diagnostic de transpilation ;
- 363 clés de traduction dans le dictionnaire anglais ;
- parité des clés fr / es / he ;
- invariant de marque `NOTRE TABLE` dans les quatre locales ;
- présence des invariants SQL `recipe_translations` + RLS ;
- 0 occurrence des noms de concurrents surveillés dans `src/` ;
- 0 alerte heuristique de texte UI français codé en dur dans `src/screens/`.

## Corrections / améliorations V0.25
1. `RecipesScreen` entièrement branché sur l'i18n pour les quatre langues actuelles.
2. Formats quantité/unité localisés dans le détail recette.
3. Erreurs import URL/OCR converties en codes applicatifs neutres puis traduites à la frontière UI.
4. Notifications locales dîner/week-end programmées avec contenu dans la langue du membre.
5. Marque mondiale figée à `NOTRE TABLE` ; elle n'est plus traduite selon la locale.
6. Lexique sémantique d'ingrédients refactoré et étendu pour fusion/affichage multi-langues.
7. Courses : affichage localisé des ingrédients connus à partir de `ingredient_key`, avec fallback sur le libellé original.
8. Schéma `recipe_translations` ajouté : traduction séparée, source originale préservée, `source_hash` pour ignorer un cache périmé.
9. Détail recette prêt à consommer une traduction cache valide ; Mode Cuisine reçoit cette vue traduite quand elle existe.
10. Correction d'idempotence SQL : `recipe_favorites` est désormais inclus dans le nettoyage des politiques RLS, avec `recipe_translations`.
11. Ancien `WelcomeScreen` inutilisé supprimé pour éviter un second onboarding codé en dur.
12. Ajout de `docs/ORIGINALITY_LOG.md` et d'un audit automatisé PI/runtime.

## Ce qui n'est PAS validé
- build natif Expo iOS/Android ;
- typecheck complet avec les dépendances installées ;
- exécution réelle du schéma/migrations Supabase ;
- achats RevenueCat réels ;
- OCR/translation providers réels ;
- comportement App Store/Play Store sur appareils de production.

## Pourquoi
Le runtime de travail actuel ne contient pas `node_modules`; une tentative `tsc` confirme que les modules Expo/React ne sont pas installés. Il serait trompeur de transformer le contrôle de transpilation en affirmation de build complet.

## Prochain vrai test bloquant
Dès qu'un environnement peut installer les dépendances :
1. `npm install` ;
2. `npm run typecheck` ;
3. `npm run audit` ;
4. lancement Expo et test iPhone/Android ;
5. migration du schéma sur un projet Supabase de développement isolé.
