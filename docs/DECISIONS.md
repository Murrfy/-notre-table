## V0.184 — les nouvelles fonctions ne peuvent pas avancer sans couverture d’acceptation
- 53 scénarios couvrent les surfaces Commander/LIA déjà décidées.
- Les invariants critiques sont distingués des contrôles secondaires.
- La matrice est un contrat de test, pas une preuve appareil.
- Aucun comportement utilisateur n’est modifié.

## V0.183 — localisation précise facultative et consentement explicite
- Refuser la localisation précise ne bloque jamais Commander si une adresse foyer/manuelle existe.
- Aucune localisation courante n’est utilisée sans consentement explicite.
- Analytics et personnalisation publicitaire échouent fermés sans consentement.
- Aucun historique de déplacement n’est créé.

## V0.182 — la mesure produit ne peut pas aspirer les confidences
- La télémétrie est désactivée sans provider explicite.
- Seuls des événements Commander commerciaux et une petite allowlist de métadonnées sont autorisés.
- Aucun contenu de conversation, Mémo ou donnée sensible n’est accepté.
- Les impressions sponsorisées exigent une vraie preuve de visibilité avant d’être comptées.

## V0.181 — Commander ne transforme jamais une absence de réseau en vérité commerciale
- Sans adresse active, aucune recherche n’est lancée.
- Hors ligne, aucune disponibilité restaurant ou livraison n’est présentée comme actuelle.
- Le retour réseau déclenche une nouvelle vérification.
- Cette résilience ne change aucune règle de rayon, livraison, Favoris, Mémos ou sponsorisation.

## V0.180 — ouvrir le contexte d’un Mémo reste une action explicite
- Un lien de Mémo ne déclenche jamais de navigation automatiquement.
- Les destinations réutilisent exclusivement les surfaces existantes de Notre Table.
- Les liens `other` restent informatifs.

## V0.179 — un Mémo peut pointer vers son contexte sans devenir une mémoire automatique
- Le lien d’un Mémo est facultatif et structuré ; il sert uniquement à retrouver ce que la proposition/conclusion concernait.
- Aucun transcript de conversation, confidence ou donnée publicitaire n’est stocké dans ce lien.
- Le lien ne déclenche aucune action automatiquement.
- La séparation **Favori ≠ Mémo** reste inchangée.

## V0.174 — la proximité est informative, jamais une preuve de livraison
- `distanceKm` peut être affiché lorsqu’il vient d’une source calculable.
- « À moins de 3 km » utilise exclusivement une vraie distance <= 3.
- La distance n’influence jamais le statut `delivery` à elle seule.

## V0.173 — proche ne veut jamais dire « livre ici »
- La vérification de livraison est un provider séparé de la découverte restaurant et du sponsorisé.
- Elle enrichit seulement des lieux déjà découverts.
- `unavailable` retire le lieu pour l’adresse active.
- Panne/absence de provider conserve l’état précédent et ne fabrique jamais `confirmed`.
- Les données de commande vérifiées peuvent inclure ETA, frais, minimum et URL.

## V0.172 — Commander sépare organique et sponsorisé
- Le classement naturel de Commander ne peut jamais dépendre d’un paiement.
- Les établissements organiques et les contenus sponsorisés utilisent deux frontières provider distinctes.
- Aucun contenu sponsorisé n’apparaît si aucun provider commercial vérifié n’est explicitement branché.
- Toute carte sponsorisée reste clairement étiquetée `Sponsorisé` et reste séparée de la logique naturelle.
- Cette séparation est additive et ne modifie aucune règle existante de rayon, livraison, favoris, Mémos ou LIA.

## V0.171 — Favoris restaurants restent séparés des Mémos
- Un Favori Commander signifie seulement « j’aime / je veux retrouver ce restaurant ».
- Un Favori ne crée jamais automatiquement un Mémo et un Mémo ne crée jamais automatiquement un Favori.
- Les favoris sont privés à l’utilisateur et ne doivent pas devenir un signal publicitaire sensible.
- L’ajout est purement additif à Commander et ne change aucune règle existante de LIA, du foyer ou des repas.


## V0.170 — l’adresse active Commander peut être temporaire
- L’adresse enregistrée du foyer reste la valeur par défaut.
- Une adresse saisie dans Commander vaut seulement pour la session courante, sauf future action explicite de sauvegarde décidée séparément.
- L’application explique cette différence et ne persiste rien silencieusement.


