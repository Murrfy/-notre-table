# Notre Table — Originality & independent-design log

Purpose: keep a dated record showing that product decisions start from user problems and are implemented independently. This is a product-development record, not a legal opinion.

## 2026-09-13 — Household as the product unit
**User problem:** meal planning is often coordinated across several people, while individual apps fragment the household.

**Generic market pattern:** shared calendars/lists and multi-user collaboration are common software patterns.

**Notre Table solution:** one household data space with separate member identities, roles, preferences, meal participation, cook responsibility, shared planning and shared shopping. No shared password is required.

**Independent implementation evidence:** custom Supabase household/member schema, RLS model, invitation flow, participant model and UI copy written specifically for Notre Table.

## 2026-09-13 — Decide Together
**User problem:** the recurring family question “what do we eat?” is itself a coordination problem, not only a calendar problem.

**Generic market pattern:** voting and ranked suggestions are common collaboration mechanics.

**Notre Table solution:** members propose meal ideas or household recipes, vote, see a household ranking, and can move a winning idea into a meal slot.

**Originality note:** this workflow was designed as a household decision layer rather than reproducing a competitor screen or wording.

## 2026-09-13 — Who cooks / who eats / servings
**User problem:** the correct meal and shopping quantity depends on who is present and who is cooking.

**Generic market pattern:** assignees, attendees and quantity scaling are common functional concepts.

**Notre Table solution:** cook identity, meal participants and meal-specific serving count are separate fields. Shopping quantities scale from recipe portions to planned servings.

## 2026-09-13 — International household model
**User problem:** members of the same household can use different languages and measurement conventions.

**Generic market pattern:** localization, canonical IDs and translated views are standard international-software techniques.

**Notre Table solution:**
- UI locale is per member;
- household technical values use language-neutral codes;
- original recipe text is preserved;
- `ingredient_key` provides semantic matching across languages;
- a small original ingredient lexicon supplies safe localized display labels where known;
- future recipe translations are cached as separate `recipe_translations` views and never overwrite originals;
- dates, numbers, currency, first weekday and units are locale-aware.

## 2026-09-13 — Offline-first shopping
**User problem:** a supermarket list must keep working when connectivity is poor.

**Generic market pattern:** local cache + reconciliation queue is a standard offline application architecture.

**Notre Table solution:** shopping data is cached per household and week; check/uncheck actions are retained locally and synchronized later. The cache is not a copy of any competitor implementation.

## 2026-09-13 — User-owned recipe import
**User problem:** families already have recipes across websites, photos and books and should not have to abandon them.

**Generic market pattern:** Schema.org Recipe import and OCR are public interoperability techniques.

**Notre Table solution:** URL import prioritizes public JSON-LD Recipe data; photo import is behind a provider-neutral OCR endpoint; both routes require an editable review before saving. No competitor recipe catalog is copied into the product.

## 2026-09-13 — Cooking mode
**User problem:** cooks need readable sequential guidance and an awake screen while their hands are busy.

**Generic market pattern:** step-by-step task guidance and preventing screen sleep are standard mobile interaction patterns.

**Notre Table solution:** an independently designed full-screen step flow using Expo's keep-awake capability, with ingredients available without leaving the flow.

## Permanent repository rule
Competitor names may appear in research/strategy documentation only. Runtime code is automatically scanned by `npm run audit`; competitor branding in `src/` is treated as a failed IP guardrail. Production assets, recipes, copy, source code and distinctive competitor screen layouts must never be imported into the repository.


## 2026-09-13 — V0.32 — Restes / anti-gaspillage
- Problème utilisateur : un foyer cuisine souvent plus que nécessaire puis rachète inutilement les ingrédients si le repas de restes est traité comme une nouvelle recette.
- Pattern générique observé : planification de repas et réduction du gaspillage sont des besoins courants, non une expression propre à un concurrent.
- Solution indépendante Notre Table : un créneau peut référencer un repas antérieur du même foyer comme « restes ». Le lien garde la traçabilité familiale mais le moteur de courses n'ajoute pas une deuxième fois les ingrédients.
- Aucun écran, wording, asset ou logique propriétaire d’un concurrent n’a été copié.

## 2026-09-13 — V0.33 — Shared pantry / buy only what is missing
**User problem:** households often buy ingredients they already have because the meal plan and the kitchen inventory are disconnected.

**Generic market pattern:** household inventory and stock-aware shopping are common functional concepts.

**Notre Table solution:** a shared household pantry stores canonical ingredient keys plus optional quantities/units. Weekly meal-plan shopping subtracts pantry quantities only when units are compatible; an unquantified pantry line is an explicit household "already in stock" marker. Manual shopping lines are never silently removed.

**Originality note:** the data model, rules and UI copy were designed independently around the household coordination problem. No competitor assets, copy, code or distinctive screen layouts are used.

## 2026-09-13 — V0.34 — Cooking-load visibility
**User problem:** planning can still leave the invisible work concentrated on one person even when the calendar is shared.

**Generic market pattern:** workload distribution and assignment summaries are standard collaboration patterns.

**Notre Table solution:** the weekly plan summarizes assigned cooking responsibility per household member, exposes unassigned meals and gently flags highly concentrated cooking load without scoring or shaming members.

**Originality note:** this feature follows directly from Notre Table's original "shared mental load" product promise and is not modeled on a competitor screen.


## 2026-09-13 — V0.35 — présence familiale
- **Problème utilisateur :** les portions et les courses sont fausses quand certains membres ne sont pas à la maison certains jours.
- **Pattern générique :** disponibilité/absence dans un calendrier partagé.
- **Solution indépendante Notre Table :** un statut quotidien simple « ici / absent » par membre, utilisé uniquement pour pré-sélectionner les convives d’un nouveau repas. Une inclusion manuelle reste possible et déclenche un avertissement non bloquant.
- **PI :** aucune interface, terminologie distinctive, contenu ou code d’un concurrent n’a été repris.


