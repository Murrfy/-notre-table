# État de projet — Notre Table










## V0.155 — lockfile npm réel et reproductible
- Le dépôt privé GitHub `Murrfy/-notre-table` est maintenant accessible en lecture/écriture au connecteur.
- Le lockfile npm v3 a été généré sur GitHub avec Node 22.16.0 / npm 10.9.2.
- Le même run a prouvé un `npm ci --no-audit --no-fund` propre : PASS.
- Preuve initiale : run `35005422406`, job `104503841531`, commit lockfile `32ab676be6929f43d9000e36f2385aa744e33a8d`.
- Preuve V0.155 : run `35006195617`, job `104506432590`, `npm ci` PASS, lockfile SHA-256 `1031e4d59be74bb0228b8812e2a73bf0de17ac026070e0c7b9f5f5852161b029`.
- Validation locale : 165/165 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 268 fichiers.
- Aucun changement produit ; prochaine preuve installée : vrai `tsc` + exports Expo après import du runtime complet.

## V0.154 — états busy complets
- Les contrôles désactivés par une écriture asynchrone restante annoncent désormais `busy` aux lecteurs d’écran.
- Aucun changement produit ou visuel.
- Validation locale V0.154 : 164/164 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 266 fichiers.

## V0.153 — réactions recettes single-flight
- `RecipeTasteCard` protège désormais les réactions de goût par un verrou synchrone `tasteInFlight`.
- Aucun changement produit ou visuel.
- Validation locale V0.153 : 164/164 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 265 fichiers.

## V0.152 — recettes et présence single-flight
- Dernières mutations recettes/présence protégées par verrous synchrones ciblés.
- Aucun changement produit, backend ou navigation.
- Validation locale V0.152 : 164/164 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 264 fichiers.

## V0.151 — authentification et profil single-flight
- Authentification, récupération, déconnexion, avatar et préférences protégés avant rerender.
- Aucun changement produit, backend ou navigation.
- Validation locale V0.151 : 163/163 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 263 fichiers.

## V0.150 — effets de bord planning/courses/garde-manger single-flight
- Planning, garde-manger et outils de courses protégés contre les doubles déclenchements avant rerender.
- Aucun changement produit, backend ou navigation.
- Validation locale V0.150 : 162/162 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 262 fichiers.

## V0.149 — soumissions foyer single-flight
- Soumissions foyer, invitation, export et actions membres légers protégés contre les doubles taps avant rerender.
- Aucun changement produit, backend ou navigation.
- Validation locale V0.149 : 161/161 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 261 fichiers.

## V0.148 — actions sensibles single-flight
- Achat/restauration et suppression de compte protégés contre les doubles taps avant rerender.
- Aucun changement produit, backend, navigation ou tarification.
- Validation locale V0.148 : 160/160 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS ; hygiène source 260 fichiers.

## V0.147 — sauvegarde notifications single-flight
- Verrou synchrone contre les doubles taps pendant l’écriture/programmation native.
- Bouton save désactivé + `accessibilityState.busy` pendant l’opération.
- Validation locale V0.147 : 159/159 régressions, 17/17 gates EAS, 83 TS/TSX, 631 clés EN, audits PASS.

## V0.146 — saisie structurée cross-platform
- Les heures de rappel et dates d’expiration n’utilisent plus le clavier iOS-only `numbers-and-punctuation`.
- `number-pad` est utilisé avec formatage automatique `HH:MM` / `YYYY-MM-DD`.
- Validation locale V0.146 : 158/158 régressions, 17/17 gates EAS, 83 TS/TSX, 630 clés EN, audits PASS.

## V0.145 — cible tactile du favori renforcée
- Le cœur favori conserve 34×34 visuellement et gagne `hitSlop={5}` pour une cible effective 44×44.
- Un garde permanent empêche la régression de cette cible tactile.
- Aucun changement backend, navigation ou visuel.
- Validation locale V0.145 : 155/155 régressions, 17/17 gates EAS, 82 TS/TSX, 630 clés EN, audits PASS.

## V0.137 — disclosures accessibles complets
- 7 panneaux dépliables runtime sont maintenant explicitement classifiés via `accessibilityState.expanded`.
- Aucun changement backend, visuel ou navigation.
- Validation locale V0.137 : 147/147 régressions, 17/17 gates EAS, 82 TS/TSX, audits PASS.

## V0.136 — états binaires accessibles
- Courses : rôle `checkbox` + état `checked`.
- Favoris recette : état `selected` sur la carte et le détail.
- Aucun changement visuel/backend.
- Validation locale V0.136 : 146/146 régressions, 17/17 gates EAS, 82 TS/TSX, audits PASS.

## V0.135 — boutons icône accessibles
- Six commandes purement symboliques ont un `accessibilityLabel` explicite et localisé.
- Aucun changement backend, navigation ou visuel.
- Validation locale V0.135 : 145/145 régressions, 17/17 gates EAS, 82 TS/TSX, audits PASS.

## V0.134 — autofill auth explicite
- `AuthScreen` : e-mail `autoComplete="email"`; mot de passe `current-password` en connexion et `new-password` en inscription.
- `PasswordRecoveryScreen` : nouveau mot de passe et confirmation en `new-password`.
- Aucun changement produit, backend ou navigation.
- Validation locale V0.134 : 144/144 régressions, 17/17 gates EAS, 82 TS/TSX, audits PASS.

Ce fichier sert de mémoire opérationnelle pour éviter de refaire une action déjà accomplie.

## Déjà fait — ne pas recommencer

- Cahier des charges V1 fourni et validé comme référence produit.
- Choix technique : React Native + Expo + Supabase.
- Dépôt GitHub privé `Murrfy/-notre-table` créé et désormais accessible au connecteur ChatGPT/Codex en lecture/écriture. Ne pas recréer le dépôt.
- Fondation locale V0.1 puis V0.2 créée.
- V0.5 : navigation entre semaines, créneau snack/goûter, liste de courses isolée par semaine, file hors-ligne isolée par semaine et statut de synchro corrigé.
- V0.3 : correction de compatibilité Expo SDK 57 → React Native 0.86.
- V0.3 : Auth Supabase, foyer, invitations, planning, recettes, courses, cache hors-ligne et RLS codés.

## Blocage externe actuel

- GitHub et le lockfile npm ne sont plus bloquants : génération réseau + `npm ci` sont prouvés.
- Le runtime complet doit encore être importé dans le dépôt pour exécuter le vrai `tsc` et les exports Expo.
- Aucun projet Supabase n'a encore été créé/branché avec URL + clé publique.

## Prochaine étape externe, uniquement quand nécessaire

Créer un projet Supabase de développement, exécuter `supabase/schema.sql`, puis fournir à l'app les deux variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Règle de travail

Avant toute instruction au porteur du projet : vérifier ce fichier + l'état réel du service concerné. Ne jamais demander de recréer GitHub, le dépôt, ou une étape déjà accomplie sans preuve d'un besoin réel.

## V0.7
- Responsable du repas ajouté.
- « Qui mange ? » ajouté.
- Membres + préférences chargés au niveau du foyer.
- Alertes de conflits alimentaires ajoutées.
- Contrôles SQL d'intégrité cuisinier/participants ajoutés.
- NE PAS recréer le dépôt GitHub `notre-table` : il existe déjà.
- NE PAS refaire les parcours d'autorisation GitHub/Supabase déjà tentés sans nouvelle preuve que le chemin a changé.

## V0.8 — 2026-09-13
- Import par URL implémenté via JSON-LD Schema.org Recipe.
- Aperçu et correction obligatoires avant sauvegarde.
- URL source et photo importées conservées.
- Le bouton Photo/OCR reste volontairement non actif jusqu'à l'implémentation du pipeline OCR.

## V0.9 — 2026-09-13
- Réutilisation de la semaine précédente implémentée.
- Ajout direct d'une recette à la liste de courses implémenté avec fusion des doublons.
- Import URL V0.8 conservé avec validation humaine avant sauvegarde.

## V0.10 — 2026-09-13
- Mode démo : la liste de courses est maintenant persistée par semaine dans le cache local.
- Un ajout recette → courses est réellement visible ensuite dans l'onglet Courses en mode démo.
- Stratégie mise à jour : Mealime annonce sa fermeture le 21/10/2026 ; ne plus traiter Mealime comme cible concurrentielle durable.

## V0.11 — 2026-09-13
- Nom affiché du membre modifiable.
- Invitation du foyer partageable depuis l'app.
- Aucun nouveau service externe requis.

## V0.12 — 2026-09-13
- Planning démo persistant semaine par semaine.
- Correction du mélange de dates lors de la navigation entre semaines.
- Réutilisation semaine précédente cohérente aussi en mode démo.

## V0.13 — 2026-09-13
- Favoris personnels implémentés.
- Filtre Favoris implémenté.
- Difficulté recette implémentée.

## V0.14 — 2026-09-13
- Onboarding en 3 étapes ajouté et mémorisé localement : il ne se répète pas à chaque ouverture.
- Réglages de notifications ajoutés et persistés localement.
- Heure du rappel dîner configurable et validée au format HH:mm.
- Les préférences de notification sont prêtes pour le futur branchement push ; aucun compte externe requis à ce stade.
- Le design global reste volontairement provisoire : refonte visuelle reportée après stabilisation fonctionnelle.

## V0.15 — 2026-09-13
- `expo-notifications` ajouté à la version recommandée pour Expo SDK 57 (`~57.0.17`).
- Rappel local quotidien du dîner réellement programmable.
- Rappel local hebdomadaire avant le week-end réellement programmable, avec jour et heure configurables.
- Permission système demandée uniquement lors de l'enregistrement si un rappel local est activé.
- Les identifiants des rappels créés sont mémorisés pour pouvoir les remplacer proprement lors d'un changement de réglage.
- Notifications collaboratives planning/courses : UX prête mais envoi distant volontairement différé jusqu'au branchement backend.

## V0.16 — 2026-09-13
- Export PDF réel de la liste de courses ajouté.
- `expo-print ~57.0.1` et `expo-sharing ~57.0.18` ajoutés après vérification de la documentation Expo SDK 57.
- Partage texte conservé ; l'utilisateur peut maintenant choisir Texte ou PDF.
- Le PDF regroupe les articles par rayon et conserve l'état coché/non coché.