## V0.169 — l’adresse du foyer devient la destination par défaut de Commander
- L’adresse de livraison enregistrée lors de la création du foyer est facultative afin de ne pas bloquer l’onboarding.
- Si elle existe, Commander l’utilise comme destination par défaut.
- Un provider reçoit au maximum un rayon de 10 km.
- Aucun restaurant n’est produit sans provider vérifié.
- Cette évolution est additive et ne change aucune règle de la fiche famille ou de LIA.


## V0.168 — Commander poursuit uniquement les règles déjà validées
- Carrousels horizontaux : swipe, points, auto-défilement naturel, arrêt sur interaction et respect Reduce Motion.
- 1 ou 2 résultats utiles : liste courte plutôt que remplissage artificiel.
- Fiche restaurant : n'afficher que les données réellement connues.
- Le bouton Commander n'ouvre qu'un lien de commande fourni et vérifié ; sinon l'absence de lien est dite clairement.
- Aucun provider réel n'étant encore connecté, l'application ne doit inventer aucun restaurant pour remplir l'écran.
- Cette version ne change aucune règle existante hors de ces décisions déjà validées.

## 2026-09-16 — V0.167 — intégration additive, sans réécrire V0.166
- Règle de travail : ne pas modifier une règle ou fonction existante sans décision explicite de Walter.
- Décision explicitement confirmée : l’âge d’un enfant n’est pas obligatoire ; LIA peut expliquer que le connaître aide à situer les enfants dans la hiérarchie familiale.
- Mémos, Commander et la seconde présentation LIA sont intégrés comme ajouts déjà validés, sans remplacer les onglets existants.
- Commander garde un rayon maximal de 10 km et ne doit jamais présenter une livraison comme confirmée sans source réelle.

## 2026-09-16 — V0.166 — les formulaires structurent, LIA vérifie et n'interroge pas
- Pour toute donnée structurée, LIA ouvre le bon formulaire et laisse l'utilisateur le remplir au lieu d'enchaîner les questions.
- LIA intervient uniquement pour signaler une information manquante, invalide ou incohérente.
- Le silence demandé par l'utilisateur est respecté sans humour ; les remarques comiques sont réservées au retour volontaire avant l'échéance d'une pause définie.
- LIA peut relier une conversation personnelle à une action concrète de maison ou de repas seulement lorsque cela sert réellement l'objectif de l'utilisateur.

## 2026-09-16 — V0.165 — LIA demande seulement le minimum utile au premier foyer
- Ne pas transformer la création du foyer en questionnaire : deux questions seulement au premier passage.
- Le prénom de l’organisateur et la taille habituelle de la table sont utiles immédiatement et peuvent être demandés avant abonnement.
- Les membres légers/téléphones restent derrière la logique Famille existante ; ne pas contourner le paywall en créant des membres premium pendant l’onboarding gratuit.
- Les foyers existants ne doivent jamais être renvoyés dans ce nouvel onboarding.

## 2026-09-16 — V0.164 — LIA se présente après la langue, avant le compte
- Le choix de langue reste la toute première action.
- LIA se présente ensuite, peut parler localement, et explique la suite sans afficher le paywall.
- Une présentation automatique ne doit jamais parler par-dessus VoiceOver/TalkBack.
- Continuer ou quitter l’écran arrête immédiatement la voix.

# Décisions techniques — Notre Table

## 2026-09-16 — V0.163 — la voix et le rire de LIA se choisissent à l’oreille
- Ne jamais figer une voix système par nom sans l’avoir réellement écoutée sur l’appareil cible.
- Le runtime retient trois candidates locales compatibles avec la langue et les compare avec la même phrase.
- Le rire est un choix séparé de la voix : changer de voix invalide l’approbation des réactions de rire.
- Tant qu’un rire n’est pas explicitement approuvé, le moteur social reste silencieux même s’il détecte un rire familial.
- Les essais TTS sont des prototypes ; une future banque de rires enregistrés peut remplacer ces prototypes sans changer la règle de consentement.


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