## 2026-09-13 — V0.36 — présence limitée au jour même
**User problem:** prévoir la présence de toute une semaine est déroutant et donne l’impression de devoir connaître à l’avance l’emploi du temps familial.

**Generic product pattern:** un statut quotidien temporaire est un mécanisme courant de coordination.

**Notre Table solution:** la question devient uniquement « Qui est là aujourd’hui ? ». Chaque nouveau jour repart avec tout le foyer présent par défaut ; seules les absences du jour influencent les nouveaux repas du jour. Les repas futurs ne demandent aucune prévision de disponibilité.

**Originality note:** cette simplification vient directement du comportement réel d’un foyer et non d’un écran concurrent.

## 2026-09-13 — V0.37 — tableau quotidien
**Problème utilisateur observé :** une famille ne sait pas toujours ce qu’elle fera demain ; demander trop de prévision rend l’organisation plus lourde.

**Pattern générique étudié :** les applications d’organisation efficaces donnent une vue immédiate de la journée en plus d’une vue de planification plus longue.

**Solution Notre Table conçue indépendamment :** un bloc « Aujourd’hui à table » construit uniquement à partir des données déjà partagées du foyer : présence du jour, quatre repas, cuisinier, convives et portions. Il ne crée aucun calendrier parallèle et ne prédit rien.

**Expression originale :** structure, textes et interactions ont été conçus dans le projet ; aucune capture, copie d’écran, texte, code ou asset concurrent n’est utilisé.


## 2026-09-13 — présence quotidienne par repas
- Problème observé : demander une disponibilité future ou une absence journée entière crée une précision artificielle et peut fausser les portions.
- Pattern générique : disponibilité quotidienne contextuelle.
- Solution indépendante Notre Table : aucun agenda de présence future ; aujourd’hui uniquement, avec quatre créneaux repas activables par membre et présélection automatique uniquement lors de la création d’un nouveau repas.
- Aucun écran, texte, asset ou flux concurrent n’a été reproduit.


## 2026-09-13 — Placard « à utiliser bientôt »
- Problème utilisateur : un foyer peut déjà posséder un ingrédient mais l’oublier jusqu’à ce qu’il soit gaspillé.
- Pattern générique observé dans les outils de gestion domestique : inventaire + notion de fraîcheur.
- Solution indépendante Notre Table : date facultative par ligne de placard, priorité visuelle à 3 jours, aucune suggestion de recette automatique et aucune date estimée par l’application.


## 2026-09-13 — V0.42 — mémoire familiale des goûts
**Problème utilisateur :** une famille oublie rapidement quels plats ont réellement plu à chacun et finit par rediscuter ou reproposer les mêmes recettes mal accueillies.

**Pattern générique :** réactions, favoris et préférences individuelles sont des mécanismes courants de collaboration.

**Solution indépendante Notre Table :** chaque membre garde une réaction privée au foyer sur une recette (`à refaire / ça me va / pas pour moi`). Le planning affiche uniquement une synthèse simple pour éclairer la décision familiale ; il n’existe ni notation publique, ni classement communautaire, ni moteur de recommandation copié d’un concurrent.

**PI :** textes, modèle de données, flux, agrégation et présentation ont été conçus dans le projet sans importer d’asset, d’écran, de recette, de code ou de wording concurrent.

## 2026-09-13 — V0.43 — simplification contextuelle
**Problème utilisateur :** trop d’options visibles au même niveau rendent une application familiale intimidante et donnent l’impression qu’il faut tout paramétrer.

**Pattern générique :** divulgation progressive et réglages secondaires regroupés.

**Solution indépendante Notre Table :** les actions quotidiennes restent dans le planning/courses/recettes ; les préférences et réglages sont regroupés, l’historique est replié et la présence n’est montrée que dans le contexte du repas. Aucune nouvelle fonction n’est ajoutée.


## 2026-09-13 — V0.45 — écran quotidien recentré
**Problème utilisateur :** un écran qui expose simultanément semaine, décisions, charge cuisine et quatre repas donne une impression d’outil administratif au lieu d’une application que l’on ouvre naturellement chaque jour.

**Pattern générique :** hiérarchisation par prochaine action, résumé quotidien et divulgation progressive sont des principes UX généraux.

**Solution indépendante Notre Table :** le prochain repas local devient le point focal, suivi de deux raccourcis foyer (présence et courses), puis du reste de la journée. Le planning hebdomadaire est conservé mais replié. Les idées familiales apparaissent contextuellement quand il y a réellement une décision à prendre.

**PI :** cette hiérarchie est issue du retour utilisateur et des données déjà propres au projet ; aucun écran, asset, wording ou flux concurrent n’est reproduit.


## 2026-09-13 — V0.47 — identité visuelle quotidienne
**Problème utilisateur :** l’application paraissait encore trop générique et trop proche d’un outil de gestion, malgré un périmètre fonctionnel solide.

**Pattern générique :** hiérarchie visuelle cohérente, iconographie système et composants réutilisables sont des principes standards de design produit.

**Solution indépendante Notre Table :** création de pictogrammes géométriques React Native pour les repas, d’un en-tête partagé et d’un placeholder recette original. Les écrans quotidiens abandonnent les emoji décoratifs afin d’obtenir un rendu plus stable, plus premium et identique entre plateformes.

**PI :** les formes, composants, textes et règles visuelles ont été dessinés dans le projet ; aucun asset, icône, capture ou composition concurrente n’a été repris.