## V0.17 — 2026-09-13
- Filtres recettes complétés : durée ≤30 min / ≤60 min, difficulté, tags/régimes et favoris.
- Tags proposés dynamiquement à partir de la bibliothèque du foyer.
- Les filtres sont cumulables avec la recherche par nom/tag/ingrédient.

## V0.18 — 2026-09-13
- Import photo/OCR ajouté côté application.
- `expo-image-picker ~57.0.16` ajouté après vérification de la documentation Expo SDK 57.
- Deux sources : appareil photo ou photothèque.
- Parcours : photo → OCR → aperçu/correction → enregistrement.
- En mode démo, OCR simulé pour tester l'expérience complète sans compte ni coût externe.
- En production, l'OCR passe par `EXPO_PUBLIC_RECIPE_OCR_ENDPOINT`; aucune image n'est envoyée si cet endpoint n'est pas configuré.
- Le choix du fournisseur OCR reste volontairement découplé (Google Vision, OpenAI Vision ou autre peuvent être branchés derrière le même contrat).


### V0.19 — Monétisation préparée
- Paywall Famille avec mensuel 4,99 € et annuel 39,99 €.
- Essai local de 14 jours pour prévisualiser le parcours avant RevenueCat.
- Free : 1 utilisateur, 10 recettes, imports et invitations bloqués.
- Démo : tout reste accessible pour tester le produit.
- Aucun paiement réel n’est activé à ce stade.


### V0.20 — Décider ensemble
- Tableau d’idées de repas familial avec votes.
- Chaque membre garde son identité ; pas de partage de mot de passe.
- Les idées les mieux votées remontent et peuvent alimenter le planning.
- C’est un différenciateur volontaire par rapport au simple planning partagé.


### V0.21 — Portions intelligentes
- Chaque repas a un nombre de portions propre.
- Les courses sont recalculées avec le ratio portions planifiées / portions recette.
- Objectif : éviter une liste sous- ou surdimensionnée quand le nombre de convives change.


### V0.22 — Mode Cuisine
- Reprise d’un point fort de Mealime : guidage pas à pas pendant la cuisson.
- Écran maintenu actif via expo-keep-awake.
- Étapes très lisibles et ingrédients consultables pendant la préparation.

## V0.24 — 2026-09-13 — International + protection PI
- L’international est désormais une contrainte de fond : ne pas stocker les catégories techniques en français.
- Langue, région, devise, unités, fuseau, sens RTL/LTR et premier jour de semaine proviennent de `expo-localization` / préférences membre.
- Le début de semaine suit le calendrier de l’utilisateur ; ne pas réintroduire un lundi codé en dur dans l’UI internationale.
- `ingredient_key` canonique ajouté pour rapprocher/fusionner un même ingrédient écrit dans plusieurs langues.
- `source_language` prévu pour conserver la langue originale d’une recette importée.
- Les préférences alimentaires ont des clés canoniques séparées de leur libellé utilisateur.
- Le prix 4,99 €/39,99 € reste une référence business ; en production le prix affiché doit venir du Store via RevenueCat, jamais d’une conversion maison présentée comme prix local.
- `expo-keep-awake` corrigé vers `~57.0.1`, version recommandée pour Expo SDK 57.
- `docs/IP_GUARDRAILS.md` devient une règle projet : benchmark de besoins oui, copie de code/contenu/design concurrent non.
- Ne jamais importer dans le dépôt du code, des recettes, images, textes, slogans ou captures de concurrents comme assets de production.

## V0.25 — 2026-09-13 — Internationalisation hardened + originality audit
- Recipes screen moved to the shared i18n layer for French, English, Spanish and Hebrew; RTL text alignment supported.
- Local reminder notification content is scheduled in the current member's language instead of being hard-coded in French.
- Product brand is globally invariant: **NOTRE TABLE** is not translated per locale.
- Cross-language ingredient lexicon expanded with original, language-neutral keys plus localized display labels; unknown ingredients retain original user wording.
- Shopping can display known canonical ingredients in each member's language while preserving the shared underlying item.
- `recipe_translations` cache table added to the planned Supabase schema; translations are separate views and never overwrite the original recipe.
- Recipe detail is translation-ready: if a valid cached translation exists for the member's language, it is displayed and passed into Cooking Mode; otherwise the original is shown.
- Import/OCR technical errors now use language-neutral app error codes and are translated at the UI boundary.
- Legacy unused `WelcomeScreen` removed to reduce duplicate/hard-coded onboarding copy.
- Local notification copy is fully localized.
- Added `docs/ORIGINALITY_LOG.md` to document independent product design.
- Added `npm run audit`: TS/TSX transpile check, i18n key parity, global brand invariant, international schema invariants, competitor-name runtime guardrail and hard-coded-French heuristic.
- Audit result at this checkpoint: **40 TS/TSX files, 0 transpile diagnostics, 363 English i18n keys, 0 runtime competitor-name violations, 0 localization heuristic warnings**.
- Full Expo native build remains unverified because project dependencies are not installed in the current runtime; do not claim native build success until an environment can install dependencies.
- Supabase SQL remains not live-executed; schema changes are structurally reviewed but must be migration-tested against a development project before release.


## V0.26 — thème dès la fondation
- préférence Automatique / Clair / Sombre stockée localement ;
- override Appearance au niveau de l’app ;
- palette centralisée adaptative ;
- réglage accessible dans Foyer ;
- aucun redesign final encore figé : cette couche évite de recolorer tous les écrans plus tard.


## V0.27 — invités sans compte
- un repas peut inclure des invités temporaires nommés sans leur créer de compte ;
- le nombre de convives affiché inclut membres + invités ;
- les portions suivent automatiquement le nombre de convives tant que l’utilisateur ne les a pas ajustées manuellement ;
- les invités sont persistés dans `meal_guests`, isolés par les mêmes règles foyer/RLS que le repas ;
- la copie de semaine précédente recopie aussi les invités.


## V0.28 — confidentialité et portabilité
- export JSON de données personnelles et du contenu créé par l’utilisateur ;
- l’export évite d’aspirer silencieusement les données privées créées par d’autres membres du foyer ;
- `expo-file-system ~57.0.6` ajouté après vérification de la documentation Expo SDK 57 ;
- suppression du compte préparée derrière un endpoint serveur authentifié ; aucun service-role ni suppression `auth.users` n’est embarqué dans le client ;
- si l’endpoint n’est pas configuré, l’app dit explicitement que rien n’a été supprimé.


## V0.29 — 2026-09-13 — photo de profil privée
- Photo de profil ajoutée sans bucket public.
- Bucket `profile-avatars` privé, taille max 5 Mo, types image limités.
- En React Native, upload en ArrayBuffer depuis le base64 (pas Blob/FormData).
- Lecture via URL signée temporaire et RLS limitée aux membres du même foyer.
- L’ancien `avatar_url` reste seulement pour compatibilité ; les nouveaux uploads utilisent `avatar_path`.

## V0.30 — 2026-09-13 — activité du foyer
- Historique récent des actions utiles au foyer : repas modifié/supprimé, article coché/décoché, recette ajoutée, idée proposée.
- Ce n’est pas un chat : aucune messagerie libre n’a été ajoutée.
- Événements créés côté PostgreSQL par triggers, visibles uniquement aux membres du foyer via RLS.
- Le flux se rafraîchit en temps réel quand Supabase sera branché.

## V0.31 — 2026-09-13 — invitation par lien
- Schéma d’URL `notretable://` ajouté et `expo-linking ~57.0.9` vérifié pour Expo SDK 57.
- Un lien d’invitation préremplit automatiquement le code du foyer.
- Si l’utilisateur n’est pas encore connecté, le code reste en attente et est repris après authentification.
- Le code 6 caractères reste toujours présent comme solution de secours.
- Ne pas inventer un domaine web/universal link tant qu’un domaine officiel n’a pas été réservé.


## V0.32 — 2026-09-13 — restes et anti-gaspillage
- Un repas peut être planifié comme « restes » d’un repas antérieur du même foyer.
- Les restes gardent convives, portions, cuisinier et notes comme tout autre créneau.
- Ils n’ajoutent pas une seconde fois les ingrédients à la liste de courses, car aucun `recipe_id` n’est attaché au nouveau créneau.
- Le lien `leftover_from_meal_id` reste interne au foyer et vérifié côté RPC.
- La copie de semaine conserve le statut « restes » mais efface le pointeur ancien pour ne pas prétendre que les restes viennent d’un repas vieux d’une semaine.

## V0.33 — 2026-09-13 — placard partagé
- Nouveau `pantry_items` : inventaire commun au foyer, protégé par RLS.
- Quantité facultative : vide = marqueur volontaire « on en a » ; numérique = quantité à déduire.
- La génération hebdomadaire retire les doublons du placard et soustrait les quantités uniquement quand les unités correspondent.
- Les articles manuels de courses ne sont jamais supprimés automatiquement par le placard.
- Cache local du placard en mode démo/offline.

## V0.34 — 2026-09-13 — répartition de la charge cuisine
- Le planning résume combien de repas sont attribués à chaque cuisinier.
- Les repas sans responsable sont visibles séparément.
- Si au moins 75 % des repas cuisinés (minimum 3) retombent sur une seule personne, l’app affiche une suggestion neutre de partage.
- Aucun classement, score ou mécanisme culpabilisant n’est utilisé.


## V0.35 — 2026-09-13 — présence du foyer
- Nouveau registre `member_absences`, limité au foyer par RLS et synchronisable en temps réel.
- Écran « Qui est là ? » : présence/absence par membre et par jour, avec cache local en mode démo.
- Lors de la création d’un nouveau repas, les membres marqués absents ce jour-là ne sont plus sélectionnés automatiquement.
- Une personne absente peut toujours être réincluse manuellement pour une exception ; l’éditeur affiche alors un avertissement non bloquant.
- Le cuisinier est également signalé s’il est marqué absent.
- La présence est une donnée d’organisation du foyer, pas une donnée de localisation : aucune géolocalisation n’est collectée.


## V0.36 — 2026-09-13 — « Qui est là aujourd’hui ? »
- Correction produit issue du retour utilisateur : demander les présences d’une semaine entière crée une fausse précision, car une famille ne sait pas toujours qui sera là demain.
- L’écran de présence ne montre plus de navigation hebdomadaire : il concerne uniquement la date du jour.
- Tous les membres sont considérés présents par défaut chaque nouveau jour ; on ne signale que les absences du jour.
- Le planning ne charge les absences que pour aujourd’hui. Les repas futurs continuent donc à présélectionner tous les membres, sans exiger de prévision.
- Si une personne absente aujourd’hui est réincluse manuellement dans un repas d’aujourd’hui, l’avertissement non bloquant reste disponible.
- La table datée `member_absences` est conservée : elle permet la synchronisation multi-appareils et garde le modèle simple, mais l’UI V0.36 n’écrit ni n’exploite d’absences futures.

