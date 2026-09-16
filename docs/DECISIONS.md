# Décisions techniques — Notre Table

## 2026-09-13 — V0.3

- React Native + Expo pour iOS/Android et test rapide.
- Expo SDK 57 cible React Native 0.86 et iOS 16.4+ : le cahier des charges « iOS 15+ » doit donc être révisé si l'on reste sur le SDK courant.
- Supabase pour PostgreSQL, Auth, Realtime, Storage et RLS.
- Session Supabase persistée via AsyncStorage selon le quickstart Auth React Native.
- La liste de courses a un cache local et une file de mises à jour de coches pour tolérer une coupure réseau au supermarché.
- Un utilisateur appartient à un seul foyer (index unique).
- Les invitations utilisent un code 6 caractères, valable 7 jours et consommé une seule fois.
- Les fonctions critiques foyer/invitation/génération courses passent par des RPC transactionnelles côté base.
- Le mode démo reste disponible avant branchement des identifiants Supabase.

## 2026-09-13 — V0.24 — Architecture internationale
- Les données partagées d’un foyer doivent rester indépendantes de la langue d’interface de chaque membre.
- Codes internes canoniques pour difficultés, rayons, unités, régimes et ingrédients ; traduction seulement à l’affichage.
- Le contenu saisi/importé par l’utilisateur reste dans sa langue originale ; une future traduction ne doit jamais écraser l’original.
- Le premier jour de semaine suit `Calendar.firstWeekday` (Expo : dimanche=1 … samedi=7) au lieu d’imposer lundi.
- Les prix localisés d’abonnement doivent venir d’Apple/Google via RevenueCat ; pas de conversion FX artisanale.
- La protection PI est une exigence produit : partir du problème utilisateur, documenter le benchmark, concevoir une solution Notre Table indépendante.

## 2026-09-13 — V0.25 — International identity and independent design
- `Notre Table` is one global product name. Never translate the brand in runtime UI; translate surrounding copy only.
- Recipe translation is a derived/cache layer. The original recipe remains authoritative and immutable by translation.
- Cross-language ingredient matching uses language-neutral `ingredient_key`; localized labels are display concerns.
- Unknown ingredient/user content must fall back to original wording rather than being guessed or silently rewritten.
- Local notifications are generated from the member's locale at scheduling time.
- Runtime source must stay competitor-brand-free; competitor research belongs in documentation only and is checked automatically by `npm run audit`.
- Maintain a dated originality log to evidence independent product decisions and avoid accidental clone-by-reference behavior.


## 2026-09-13 — V0.32 — anti-gaspillage
- Un repas de restes est un créneau de planning de premier rang (`meal_mode='leftover'`), pas une fausse recette.
- Le repas source doit appartenir au même foyer et être antérieur au créneau cible.
- Un créneau de restes ne porte pas de `recipe_id`; le générateur de courses ne rachète donc pas automatiquement ses ingrédients.
- Le titre partagé conserve le nom du repas source sans préfixe localisé ; « Restes / Leftovers / Sobras / שאריות » est ajouté uniquement à l’affichage selon la langue du membre.

## 2026-09-13 — V0.37 — usage quotidien
- L’application doit privilégier une action quotidienne simple (« aujourd’hui ») tout en conservant le planning hebdomadaire comme outil d’anticipation.
- La présence reste volontairement une donnée du jour ; le tableau quotidien ne doit pas pousser la famille à déclarer des absences futures.
- Les raccourcis quotidiens réutilisent les mêmes données de planning et de présence : pas de second modèle ni de duplication métier.
- Les numéros de version Expo et package doivent rester identiques, vérifiés par `npm run audit`.


## 2026-09-13 — V0.40 — fraîcheur du placard
- Une date limite est une information facultative saisie par le foyer, jamais une conclusion automatique sur la sécurité alimentaire.
- L’UI « à utiliser bientôt » signifie priorité anti-gaspillage, pas recommandation médicale ni garantie de comestibilité.
- Le seuil produit est simple et explicable : date dépassée ou dans les 3 prochains jours.
- Pour un même ingrédient + unité, le modèle conserve la date connue la plus proche lors d’un ajout fusionné, afin de ne pas masquer le lot à utiliser en premier.


## 2026-09-13 — V0.42 — mémoire des goûts
- Le goût est une préférence individuelle du membre, pas une note publique de la recette.
- Les trois codes canoniques sont `again`, `ok`, `skip`; leur wording est localisé par membre.
- Aucun algorithme ne remplace la décision familiale : la synthèse informe le planning, elle ne choisit pas le repas automatiquement.
- Un membre peut lire les réactions du foyer mais ne peut écrire ou supprimer que la sienne.
- Les données de réaction font partie de l’export portable personnel.


## 2026-09-13 — V0.44 — simplicité contextuelle
- Une capacité secondaire ne mérite pas nécessairement une présence permanente à l’écran.
- L’écran principal doit privilégier l’action la plus fréquente ; import, filtres avancés, exports, placard et outils occasionnels sont révélés à la demande.
- Les informations positives sans action (« tout va bien », « tout le monde est présent », « répartition équilibrée ») ne doivent pas occuper d’espace permanent lorsqu’un état compact ou l’absence d’alerte suffit.
- Les garde-fous d’audit peuvent protéger des décisions UX structurantes au même titre que les invariants techniques.


## 2026-09-13 — V0.45 — hiérarchie « aujourd’hui avant semaine »
- L’écran d’ouverture doit répondre d’abord à une question concrète : « qu’est-ce qu’on mange maintenant / au prochain repas ? ».
- Le planning hebdomadaire reste un outil important, mais il ne doit pas monopoliser l’écran utilisé tous les jours.
- Les fonctions secondaires doivent apparaître au moment du besoin : « Décider ensemble » lorsque le repas n’est pas encore décidé, charge cuisine lorsque la semaine est ouverte, présence et courses comme raccourcis quotidiens.
- Aucun nouveau stockage ou concept métier n’est créé pour l’accueil ; l’interface compose uniquement les données existantes.


## 2026-09-14 — V0.48 — premier contact
- L’onboarding doit expliquer la valeur, pas enseigner toute l’application. Un seul écran et un seul CTA suffisent avant la vraie utilisation.
- Les fonctionnalités secondaires ne doivent pas être vendues dès le premier lancement ; la promesse initiale reste limitée à Aujourd’hui, Courses et Recettes/Décision familiale.
- L’identité d’entrée utilise une géométrie originale et indépendante des bibliothèques d’icônes tierces pour rester cohérente avec la stratégie PI.