## 2026-09-16 — V0.156 — photo du frigo conversationnelle
- « Avec ce que j’ai » reste dans Recettes/Cuisiner ; aucun nouvel onglet principal n’est créé.
- Une session peut contenir autant de photos que nécessaire ; une photo enrichit les précédentes et ne les remplace jamais.
- L’organisateur doit pouvoir compléter les photos par quelques mots saisis à la main sans quitter le parcours.
- L’interface doit poser des micro-questions contextualisées plutôt qu’exposer des réglages techniques permanents.
- Une reconnaissance incertaine ne peut pas influencer les suggestions de recettes avant confirmation explicite.
- La reconnaissance internationale repose sur clés d’ingrédients neutres + vision/OCR/code-barres/catalogue/mémoire, la langue/région n’étant que du contexte.
- Le moteur présente au maximum trois idées de repas afin de préserver la clarté.
- Aucune idée « pour ce soir » ne doit être présentée avant de connaître le nombre de convives ; si l’information manque, le parcours propose d’abord « Demander à la famille » ou une saisie directe.
- Les quantités visibles sur les photos peuvent aider au calcul mais ne sont jamais supposées : quantité inconnue = confirmation nécessaire.
- Les recettes sont recalculées pour le nombre réel de personnes ; produit absent et quantité insuffisante sont deux états distincts.
- Les modules doivent partager le même contexte repas (présence, stock, quantités, contraintes) au lieu de fonctionner comme des écrans indépendants.


## 2026-09-16 — prix LIA et garde économique
- Notre Table reste le produit ; LIA reste son intelligence intégrée, pas un produit séparé.
- Une seule LIA complète pour toutes les durées ; pas de LIA volontairement dégradée sur le mensuel.
- Prix de référence business : 6,99 USD/mois, 34,99 USD/6 mois, 59,99 USD/an.
- En production, seuls les prix localisés du Store sont affichés.
- Objectif interne de coût LIA : ~1 USD/foyer/mois en moyenne ; mesurer avant d’ajuster les prix futurs.
- Le contrôle économique se fait par routage/caching/local-first et non par suppression d’aides essentielles.

## 2026-09-16 — V0.159 — découverte LIA sans risque de facture
- Avant authentification, la présentation de LIA reste locale/scriptée : télécharger puis quitter l’app ne déclenche aucun coût IA obligatoire.
- Après authentification mais avant abonnement, les quelques interactions cloud de découverte partagent un budget d’acquisition **à vie de 0,05 USD par compte**.
- À 0,035 USD, le routage de découverte passe en mode économie ; à 0,05 USD, les appels IA cloud gratuits s’arrêtent et l’expérience continue en local jusqu’à l’abonnement.
- Le plafond n’est jamais un compteur visible pour l’utilisateur et ne s’applique pas aux foyers abonnés.
- La consommation doit être réservée côté serveur avant tout appel fournisseur payant ; le client mobile n’a jamais le droit d’incrémenter ou de réinitialiser lui-même ce budget.
- La réservation serveur est transactionnelle et idempotente par `request_id`, afin qu’un retry réseau ne facture pas deux fois le même appel.
- Ce plafond protège le risque d’acquisition : 90 000 comptes gratuits au plafond absolu représentent au maximum 4 500 USD de coût IA de découverte.
- Le contrôle par compte réduit fortement le risque mais ne prétend pas empêcher à lui seul la création abusive de comptes multiples ; le rate limiting/anti-abus du futur endpoint IA reste obligatoire.



## 2026-09-16 — V0.161 — voix native, écoute sociale local-first
- LIA parle d'abord avec les moteurs vocaux natifs du téléphone afin d'éviter un coût TTS cloud systématique.
- L'écoute sociale n'est jamais automatique : activation explicite + permission système.
- iOS utilise Sound Analysis local pour classifier rire/parole ; aucun audio ambiant n'est envoyé au cloud pour cette fonction.
- Android conserve le micro bloqué jusqu'à l'intégration d'un vrai classificateur local ; la voix Android reste disponible via TextToSpeech.
- Une reprise de parole humaine coupe LIA immédiatement.


## 2026-09-16 — V0.162 — Android n’écoute que si le vrai modèle local est présent
- Android adopte YAMNet LiteRT/TFLite comme classificateur local d’événements audio au lieu d’un détecteur artisanal fondé sur le volume.
- L’audio ambiant ne doit jamais quitter l’appareil pour décider si la famille rit ou reprend la parole.
- Un modèle ML tiers n’est accepté dans le build qu’après vérification de sa provenance, de sa licence, de sa taille et de son SHA-256.
- Si le modèle ou la permission finale manque, le module retourne indisponible et le micro reste inaccessible : aucune dégradation silencieuse vers du cloud.
- L’activation Android production attend toujours un vrai build et des essais sur appareils physiques, notamment pour calibrer les seuils de rire/parole et la batterie.