## V0.37 — 2026-09-13 — « Aujourd’hui à table »
- Le planning courant commence par une vue d’action centrée sur aujourd’hui, sans remplacer le planning hebdomadaire.
- Les quatre créneaux du jour affichent immédiatement le repas prévu, le cuisinier, les convives et les portions ; un créneau vide ouvre directement l’éditeur.
- « Qui est là ? » est accessible depuis cette vue et recharge les présences du jour à la fermeture, y compris en mode démo.
- L’ancien encart d’absence purement informatif est remplacé par une vue utile même quand tout le monde est présent.
- Aucune prévision de présence future n’est réintroduite.
- Les versions `app.json` et `package.json` sont désormais synchronisées et l’audit bloque tout futur écart.
- Le garde-fou PI runtime inclut désormais Jow parmi les noms concurrents interdits dans le code produit.

## V0.38 — 2026-09-13 — qualité et localisation native
- Pas de nouvelle fonction métier ajoutée avant durcissement : tentative réelle de `npm install` relancée, mais l’environnement a encore expiré avant installation. Ne pas présenter cela comme un échec du projet ni comme un build validé.
- Suite `scripts/regression-tests.cjs` ajoutée : 15 tests exécutables sur dates/calendriers, clés d’ingrédients multilingues, rayons/difficultés/unités, conversions métrique/impérial et interpolation i18n.
- `npm run verify` exécute désormais audit statique + régressions.
- Internationalisation native renforcée : `expo.locales` EN/FR/ES/HE, `CFBundleAllowMixedLocalizations`, messages iOS Photos/Camera localisés et nom produit invariant.
- Permission microphone d’`expo-image-picker` reste explicitement désactivée : l’application importe des images fixes et ne doit pas demander l’audio.
- Audit bloque maintenant la disparition future d’un fichier de locale native, d’un texte de permission ou des scripts de régression.


## V0.39 — 2026-09-13 — présence du jour, repas par repas
- Retour produit appliqué sans revenir à une planification hebdomadaire des présences : l’écran reste centré uniquement sur aujourd’hui.
- Une présence n’est plus un état « toute la journée ». Chaque membre peut être présent au petit-déjeuner, absent au déjeuner, puis présent au dîner.
- Les nouveaux repas d’aujourd’hui présélectionnent seulement les membres disponibles pour le créneau concerné ; les repas déjà enregistrés ne sont jamais modifiés silencieusement.
- Le tableau « Aujourd’hui à table » calcule la disponibilité par type de repas et garde l’accès rapide à « Qui est là ? ».
- `member_absences` reçoit désormais `meal_type` avec unicité foyer + membre + date + repas.
- Le SQL contient une migration de sécurité depuis l’ancien modèle V0.35 : une ancienne absence journée entière est développée sur les quatre repas avant activation de la nouvelle contrainte.
- Le cache démo change de clé afin de ne pas interpréter d’anciennes absences journée entière comme des absences repas.
- Deux régressions ajoutées : déjeuner absent / dîner présent, et comptage limité à la date demandée.
- Audit : 51 fichiers TS/TSX, 0 diagnostic de transpilation, 477 clés i18n avec parité FR/ES/HE, 17/17 régressions, 0 nom concurrent dans le runtime.
- Validation native complète toujours non revendiquée : l’environnement ne peut pas actuellement récupérer les dépendances npm/Expo.


## V0.40 — 2026-09-13 — placard anti-gaspillage
- `pantry_items.expires_on` ajoute une date limite facultative sans transformer le placard en gestionnaire de stock complexe.
- Les produits dont la date est dépassée ou arrive dans les 3 jours remontent dans un encart « à utiliser bientôt ».
- Les dates sont traitées comme des jours calendaires locaux, pas comme des timestamps, pour éviter les décalages de fuseau.
- Si un même produit/unité est ajouté plusieurs fois, la quantité continue de se fusionner et la date connue la plus proche est conservée.
- La date reste facultative : l’application ne l’invente jamais et n’empêche pas l’usage d’un produit selon son état réel.
- L’RPC `upsert_pantry_item` a été resserrée : exécution publique révoquée, accès accordé uniquement aux utilisateurs authentifiés, en plus du contrôle d’appartenance au foyer.
- Audit V0.40 : 52 fichiers TS/TSX, 0 erreur de transpilation, 488 clés i18n alignées, 21/21 tests de régression, 0 référence concurrente runtime.


## V0.41 — 2026-09-13 — « Qui fait les courses ? »
- La liste de courses peut désormais afficher un responsable volontaire pour la semaine courante.
- Aucun membre n’est assigné automatiquement : on utilise uniquement « Je m’en charge » quand la décision existe réellement.
- Le rôle peut être libéré ou repris à tout moment ; il ne crée pas un agenda supplémentaire.
- État synchronisable en temps réel via `shopping_responsibilities`, protégé par RLS au niveau du foyer.
- Mode démo/offline : la responsabilité est persistée localement par foyer + semaine.
- La fonction complète « qui cuisine ? » sans mélanger charge cuisine et courses dans un score culpabilisant.
- `tsc --noEmit` a été relancé : il reste non exploitable tant que `node_modules`/`expo/tsconfig.base` ne sont pas installés. Ne pas présenter cette sortie comme une erreur de code ni comme un typecheck validé.
- Audit V0.41 : 53 fichiers TS/TSX, 0 erreur de transpilation, 495 clés i18n alignées, 21/21 régressions, 0 référence concurrente runtime.


## V0.42 — 2026-09-13 — mémoire des goûts du foyer
- Chaque membre peut donner son propre avis sur une recette : `again`, `ok` ou `skip`, affichés localement comme « À refaire / Ça me va / Pas pour moi ».
- Une réaction appartient toujours à son auteur : un membre peut lire la synthèse du foyer mais ne peut modifier ou supprimer que sa propre réaction.
- La fiche recette affiche la synthèse familiale et se met à jour via Realtime lorsque le backend sera branché.
- Le sélecteur de recettes du planning affiche aussi les totaux d’avis afin que la mémoire familiale aide réellement la décision.
- Le mode démo conserve la réaction locale dans AsyncStorage sans inventer les avis d’autres personnes.
- `recipe_feedback` est protégé par RLS et vérifie que la recette appartient bien au même foyer.
- L’export portable passe au format 2 et inclut désormais les favoris, réactions de recette, votes d’idées et absences propres au membre.
- Tentative réelle de `npm install` relancée : expiration du runtime avant récupération des dépendances ; aucun build Expo complet n’est donc revendiqué.
- Audit V0.42 : 56 fichiers TS/TSX, 0 erreur de transpilation, 506 clés i18n alignées, 24/24 régressions, 0 référence concurrente runtime.

## V0.43 — 2026-09-13 — simplification avant nouvelles fonctions
- Retour produit appliqué : ne pas surcharger l’application.
- Aucune fonction métier supplémentaire ajoutée dans cette version.
- Les options secondaires du foyer sont regroupées dans une seule carte Réglages.
- L’activité récente est repliée par défaut et son abonnement Realtime n’est actif que lorsqu’elle est ouverte.
- La présence du jour n’est plus dupliquée dans les réglages : elle reste contextuelle dans le planning, là où elle influence les convives et les portions.
- Les cartes purement explicatives sur les alertes et l’isolation des données quittent l’écran principal afin de conserver une interface orientée action.
- Un garde-fou d’audit empêche de réintroduire ces duplications/clutters sans décision explicite.


## V0.44 — 2026-09-13 — friction zéro
- Aucune nouvelle fonction métier : priorité à la lisibilité des trois écrans utilisés le plus souvent.
- Recettes : le bouton `+` regroupe création manuelle, import par lien et import photo ; les imports ne prennent plus deux cartes permanentes dans la bibliothèque.
- Recettes : seuls « Toutes », « Favoris » et « Filtres » restent visibles par défaut ; durée, difficulté et tags s’ouvrent à la demande.
- Courses : ajout d’un article puis liste apparaissent avant les fonctions secondaires ; placard, responsabilité, export texte/PDF et suppression des articles cochés sont regroupés sous « Outils de courses », replié par défaut.
- Courses : la carte explicative hors-ligne a été retirée du flux principal ; l’état de synchronisation dans l’en-tête reste visible et suffit à informer sans bloquer l’usage.
- Planning : la carte récapitulative purement explicative a été supprimée ; l’état « tout le monde est là » n’occupe plus une ligne permanente ; la répartition de cuisine n’apparaît que si elle est concentrée ou si des repas n’ont pas de responsable.
- Audit de simplicité renforcé pour empêcher le retour accidentel de ces éléments permanents.
- Validation : 56 fichiers TS/TSX, 0 diagnostic de transpilation, 509 clés i18n alignées, 24/24 régressions, 0 référence concurrente dans le runtime.


## V0.45 — 2026-09-13 — « Aujourd’hui » d’abord
- Aucune nouvelle fonction métier : la priorité est devenue la compréhension immédiate du produit.
- Le premier onglet s’appelle désormais « Aujourd’hui » dans chaque langue, au lieu du terme générique « Planning ».
- Le repas pertinent selon l’heure locale (petit-déjeuner, déjeuner, snack ou dîner) devient la carte principale ; s’il n’est pas décidé, l’action « Planifier » et l’accès contextuel à « Décider ensemble » sont immédiatement visibles.
- « Qui est là ? » et « Courses » sont accessibles en un geste depuis le même écran : présence, repas et achats forment le parcours quotidien principal.
- Les trois autres repas du jour restent visibles sous forme compacte.
- Le planning de 7 jours, la répartition de cuisine et les actions de semaine sont repliés par défaut derrière « Organiser la semaine ».
- Les données et services existants sont réutilisés : aucun second modèle « accueil » n’a été créé.
- Audit V0.45 : 56 fichiers TS/TSX, 0 diagnostic de transpilation, 520 clés i18n alignées et 24/24 régressions avant checkpoint.


## V0.46 — 2026-09-13 — personnalité visuelle
- Aucune nouvelle fonction métier.
- Palette plus chaleureuse et hiérarchie visuelle renforcée.
- Barre d’onglets redessinée avec pictogrammes React Native originaux, sans dépendance externe ni asset concurrent.
- L’écran Aujourd’hui reste centré sur le prochain repas et les actions quotidiennes.


## V0.47 — 2026-09-13 — cohérence visuelle et micro-frictions
- Aucune nouvelle fonction métier : poursuite du polissage avant tout nouvel ajout.
- Ordre canonique des repas centralisé : petit-déjeuner → déjeuner → goûter/snack → dîner ; le goûter ne peut plus apparaître après le dîner selon l’écran.
- Le repas mis en avant sur Aujourd’hui utilise désormais une règle partagée et testée selon l’heure locale.
- Pictogrammes de repas construits en React Native et partagés entre Aujourd’hui, semaine et présence ; retrait des emoji de repas/cuisinier/convives sur ces surfaces principales.
- Les métadonnées de repas sont du texte localisé (cuisinier, personnes, portions), donc cohérentes sur iOS/Android et en RTL.
- Écran Présence allégé : suppression d’un encart explicatif redondant, l’explication utile restant dans le sous-titre/la légende.
- Recettes, Courses et Foyer partagent désormais le même composant d’en-tête, afin de donner une identité plus cohérente à l’application sans charger l’interface.
- Placeholder recette sans photo remplacé par un pictogramme géométrique original au lieu d’un emoji.
- Nettoyage des styles legacy inutilisés du Planning.
- Régressions étendues : ordre des repas et focus horaire sont verrouillés.


## V0.48 — 2026-09-14 — premier contact en un geste
- Aucun nouveau concept métier ni nouvelle table backend.
- L’onboarding n’est plus un mini-tutoriel de trois pages : il présente la promesse complète en un seul écran et se quitte avec un seul CTA.
- `TableMark` devient le motif visuel original des surfaces d’entrée (onboarding, authentification, splash), construit avec des primitives React Native et sans asset tiers.
- La promesse de départ est formulée autour de l’usage réel : aujourd’hui à table, une liste de courses synchronisée et les recettes/décisions du foyer.
- L’écran foyer conserve créer/rejoindre mais retire une carte explicative redondante pour raccourcir l’entrée réelle dans le produit.
- Cette version reste volontairement une version de polish : aucune nouvelle fonction visible n’a été ajoutée.


## V0.49 — 2026-09-14 — états vides et cohérence de marque
- Aucun ajout fonctionnel métier ; priorité au ressenti lors des premiers usages réels.
- `EmptyState` devient le composant commun des surfaces vides de Recettes, Courses, Placard et Activité.
- Bibliothèque de recettes vide et recherche sans résultat sont désormais deux situations distinctes avec un texte adapté.
- Aucun écran principal ne doit donner l’impression d’une impasse lorsqu’il n’existe encore aucune donnée.
- Le nom de marque reste **Notre Table** dans chaque langue ; les traductions comme « Our Table » / « Nuestra Mesa » sont interdites par audit lorsqu’elles désignent le produit.

## V0.50 — 2026-09-14 — planifier un repas sans surcharge
- Aucun nouveau périmètre métier : simplification d’un parcours existant.
- Dans l’éditeur de repas, le geste principal est désormais direct : écrire le repas ou choisir une recette.
- Le sélecteur redondant « repas libre » a été supprimé ; le champ texte remplit déjà ce rôle.
- Cuisinier, convives, invités, portions et note sont regroupés sous « Détails du repas », replié par défaut.
- Le résumé des détails reste visible (nombre de personnes, portions, cuisinier éventuel), donc aucune information importante ne disparaît.
- Les alertes d’allergie/régime restent visibles même lorsque les détails sont repliés.
- « Supprimer ce repas » n’apparaît plus lors de la création d’un nouveau repas ; uniquement lors de la modification d’un repas existant.
- Les libellés principaux du type de repas n’utilisent plus d’emoji décoratifs.
- Audit renforcé pour conserver cette divulgation progressive et éviter le retour du sélecteur redondant.



## V0.51 — 2026-09-14 — courses sans bruit visuel
- Aucun ajout métier : polissage du parcours existant.
- La liste active n’affiche que ce qu’il reste à acheter.
- Les articles cochés sont déplacés dans une section repliée « Déjà pris » ; ils restent réversibles.
- Si tout est coché, un état de fin clair remplace l’impression de liste vide.
- Les outils de courses restent repliés et passent après la liste active.
- L’ajout manuel ne peut pas être déclenché avec un champ vide.
- RTL : ordre de ligne et espacement de la case adaptés.
- Audit V0.51 : 61 fichiers TS/TSX, 0 diagnostic de transpilation, 535 clés i18n alignées, 26/26 régressions.

## V0.53 — 2026-09-14 — Foyer sans surcharge administrative
- Aucun ajout métier : uniquement de la divulgation progressive et du nettoyage visuel.
- La carte Membres montre identité + rôle ; allergies, régimes et aliments détestés restent disponibles dans le profil et servent aux alertes contextuelles, mais ne saturent plus la liste.
- Mon profil est accessible depuis la carte Membres.
- Les réglages appareil/personnels (rappels, langue, apparence, confidentialité) sont repliés par défaut derrière un résumé court.
- Le statut d’abonnement est présenté comme une ligne de compte compacte, non comme une grande carte promotionnelle.
- Activité récente reste repliée par défaut.
- Garde-fous d’audit ajoutés pour préserver cette simplicité.



## V0.54 — 2026-09-14 — consolidation technique avant backend réel
- Aucune nouvelle fonction métier.
- Nouvelle tentative réelle de `npm install` : timeout, puis test direct du registre npm confirmant une absence de résolution DNS dans le runtime. Aucun build n'est donc déclaré validé.
- Matrice Expo SDK 57 recontrôlée sur la documentation officielle ; dépendances patch alignées, notamment `expo ~57.0.17` et `react-native 0.86.3`.
- Expo indique que `expo@57.0.17` passe React Native à 0.86.3 et corrige la régression de démarrage en développement signalée dans SDK 57.
- Nouveau `scripts/environment-preflight.cjs` : Node >=22.13, version app/package et matrice SDK critique.
- `npm run verify` exécute désormais préflight + audit + régressions.
- Audit renforcé : un module externe importé mais absent de `dependencies/devDependencies` fait échouer la validation.
- `npm run validate:installed` est prêt pour : vrai `tsc`, vérifications, puis export Expo Android et iOS.
- Résultat contrôlable dans ce runtime : 61 fichiers TS/TSX, 0 diagnostic de transpilation, 536 clés i18n alignées, 26/26 régressions, 0 référence concurrente runtime.
- Condition permanente : ne pas annoncer un build/bundle natif validé avant exécution réussie de la chaîne installée et d'un vrai build de développement.

## V0.55 — backend readiness
- No new product feature.
- Supabase runtime configuration now fails closed on partial/placeholder/unsafe public settings.
- Initial schema is versioned as a migration; future SQL changes must use new migrations.
- Backend contract audit checks client tables/RLS/policies, RPC privileges, Realtime publication and avatar bucket declaration.
- A read-only remote verification SQL file is ready for the first real Supabase deployment.
- Real Supabase execution and multi-account RLS testing remain pending.

## V0.56 — 2026-09-14 — démarrage résilient
- Aucun ajout fonctionnel visible : consolidation uniquement.
- Le rétablissement de session Supabase est désormais borné dans le temps ; un client réseau bloqué ne peut plus laisser l’app indéfiniment sur le splash.
- Le chargement du foyer dispose d’un état d’échec récupérable avec Réessayer / Se déconnecter au lieu d’une promesse rejetée silencieusement.
- Un écran de récupération partagé est localisé FR/EN/ES/HE.
- Un Error Boundary protège le flux principal contre les erreurs de rendu inattendues afin d’éviter la page blanche.
- La configuration du handler de notifications est isolée du démarrage critique.
- L’audit transpile maintenant `App.tsx` et `index.ts` en plus de `src/**` : 67 fichiers runtime contrôlés.
- Garde-fous ajoutés pour conserver timeouts, états de récupération et accessibilité des actions de reprise.
- Validation : 67 fichiers TS/TSX, 0 diagnostic de transpilation, 544 clés i18n alignées, 30/30 régressions, audit backend PASS.
- Limite inchangée : pas de `node_modules` dans ce runtime, donc vrai `tsc` et exports Expo iOS/Android encore non exécutés.

## V0.57 — 2026-09-14 — stockage local résilient
- Aucune nouvelle fonction produit.
- Toutes les données locales JSON des services passent par une frontière de stockage commune.
- JSON corrompu/ancien : fallback conservateur et suppression de la seule clé illisible ; jamais de purge globale du stockage.
- File hors-ligne des coches de courses validée avant replay.
- Préférences langue/mesure, thème, réactions, rappels, planning, courses, placard, présence et abonnement local durcis à la lecture.
- Audit : interdit désormais `AsyncStorage` et `JSON.parse` directs dans `src/services/**`.
- 34/34 régressions ; backend contract PASS ; préflight PASS.

## V0.58 — 2026-09-14 — réponses réseau périmées bloquées
- Aucune nouvelle fonction produit.
- Planning : un ancien chargement de semaine ne peut plus écraser une semaine plus récente.
- Courses : même protection pour la liste et le responsable de courses.
- Idées de repas et présence du jour protégées contre les réponses arrivant hors ordre.
- Requêtes en vol invalidées au démontage des écrans.
- 38/38 régressions ; audit backend PASS ; préflight PASS.

## V0.65 — 2026-09-14 — session et voie de release durcies
- Aucun ajout produit : consolidation P0 uniquement.
- Les événements Supabase Auth ont priorité sur un ancien `getSession()` encore en vol.
- Un changement réel de compte invalide les anciennes requêtes de foyer ; un simple refresh de token du même utilisateur ne recharge plus inutilement le foyer.
- La déconnexion utilise explicitement `scope: 'local'` pour ne pas déconnecter les autres appareils par défaut.
- Le mode démo est interdit en production ; une configuration backend absente bloque visiblement la build publique au lieu de simuler un fonctionnement.
- `eas.json` définit preview/production sans inventer de projectId Expo.
- Workflow GitHub Actions prêt pour installation réseau + vrai `tsc` + exports Expo.
- Smoke test backend multi-comptes prêt pour invitation, collaboration, isolation RLS et protection du dernier admin.
- Nouvelle migration SQL : un foyer actif ne peut pas perdre son dernier administrateur.
- File hors-ligne des coches de courses rendue explicitement idempotente et couverte par tests.
- Validation locale : 71 fichiers TS/TSX, 0 diagnostic de transpilation, 546 clés i18n, 45/45 régressions, backend/release audits PASS.
- Toujours non revendiqué : vrai `tsc`, exports Expo et build signé tant que les dépendances ne peuvent pas être installées dans un environnement réseau.

## V0.66 — 2026-09-14 — cycle de vie Realtime durci
- Aucun ajout produit.
- Les topics Realtime principaux sont scindés par foyer et contexte (semaine/jour/recette) pour éviter les collisions lors des changements rapides.
- PresenceScreen, RecipeTasteCard et HouseholdDashboard ignorent désormais les réponses asynchrones qui arrivent après changement de contexte ou démontage.
- Les channels sont retirés du client Supabase au cleanup ; l’audit bloque toute régression sur les écrans collaboratifs.
- La lane de release V0.65 reste la base : CI/EAS préparés, production sans mode démo, smoke test backend, dernier admin protégé.

## V0.67 — 2026-09-14 — doubles mutations Courses bloquées
- Aucun ajout produit.
- Check/uncheck : verrou par article pendant la mutation réseau.
- Ajout manuel : une seule soumission en vol.
- File hors-ligne isolée par foyer + semaine + utilisateur authentifié afin d'empêcher un replay sous un autre compte.
- Compaction de file conservée : seul l'état final d'un article est rejoué.
- Audit et régressions couvrent désormais ces invariants.


## V0.68 — 2026-09-14 — invitations durcies avant bêta
- Aucun ajout produit : sécurité/idempotence du parcours d'invitation uniquement.
- Création répétée : le même code actif est renvoyé au lieu de multiplier les invitations.
- Génération 6 caractères via `gen_random_bytes`; unicité contrôlée contre l'historique complet.
- Usage unique et expiration 7 jours conservés.
- UI protège aussi le double tap pendant la création.
- Smoke backend couvre désormais création répétée, rejet d'un code déjà utilisé et rotation après utilisation.


## V0.69 — 2026-09-14 — séparation bêta / monétisation Store
- Aucun ajout produit.
- Preview EAS : accès Famille automatique pour tester tous les parcours sans RevenueCat.
- Production : simulation d'essai local interdite.
- Hook `eas-build-pre-install` bloque une build production tant que le vrai SDK/adaptateur RevenueCat n'est pas intégré.
- Objectif : accélérer la bêta sans risquer de publier un paywall factice.

## V0.70 — 2026-09-14 — reconnexion Courses réellement auto-synchronisée
- Aucun ajout produit : correction P0 de la chaîne hors-ligne → reconnexion → synchronisation.
- Retour réseau détecté par `expo-network`; un premier état joignable après redémarrage peut aussi rejouer une file persistée.
- Replay edge-triggered : pas de boucle sur des événements online répétés.
- File Courses sérialisée pendant le replay pour ne pas perdre une intention concurrente.
- Les intentions encore en attente restent prioritaires visuellement sur une réponse serveur obsolète.
- L’UI ne dit plus « synchronisé » si la file n’est pas vide.
- Fonctions métier toujours gelées ; build installé/EAS et Supabase réel restent à prouver séparément.
- Tentative `npm install` V0.70 : timeout réseau du runtime ; aucune validation installée/native n'est revendiquée.

## V0.71 — 2026-09-14 — smoke Supabase durci et nettoyage fiable
- Aucun ajout produit : validation P1 backend uniquement.
- Le smoke réel teste désormais l’isolation RLS inter-foyers en écriture (insert/update/delete), pas seulement en lecture.
- Il vérifie qu’un membre ne peut pas créer d’invitation admin et qu’un utilisateur externe ne peut pas s’ajouter directement comme membre/admin.
- La collaboration légitime reste testée : le second membre peut cocher un article partagé et son identité est enregistrée.
- Les foyers de test sont supprimés avant les comptes Auth, nécessaire à cause de `households.created_by ... on delete restrict`.
- Les erreurs de nettoyage ne sont plus avalées silencieusement : un smoke qui laisse des données de test échoue explicitement.
- La génération d’un lockfile npm a été tentée mais reste bloquée par l’absence d’accès au registre npm dans ce runtime ; aucune reproductibilité installée n’est revendiquée tant qu’un runner réseau n’a pas généré/validé le lockfile et le build.

## V0.72 — 2026-09-14 — parité migrations/snapshot automatisée
- Aucun ajout produit.
- `backend:audit` ne se contente plus de constater que `schema.sql` diffère de la migration initiale : il vérifie que les objets des migrations ultérieures sont réellement reflétés dans le snapshot.
- Les migrations 002 (dernier admin) et 003 (invitations durcies) sont couvertes par ce contrôle.
- `release:audit` rend visible le dernier blocage de reproductibilité : aucun `package-lock.json` ne peut être généré ici tant que le registre npm est inaccessible.

## V0.73 — 2026-09-14 — dernier admin sans bloquer la suppression du foyer
- Aucun ajout produit.
- Correction du trigger V0.65 : la protection du dernier admin s’applique uniquement tant que le foyer parent existe.
- Une suppression complète du foyer peut maintenant cascader vers `household_members` sans être bloquée.
- Une suppression/démotion directe du dernier admin reste interdite.
- Nouvelle migration additive 004 ; aucune migration déjà destinée à être appliquée n’a été réécrite.
- Le cleanup du smoke Supabase est maintenant cohérent avec les contraintes réelles du schéma.



## V0.74 — 2026-09-14 — preuve backend distante élargie
- Aucun ajout produit.
- Le smoke Supabase exécute les 9 RPC du client et vérifie leurs effets essentiels.
- Storage `profile-avatars` est intégré au smoke RLS (owner / membre du foyer / extérieur).
- Les objets Storage sont inclus dans le cleanup fatal.
- Le smoke destructif exige une cible development/staging et une confirmation explicite.
- Le backend réel n'est toujours pas revendiqué validé avant exécution distante réussie.


## V0.75 — 2026-09-14 — runtime CI/EAS aligné
- Aucun ajout produit.
- EAS preview/production et GitHub Actions utilisent Node 22.16.0.
- La CI passe à `npm ci` dès qu’un lockfile est disponible.
- En l’absence actuelle de lockfile, un runner réseau peut le générer et le publier comme artifact sans prétendre qu’il est déjà commité.
- Les exports Expo issus de la validation installée sont conservés comme artifacts vérifiables.
- Un vrai build EAS signé reste une étape distincte et non revendiquée.


## V0.76 — 2026-09-14 — vérification distante Supabase corrigée
- Aucun ajout produit.
- `verify_backend.sql` ne passe plus `public` comme nom de rôle à `has_function_privilege`.
- PUBLIC est contrôlé dans l’ACL via `aclexplode(...), grantee=0`.
- Le script distant expose aussi RLS/policies, Realtime, Storage avatar et versions de migrations.
- `backend:audit` verrouille cette forme pour éviter une régression avant le premier vrai déploiement Supabase.


## V0.77 — 2026-09-14 — historique migrations distant verrouillé
- Aucun ajout produit.
- Le contrôle de présence des tables est strictement scindé sur le schéma public.
- Toute migration versionnée doit désormais être attendue par `verify_backend.sql`, vérifié automatiquement par `backend:audit`.
- Une future migration ne pourra donc pas être oubliée dans la preuve de déploiement distant.


## V0.78 — 2026-09-14 — compatibilité dépendances Expo dans la preuve installée
- Aucun ajout produit.
- `validate:installed` commence par `expo install --check`.
- La CI force `CI=1` pour transformer toute dépendance SDK incompatible en échec non interactif.
- Cette vérification complète le preflight statique : elle s’exécutera réellement dès qu’un runner réseau aura installé `node_modules`.
- Le build natif/EAS n’est toujours pas revendiqué validé tant que l’installation npm et la build signée n’ont pas réellement réussi.


## V0.79 — 2026-09-14 — CI reproductible fail-closed
- Aucun ajout produit.
- La CI principale refuse désormais l’absence de `package-lock.json` et n’utilise que `npm ci`.
- La génération initiale du lockfile est isolée dans un workflow manuel `workflow_dispatch`.
- Ce bootstrap génère le lockfile, prouve qu’il se réinstalle avec `npm ci`, exécute la validation installée complète puis publie le lockfile comme artifact à relire/commiter.
- Une validation automatique ordinaire ne peut plus être verte sur un graphe npm non figé.


## V0.80 — 2026-09-14 — EAS fail-closed
- Aucun ajout produit.
- Le profil technique `base` a été supprimé car un profil EAS hérité reste lui-même lançable.
- Les seuls profils buildables sont désormais `preview` et `production`, chacun pinne Node 22.16.0 directement.
- Sur un worker EAS, le hook pré-install exige un profil connu, `EXPO_PUBLIC_APP_ENV` cohérent et un Supabase public valide.
- Une clé service-role / `sb_secret_` est rejetée avant installation.
- Production garde le blocage RevenueCat réel en plus des contrôles backend.
- Les scénarios du gate sont exécutés à chaque `npm run verify`.


## V0.81 — 2026-09-14 — preuve Supabase par signature RPC
- Aucun ajout produit.
- La vérification distante associe chacune des 9 RPC à sa signature PostgreSQL exacte via `oidvectortypes(proargtypes)`.
- Une fonction du bon nom avec de mauvais paramètres ne peut plus faire passer la preuve distante.
- Les overloads historiques inattendus sont exposés par une requête dédiée qui doit retourner zéro ligne.
- L’historique distant des migrations retourne désormais une ligne par version attendue avec `applied=true|false`.


## V0.82 — 2026-09-14 — assertions Supabase fail-closed
- Aucun ajout produit.
- `verify_backend.sql` reste le diagnostic lisible ; `assert_backend.sql` devient la preuve distante exécutable.
- Toute absence RLS/policy, Realtime, Storage, RPC exacte/ACL ou migration lève une exception.
- Les 9 RPC doivent chacune exister sous une seule signature attendue et ne jamais être exécutables par PUBLIC.
- Le succès explicite est `NOTRE_TABLE_BACKEND_ASSERTIONS_PASS`.


## V0.83 — 2026-09-14 — repas transactionnel
- Aucun ajout produit ; correction P1 d’intégrité existante.
- Avant V0.83, le slot repas était écrit par RPC puis participants, invités et cuisinier par requêtes séparées.
- La RPC canonique reçoit maintenant ces trois composantes et les écrit dans la même transaction PostgreSQL.
- `NULL` pour participants/invités conserve la sémantique existante (ne pas réécrire ces enfants) ; un tableau vide les efface explicitement.
- Les appartenances cuisinier/participants sont validées avant mutation.
- Migration 005 additive ; l’ancienne signature RPC est supprimée.
- Le smoke distant vérifie état complet et absence de mutation après rejet d’un participant hors foyer.


## V0.84 — 2026-09-14 — invitation concurrente sérialisée
- Aucun ajout produit ; correction P1 de concurrence.
- L’idempotence V0.68 était correcte en séquentiel mais deux requêtes réellement simultanées pouvaient toutes deux observer « aucune invitation active ».
- La RPC verrouille maintenant la ligne `households` avec `FOR UPDATE` avant de rechercher/créer le code.
- Les requêtes concurrentes du même foyer se sérialisent ; la seconde réutilise le code créé par la première.
- Migration 006 additive et smoke réel `Promise.all` exigeant exactement une invitation active.


## V0.85 — 2026-09-14 — consommation invitation concurrente testée
- Aucun ajout produit.
- `join_household_by_code` possédait déjà un verrou `FOR UPDATE` correct sur la ligne invitation.
- Le smoke réel lance maintenant deux consommations simultanées du même code avec deux comptes distincts.
- Il exige exactement un gagnant, un perdant, un `used_by` cohérent et un seul nouveau membre.
- Aucune migration SQL n’était nécessaire pour ce point ; seule la preuve P0 a été renforcée.


## V0.86 — 2026-09-14 — placard/courses sûrs sous concurrence
- Périmètre produit inchangé.
- Migration `202609140007_serialize_stock_and_shopping.sql`.
- Les RPC placard, ajout recette aux courses et reconstruction hebdomadaire sérialisent les mutations par verrou du foyer.
- Le smoke distant vérifie des appels simultanés depuis deux clients et exige un état final unique et quantitativement exact.


## V0.87 — 2026-09-14 — copie de semaine testée sous concurrence
- Périmètre produit inchangé.
- `copy_previous_week` ne nécessite pas de nouvelle migration : l'UPSERT du premier slot commun sérialise déjà les deux transactions concurrentes.
- Le smoke distant lance deux copies simultanées depuis deux membres et exige un seul repas cible.
- Les participants et invités copiés sont vérifiés après concurrence pour exclure un état enfant dupliqué ou partiel.


## V0.88 — 2026-09-14 — changement de compte pendant replay hors-ligne
- Périmètre produit inchangé.
- La file de toggles Shopping reste stockée par utilisateur authentifié.
- Le replay vérifie désormais le propriétaire de session avant chaque mutation distante.
- Une déconnexion ou un changement de compte interrompt le replay et conserve les intentions restantes pour leur propriétaire d'origine.


## V0.89 — 2026-09-14 — clé publique Supabase moderne obligatoire
- Périmètre produit inchangé.
- Les variables publiques du client n'acceptent plus les anciennes clés JWT Supabase.
- Preview/Production exigent une clé `sb_publishable_*`; les clés `sb_secret_*`, `service_role` et JWT legacy sont refusées avant build.
- Le smoke distant exige également une clé publique moderne distincte du secret serveur.

## V0.90 — 2026-09-14 — configuration RevenueCat fail-closed
- Périmètre produit inchangé.
- Production exige désormais les deux clés SDK publiques RevenueCat (`appl_*` et `goog_*`) ainsi qu'un entitlement valide.
- Toute clé secrète RevenueCat `sk_*` est refusée dans la configuration publique mobile.
- Le contrôle existe à la fois dans `runtimeConfig` et dans le gate EAS.
- Le SDK/adapter RevenueCat réel reste volontairement absent tant qu'une installation réseau et un projet RevenueCat réel ne permettent pas de le valider.

## V0.91 — 2026-09-14 — EAS exige un lockfile immuable
- Périmètre produit inchangé.
- Tout build EAS réel exige maintenant un `package-lock.json` commité.
- `EAS_NO_FROZEN_LOCKFILE` est explicitement interdit afin d'empêcher un build non reproductible.
- La CI et EAS appliquent désormais la même règle : pas de preuve installée/build sans graphe npm figé.

## V0.92 — 2026-09-14 — conformité suppression de compte / confidentialité
- Périmètre produit inchangé ; durcissement pré-lancement Store.
- Production exige une API HTTPS de suppression de compte, une ressource web HTTPS de suppression et une politique de confidentialité HTTPS.
- L'écran Données/Confidentialité expose les liens configurés.
- Le service de suppression utilise désormais l'URL validée par `runtimeConfig`, pas une variable d'environnement brute.


## V0.93 — 2026-09-14 — suppression permanente réellement exécutable
- Périmètre produit inchangé ; P0 conformité/intégrité.
- Migration 008 prépare proprement la suppression d’un compte malgré les anciennes FK `RESTRICT` et la protection du dernier admin.
- Foyer solitaire : suppression complète du foyer.
- Foyer partagé : suppression du contenu attribuable au compte, conservation du foyer et promotion déterministe d’un successeur seulement si le compte était le dernier admin.
- `households.created_by` passe à `ON DELETE SET NULL`.
- Edge Function `delete-account` server-side ajoutée ; le secret privilégié ne quitte jamais Supabase.
- Le smoke réel doit maintenant prouver la suppression Auth, Storage et données dans les deux scénarios.
- Aucun déploiement Supabase réel n’a encore été effectué.


## V0.94 — 2026-09-14 — paywall Production piloté uniquement par le Store
- Périmètre produit inchangé.
- Les prix EUR codés localement restent uniquement des références Preview/développement.
- En Production, prix mensuel/annuel, achat et restauration doivent être fournis par l'adaptateur RevenueCat réel.
- Sans Offering localisée, aucun achat ne peut être lancé et aucun prix de référence n'est affiché comme prix Store.
- Le gate EAS inspecte l'adaptateur RevenueCat et refuse les stubs/placeholder files.
- Le vrai SDK n'est toujours pas ajouté tant que npm et les comptes Store/RevenueCat réels ne sont pas disponibles.


## V0.95 — 2026-09-14 — suppression de compte et abonnement Store
- Périmètre produit inchangé ; conformité suppression/billing.
- La suppression du compte avertit qu'un abonnement Apple/Google n'est pas annulé automatiquement et propose le lien de gestion du Store.
- L'Edge Function sait effacer le client RevenueCat via une clé serveur uniquement lorsque `REVENUECAT_CUSTOMER_DELETION_ENABLED=true`.
- Si RevenueCat est activé mais que sa clé serveur manque ou que l'API échoue, aucune suppression locale destructive n'est commencée.
- Les réponses 200 et 404 RevenueCat sont retry-safe et considérées comme état « client absent ».
- Le smoke distant peut exiger l'effacement RevenueCat avec `EXPECT_REVENUECAT_DELETION=true`.
- Le futur adaptateur mobile RevenueCat doit utiliser l'identifiant Auth Supabase comme App User ID.


## V0.96 — 2026-09-14 — notifications collaboratives non simulées
- Périmètre produit inchangé.
- Les switches de push planning/courses étaient uniquement des préférences locales sans token push ni envoi serveur.
- Ils sont maintenant visibles comme indisponibles dans la première bêta et persistés à `false`.
- Les rappels locaux dîner/week-end restent actifs et continuent d'utiliser `expo-notifications` sur l'appareil.
- Aucun backend push fictif n'est ajouté pour contourner le gel fonctionnel.


## V0.97 — 2026-09-14 — frontière unique pour les variables publiques
- Périmètre produit inchangé ; P0 confidentialité.
- L'import photo OCR n'accède plus directement à `process.env.EXPO_PUBLIC_RECIPE_OCR_ENDPOINT`.
- L'URL OCR doit passer par `runtimeConfig`, qui n'expose que les endpoints HTTPS valides.
- Un audit interdit désormais toute lecture directe `EXPO_PUBLIC_*` ailleurs dans le runtime mobile.
- Une configuration OCR invalide laisse la fonction indisponible et n'envoie aucune image.


## V0.98 — 2026-09-14 — timeouts réseau bornés
- Périmètre produit inchangé.
- Import URL : timeout 15 s.
- OCR photo : timeout 20 s.
- Effacement RevenueCat server-side : timeout 10 s avant mutations locales.
- Les appels externes d'import ne peuvent plus rester suspendus indéfiniment.


## V0.99 — 2026-09-14 — identité RevenueCat et entitlement fail-closed
- Périmètre produit inchangé.
- Une build Production ne peut plus faire confiance à un état Famille/essai stocké localement ; sans CustomerInfo RevenueCat réel, l'accès démarre `free`.
- Le futur adaptateur réel doit utiliser le UUID Auth Supabase comme App User ID et gérer le changement de compte avec `Purchases.logIn`.
- `Purchases.logOut` est exigé pour le chemin de suppression définitive afin d'éviter la recréation du client effacé ; il ne doit pas être utilisé comme étape intermédiaire lors d'un simple changement de compte identifié.
- Le gate Production exige désormais la preuve du câblage de bout en bout : CustomerInfo -> état d'accès et Offerings localisées -> tous les paywalls.
- Aucun billing RevenueCat réel n'est revendiqué tant que le SDK, le projet RevenueCat et les stores ne sont pas effectivement connectés.


## V0.100 — 2026-09-14 — cycle d'identité RevenueCat prouvé aux call-sites
- Périmètre produit inchangé.
- Le gate ne se contente plus de chercher `logIn/logOut` dans l'adaptateur.
- `App.tsx` devra réellement synchroniser l'UUID Supabase vers RevenueCat à chaque session authentifiée/changement de compte.
- Le service de suppression devra réellement nettoyer l'identité RevenueCat SDK après le flux de suppression permanente.
- `MainScreen` devra réellement recevoir CustomerInfo/Offerings RevenueCat et propager l'Offering localisée aux paywalls planning, recettes et foyer.
- Production reste fail-closed tant que ces call-sites n'existent pas avec le vrai SDK installé.


## V0.101 — 2026-09-14 — auth email native complète pour la bêta
- Périmètre métier inchangé ; P1 accès/support.
- Les emails de confirmation d'inscription et de récupération reviennent désormais vers l'app via le schéma `notretable`.
- Le client traite explicitement les tokens implicites, le code PKCE et le token hash lorsque Supabase les renvoie.
- Un utilisateur peut demander un reset sans révéler si l'adresse existe puis définir son nouveau mot de passe dans l'app.
- Le vrai Supabase devra autoriser `notretable://**`; les deux parcours devront être testés sur appareil réel.
- Un SMTP de production reste une frontière externe avant lancement public.


## V0.102 — test-fixture integrity

- Removed leaked fake RevenueCat adapter/dependency from the working tree.
- Gate tests now unwind through `finally` and verify restoration byte-for-byte.
- V0.102 supersedes V0.99–V0.101 as the trusted source checkpoint.
- Real RevenueCat integration is still absent by design; Production remains fail-closed.


## V0.103 — 2026-09-15 — entitlement RevenueCat partagé au niveau du foyer

- Le modèle commercial 4,99 €/mois est traité comme un abonnement **par foyer**, pas par membre.
- Nouvelle table `public.household_access` protégée par RLS : lecture par les membres du foyer, aucune écriture par les clients mobiles.
- Nouvelle Edge Function `sync-household-access` : vérifie l'entitlement RevenueCat du payeur et synchronise le statut du foyer côté serveur.
- L'UUID Auth Supabase reste l'App User ID RevenueCat du payeur ; Supabase devient la vérité d'accès partagée par tous les membres.
- Production ne consulte jamais le cache local pour décider `family`.
- Une panne RevenueCat conserve la dernière vérité serveur connue au lieu de rétrograder immédiatement.
- Suppression du payeur : identité RevenueCat détachée du foyer ; période déjà vérifiée conservée uniquement jusqu'à l'échéance connue.
- Smoke backend étendu pour prouver lecture partagée, isolation, interdiction d'écriture et continuité après suppression du payeur.
- Migration courante : `202609140009_household_subscription_access.sql`.
- Validation locale : `80/80` régressions, `16/16` gate EAS, audits backend/release PASS.
- Toujours non prouvé : Supabase réel, RevenueCat réel, npm installé/lockfile, export Expo, build EAS et appareils réels.


## V0.108 — 2026-09-15 — enforcement Premium serveur et collaboration après expiration

- Ajout des migrations additives `202609140010_server_premium_enforcement.sql` et `202609140011_family_collaboration_write_guard.sql`.
- `app_release_settings.premium_enforcement` est une vérité backend server-only : aucun rôle mobile ne peut la lire ou la modifier.
- En enforcement actif, les fonctions Famille et les limites Free sont imposées côté serveur, pas seulement par l’UI.
- Après expiration Famille : lecture partagée conservée ; membres non-admin en lecture seule ; admin conserve les écritures de base Free ; réactivation Famille restaure les écritures des membres.
- Les refus Premium sont classifiés côté client et rechargent la vérité d’accès du foyer avant d’ouvrir le paywall.
- Le statut d’accès est protégé par request-gate contre une réponse asynchrone d’un ancien foyer.
- `verify_backend.sql` et `assert_backend.sql` vérifient désormais migrations 010/011, table de réglage server-only et helpers Premium.
- Le smoke réel couvre le cycle downgrade/réactivation et sait exiger `EXPECT_PREMIUM_ENFORCEMENT=true` pour un staging production-like.
- Validation locale : 87/87 régressions, 16/16 gate EAS, 78 TS/TSX transpilés, audits backend/release PASS.
- Restent externes/non prouvés : migrations appliquées sur Supabase réel, RevenueCat/Stores, npm lockfile et `npm ci`, vrai `tsc`, exports Expo, EAS et deux appareils.


## V0.109 — 2026-09-15 — mutations RLS silencieuses et Premium actionnable

- Ajout du garde client `can_write_household(uuid)` : il ne s’exécute qu’après une mutation ambiguë/échouée, pas sur le chemin réseau normal.
- Les suppressions/mises à jour directes ne confondent plus « zéro ligne modifiée » avec une réussite.
- Planning, courses, garde-manger, présences, responsabilité des courses et réactions recettes remontent un refus `FAMILY_PLAN_REQUIRED` vers l’accès Famille.
- La file courses hors-ligne conserve les intentions réseau mais arrête proprement un replay refusé par l’enforcement Premium.
- Contrat backend courant : 18 tables client, 10 RPC client, 6 tables Realtime.
- Validation locale : 92/92 régressions, 16/16 gate EAS, 79 TS/TSX transpilés, audits backend/release PASS.
- Frontières externes inchangées : vrai Supabase/RevenueCat/Stores, npm lockfile + `npm ci`, vrai typecheck/export Expo, EAS et appareils réels.


## V0.110 — 2026-09-15 — dernier trou RLS sur les idées familiales

- Périmètre produit inchangé.
- Les idées/votes de repas, déjà réservés à Famille côté RLS, utilisent désormais le même garde `householdWriteGuard` que les autres mutations collaboratives.
- La suppression d’un vote qui affecte zéro ligne vérifie `can_write_household` avant de conclure au succès ; une expiration Famille remonte donc `FAMILY_PLAN_REQUIRED`.
- Les insertions/upserts d’idées/votes reclassifient aussi les refus Premium vers le paywall au lieu d’une erreur générique.
- Validation locale : 93/93 régressions, 16/16 gate EAS, 79 TS/TSX transpilés sans erreur, audits backend/release PASS.
- Contrat backend inchangé : 18 tables client, 10 RPC client, 6 tables Realtime.
- Frontières externes inchangées : Supabase/RevenueCat/Stores réels, npm lockfile + `npm ci`, vrai `tsc`, exports Expo, EAS et appareils réels.

## V0.111 — 2026-09-15 — fondation « membres légers sans installation »

- Première évolution produit post-V0.110, sans réécrire les fonctions historiques.
- Migration additive `202609150012_light_members_response_foundation.sql` : membres légers prénom+téléphone, questions par repas, options « Envie ? » choisies par l’organisateur, réponses et tokens opaques à usage unique.
- Le secret de réponse fait 256 bits ; seul son SHA-256 est stocké. Aucun rôle mobile ne peut lire les hashes.
- Page Edge `light-response` sans compte ni installation ; token porté dans le fragment URL, supprimé immédiatement de l’historique, `no-referrer` + `no-store` + CSP.
- Présence seule = 1 clic ; envie normale + présence = 2 clics ; « Surprends-moi » = Oui en 1 clic ; « Je prends les choses en main » = 1 clic et aucune question supplémentaire.
- Prise en main concurrente sérialisée : une seule personne gagne ; les autres voient uniquement son nom + le message de prise en charge.
- Synthèse serveur admin : compte Oui/Non/Peut-être/prise en main et envies.
- Téléphone visible uniquement à l’admin du foyer ; le contexte public ne renvoie ni téléphone ni UUID interne.
- L’UX précise qui rend l’ajout prénom+téléphone difficile à ignorer pendant l’onboarding reste volontairement à finaliser ; V0.111 ne la devine pas et ne casse pas le démarrage existant.
- Validation locale : 101/101 régressions, 16/16 gate EAS, 80 TS/TSX transpilés sans erreur, audits backend/release PASS.
- Contrat natif existant inchangé : 18 tables client / 10 RPC client / 6 Realtime ; extension membre léger : +4 tables / +6 RPC (4 organisateur, 2 server-only) / +1 publication Realtime.
- Toujours non prouvé : Supabase réel + déploiement Edge, npm lockfile/`npm ci`, vrai `tsc`, exports Expo, RevenueCat/Stores, EAS et multi-téléphones.

## V0.112 — 2026-09-15 — organisateur natif pour les membres légers

- V0.111 reste la fondation sécurisée ; V0.112 branche cette fondation dans l’app de l’organisateur.
- Depuis un repas du Planning, l’admin peut ouvrir « Demander à la famille ».
- Ajout, modification, désactivation et réactivation des membres légers ; pas de suppression dure depuis l’UI afin de préserver l’historique.
- L’organisateur sélectionne les seules options « Envie ? » réellement proposées pour le repas.
- Si des réponses existent et que les choix changent, une confirmation explicite avertit que les réponses seront réinitialisées par le contrat V0.111.
- Partage bêta via la feuille de partage native uniquement ; pas d’automatisation SMS/WhatsApp ajoutée.
- Synthèse serveur et rafraîchissement Realtime exposés dans l’écran organisateur.
- Migration 013 ajoute `update_light_member`; l’enforcement admin + Family reste serveur.
- L’onboarding initial prénom+téléphone n’est toujours pas inventé : son UX exacte reste à finaliser séparément.
- Validation locale : 101/101 régressions, 16/16 gate EAS, 82 TS/TSX transpilés sans erreur, audits backend/release PASS ; contrat audit : 20 tables client / 15 RPC / 7 Realtime ; migrations 001 → 013.
- Toujours non prouvé : Supabase réel + Edge Function, npm lockfile/`npm ci`, vrai `tsc`, exports Expo, RevenueCat/Stores, EAS et multi-appareils.


## V0.113 — 2026-09-15 — release proof du parcours membre léger

- Aucun nouveau besoin produit : V0.113 durcit la validation distante de V0.112.
- `backend:live-smoke` exige désormais la vraie Edge Function `light-response` déployée.
- Le smoke vérifie la page publique + en-têtes de sécurité, le contexte sans données sensibles, la soumission, l’anti-rejeu et la concurrence « Je prends les choses en main » via HTTP.
- La release lane et le verdict smoke sont alignés sur **15/15 RPC client**.
- Le blocage npm local reste externe : aucun lockfile ni build installé n’est prétendu.


## V0.114 — 2026-09-15 — reproductibilité CI et preuve de provenance

- Aucun changement produit.
- `package.json` déclare Node 22.16.x, npm 10.9.x et `packageManager: npm@10.9.2`; le preflight exige le runtime release exact.
- Les actions GitHub officielles utilisées par les workflows sont épinglées sur des SHA immuables vérifiés.
- Les workflows utilisent `permissions: contents: read` et `persist-credentials: false`.
- `.validation/` est ignoré par Git.
- `release:evidence` génère un manifest SHA-256 couvrant la configuration release, les workflows, le schéma Supabase, toutes les migrations, toutes les Edge Functions et les scripts de validation.
- Validation locale : 110/110 régressions, 16/16 gate EAS, 82 TS/TSX transpilés, audits backend/release PASS.
- Limites externes inchangées : registre npm inaccessible, pas de Supabase/Deno/Docker locaux, aucun dépôt accessible via le connecteur GitHub courant, pas de RevenueCat/EAS/appareils réels.


## V0.115 — release doctor / blocages externes observables
- Aucun changement produit.
- Nouveau `npm run release:doctor` : diagnostic versionné des étapes installed validation, Supabase, EAS preview et production billing.
- Le rapport `.validation/release-doctor.json` n'imprime jamais les valeurs de secrets, seulement leur présence/format sûr.
- Mode `release:doctor:strict` disponible pour faire échouer un runner si un blocage persiste.
- Le diagnostic ne remplace aucune preuve réelle : il indique ce qui manque avant de lancer la vraie étape.


## V0.116 — preuve bêta deux appareils
- Aucun changement produit.
- Protocole réel `docs/BETA_ACCEPTANCE.md` avec 16 scénarios obligatoires.
- `beta:acceptance:audit` refuse toute acceptation sans version/build/source, au moins deux appareils physiques et 16/16 scénarios `pass` avec référence de preuve.
- Exemple volontairement `pending` : aucune bêta réelle n'est prétendue tant que le fichier d'évidence n'est pas rempli après un vrai build.

## V0.117 — 2026-09-15 — continuité de checkpoint vérifiée
- Aucun changement produit.
- Ajout de `continuity:audit` dans `verify` pour empêcher toute dérive entre package/app/README/PROJECT_STATE/VERIFICATION/audit courant.
- Le README remet les checkpoints V0.114 à V0.117 au sommet afin qu'une reprise ne saute plus silencieusement vers V0.113.
- Les limites externes restent inchangées : lockfile/npm CI réel, Supabase/Edge réels, EAS/RevenueCat/Stores et appareils physiques.

## V0.118 — 2026-09-15 — hygiène du checkpoint source
- Aucun changement produit.
- Ajout de `source:hygiene:audit` dans `verify`.
- Le checkpoint refuse les fichiers d’environnement réels, credentials/service-account, clés privées/certificats/signatures mobiles et archives/logs temporaires.
- Les règles critiques `.gitignore` sont désormais auditées automatiquement.
- Un scan de motifs secrets à haut risque complète le contrôle sans nécessiter le réseau.
- Le manifest de release couvre désormais tout le runtime mobile (`App.tsx`, `index.ts`, `src/`, `languages/`) en plus du backend et des scripts.
- Validation locale V0.118 : 125/125 régressions, 16/16 gates EAS, 82 TS/TSX, audits continuité/hygiène/backend/release PASS ; 228 fichiers couverts par le manifest.


## V0.119 — 2026-09-15 — privacy native et assets Production fail-closed
- Aucun changement produit.
- Android bloque explicitement `android.permission.RECORD_AUDIO`.
- Le release doctor contrôle ce blocage et signale l’absence d’assets de marque Production.
- Le gate EAS Production refusera une release tant que l’icône locale/versionnée et l’adaptive icon Android ne sont pas fournis.
- Preview/local restent autorisés afin de ne pas inventer les assets avant décision de marque.
- Validation locale V0.119 : 127/127 régressions, 17/17 gates EAS, 82 TS/TSX, audits continuité/hygiène/backend/release PASS ; 229 fichiers couverts par le manifest.


## V0.120 — 2026-09-15 — thème système Android correctement câblé
- Aucun changement produit.
- Ajout de `expo-system-ui ~57.0.4` et de son plugin CNG car `userInterfaceStyle: automatic` l’exige sur Android.
- Preflight et audit projet verrouillent cette exigence.
- Installation réelle toujours non prouvée tant que npm/lockfile ne sont pas disponibles.
- Validation locale V0.120 : 128/128 régressions, 17/17 gates EAS, 82 TS/TSX, audits continuité/hygiène/backend/release PASS ; 231 fichiers contrôlés par l’hygiène source et 230 fichiers couverts par le manifest de provenance.


## V0.121 — 2026-09-15 — canal Android des rappels locaux
- Aucun changement produit.
- Le canal Android des rappels est créé avant la demande de permission et les triggers locaux utilisent explicitement ce canal.
- Le nom du canal suit la langue active ; son et vibration restent désactivés.
- Le but est de rendre la demande de permission Android 13+ fiable sans activer de push collaboratif.
- Validation locale V0.121 : 131/131 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS ; 232 fichiers contrôlés par l’hygiène source.


## V0.122 — 2026-09-15 — statut de permission notifications iOS
- Aucun changement produit.
- Le service de rappels ne se base plus uniquement sur le booléen générique sous iOS : il accepte explicitement AUTHORIZED/PROVISIONAL/EPHEMERAL.
- Android conserve son comportement V0.121 avec canal créé avant permission.
- Validation locale V0.122 : 132/132 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.123 — 2026-09-15 — permission iOS minimale pour les rappels
- Aucun changement produit.
- La demande iOS des rappels locaux n’inclut plus son ni badge : alertes uniquement.
- Android reste inchangé.
- Validation locale V0.123 : 133/133 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.124 — 2026-09-15 — export compliance iOS explicite
- Aucun changement produit.
- `ios.config.usesNonExemptEncryption=false` est déclaré pour la configuration mobile actuelle.
- Le release doctor et l’audit release vérifient ce contrat.
- Validation locale V0.124 : 134/134 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.125 — 2026-09-15 — portée iPad explicitement suivie
- Aucun changement produit.
- `supportsTablet: true` est conservé.
- Le release doctor exige une validation manuelle sur iPad physique avant de considérer la portée Store complète.
- Preview et bêta téléphone ne sont pas bloquées par cette obligation iPad.
- Validation locale V0.125 : 135/135 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.

## V0.126 — 2026-09-15 — zones sûres Android/iOS modernes
- Aucun changement produit.
- Migration de tous les `SafeAreaView` legacy vers `react-native-safe-area-context ~5.7.0`.
- Ajout d’un `SafeAreaProvider` racine et d’un garde permanent contre les imports legacy.
- Validation locale V0.126 : 136/136 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.

## V0.127 — 2026-09-15 — rafraîchissement de la langue système Android
- Aucun changement produit.
- `LocaleContext` relit les préférences natives au retour de l’app au premier plan.
- Le cas Android « langue système modifiée pendant que l’app est en arrière-plan » n’est plus figé jusqu’au prochain lancement.
- Validation locale V0.127 : 137/137 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.

## V0.128 — 2026-09-15 — accessibilité des textes cliquables
- Aucun changement visuel.
- Les 18 commandes `Text.onPress` existantes exposent le rôle natif `button`.
- Un garde statique empêche l’introduction d’un nouveau texte cliquable sans rôle.
- Validation locale V0.128 : 138/138 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.



## V0.129 — 2026-09-15 — sémantique native des Pressable
- Aucun changement produit/visuel.
- 111 rôles `button` ajoutés ; 1 backdrop invisible exclu de l’arbre d’accessibilité.
- Tous les 117 `Pressable` sont audités par régression.
- Validation locale : 139/139 régressions, 17/17 gates EAS, 82 TS/TSX ; audits PASS.


## V0.130 — 2026-09-15 — état disabled accessible
- 30 `Pressable` désactivables exposent `accessibilityState.disabled`.
- Aucun changement de logique/visuel.
- Validation locale : 140/140 régressions, 17/17 gates EAS, 82 TS/TSX ; audits PASS.


## V0.131 — 2026-09-15 — états selected accessibles
- Les choix persistants annoncent désormais `accessibilityState.selected`.
- Les simples cartes de navigation restent non sélectionnables.
- Validation locale : 141/141 régressions, 17/17 gates EAS, 82 TS/TSX ; audits PASS.


## V0.132 — 2026-09-15 — libellés accessibles des champs
- Aucun changement produit/visuel.
- Les 24 `TextInput` du runtime ont un `accessibilityLabel` stable.
- `auth.email` est traduit en FR/EN/ES/HE et remplace le libellé e-mail anglais codé en dur.
- Un garde statique bloque tout nouveau champ non labellisé.
- Validation locale : 142/142 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.133 — 2026-09-15 — états expanded accessibles
- 3 contrôles de disclosure exposent `accessibilityState.expanded`.
- Aucun changement produit/visuel.
- Validation locale : 143/143 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.138 — 2026-09-15 — Switch notifications explicitement labellisé
- Aucun changement produit/visuel.
- Le `Switch` des préférences de notifications reçoit `accessibilityLabel={title}` et `accessibilityHint={subtitle}`.
- Sa sémantique native de contrôle booléen reste intacte.
- Validation locale V0.138 : 148/148 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.139 — 2026-09-15 — états busy accessibles
- Aucun changement produit/visuel.
- 10 actions asynchrones visibles annoncent désormais `accessibilityState.busy`.
- Les états disabled/selected/checked/expanded existants restent inchangés.
- Validation locale V0.139 : 149/149 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.140 — 2026-09-15 — annonces accessibles des statuts dynamiques
- Aucun changement produit/visuel.
- 8 erreurs dynamiques sont des alertes assertives ; 5 messages de succès/statut sont des live regions polies.
- Validation locale V0.140 : 150/150 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.141 — 2026-09-15 — saisie robuste des identifiants sensibles
- Aucun changement produit/visuel/backend.
- E-mail : `autoCapitalize="none"` + `autoCorrect={false}`.
- Mots de passe : `autoCapitalize="none"` + `autoCorrect={false}` sur connexion/inscription/récupération/confirmation.
- Code foyer : normalisation client explicite en majuscules + `autoCorrect={false}` ; le backend conserve sa normalisation existante.
- Validation locale V0.141 : 151/151 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.142 — 2026-09-15 — chargements autonomes accessibles
- 14 loaders autonomes exposent `progressbar` + libellé localisé.
- Les spinners imbriqués dans des boutons busy ne sont pas doublés.
- Validation locale V0.142 : 152/152 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.143 — 2026-09-15 — couverture complète des erreurs dynamiques accessibles
- 7 surfaces d’erreur restantes deviennent des alertes assertives.
- Total runtime attendu : 15 alertes assertives, 5 annonces polies.
- Validation locale V0.143 : 153/153 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.


## V0.144 — 2026-09-15 — résilience de programmation des rappels
- `NotificationSettingsScreen.save` capture désormais les échecs de stockage/permissions/programmation native.
- Une erreur localisée remplace les rejets asynchrones non gérés.
- Validation locale V0.144 : 154/154 régressions, 17/17 gates EAS, 82 TS/TSX ; audits continuité/hygiène/backend/release PASS.
