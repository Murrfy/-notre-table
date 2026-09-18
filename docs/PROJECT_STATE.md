## V0.289 — Liste complète adaptée au nombre de personnes

- « Adapte les ingrédients pour 6 personnes » recalcule toute la liste depuis les quantités et portions réelles de la recette ouverte.
- Les valeurs exactes sont calculées localement et ne modifient jamais la recette persistée.
- Si certaines quantités manquent, LIA annonce d’abord les résultats exacts disponibles puis identifie les ingrédients incomplets.
- Toute approximation des données manquantes reste bloquée jusqu’à un « oui » explicite.
- Si les portions de base manquent, LIA l’explique et demande également l’autorisation avant approximation.
- Même session cuisine, même micro global, aucun écran ou moteur parallèle.

## V0.288 — Quantité d’ingrédient adaptée aux portions

- « Combien de farine pour 6 personnes ? » combine la quantité réelle de la recette avec une cible de portions explicite.
- Calcul strict : quantité × portions demandées / portions de base.
- Si la quantité ou les portions de base sont absentes, LIA explique le manque et demande l’autorisation de faire une approximation.
- Aucun calcul approximatif sans consentement explicite ; après « oui », l’estimation est annoncée comme telle et ne devient jamais une donnée de recette.
- Cible bornée de 1 à 50 ; aucun changement persistant de la recette.
- Même session cuisine et même micro global.

## V0.287 — Quantité d’ingrédient ciblée en mode cuisine

- « Combien de farine ? » / « Il faut combien d’œufs ? » interroge uniquement la recette réellement ouverte.
- La correspondance utilise la clé d’ingrédient canonique déjà présente dans Notre Table ; aucun modèle ne devine un ingrédient.
- Ingrédient absent ou quantité inconnue : LIA le dit explicitement.
- Plusieurs occurrences du même ingrédient : LIA refuse de sommer silencieusement des quantités potentiellement destinées à des usages différents.
- Même session cuisine et même micro global ; aucun pipeline parallèle.

## V0.286 — Navigation vocale directe par numéro d’étape

- « Va à l’étape 4 » et « reviens à l’étape deux » ciblent directement une étape réelle.
- Les nombres dictés courants sont reconnus dans les langues déjà supportées.
- Une étape inexistante ne provoque aucun clamp silencieux ; LIA indique la borne réelle de la recette.
- La navigation séquentielle précédente reste inchangée.

## V0.285 — Fin de recette entièrement mains libres

- « J’ai fini la recette », « termine la recette » et « quitte le mode cuisine » ferment la surface existante.
- Un simple « j’ai fini » ne ferme rien afin d’éviter une sortie accidentelle.
- La commande reste locale à la session cuisine et ne crée aucun état de recette supplémentaire.

## V0.284 — Fin d’étape à la voix

- « J’ai fini cette étape » / « étape terminée » avance vers l’étape réelle suivante.
- LIA lit immédiatement la nouvelle instruction sans demander de toucher l’écran.
- La dernière étape reste une borne dure : aucun index fictif n’est créé.
- Réutilisation exclusive de la session cuisine et du micro global déjà existants.

## V0.283 — Statut vocal de la recette

- « On en est où ? » / « Je suis à quelle étape ? » renvoie l’étape réelle et son instruction.
- « Il reste combien d’étapes ? » reste une question de progression et ne tombe pas dans le minuteur.
- Aucun état parallèle : LIA lit uniquement l’index et le contenu de la recette ouverte.

## V0.282 — Ingrédients mains libres en cuisine

- « Montre-moi les ingrédients » ouvre le panneau déjà existant sans toucher l’écran.
- « Cache les ingrédients » le referme localement.
- « Lis-moi les ingrédients » lit uniquement les ingrédients et quantités réellement présents dans la recette.
- Aucun nouvel écran, aucun état persistant et aucun pipeline vocal parallèle ; toujours la session LIA globale.

## V0.281 — Commandes cuisine plus naturelles

- « Étape précédente » revient d’une étape sans dépasser le début de la recette.
- « Il reste combien ? » interroge directement le minuteur de recette actif.
- « Annule / arrête le minuteur » annule le minuteur de recette, sans être confondu avec « silence / tais-toi ».
- Toujours le micro global de LIA ; aucun pipeline vocal supplémentaire.

## V0.280 — Cuisine mains libres via LIA globale

- « Répète », « étape suivante », « il reste combien ? », « mets 5 minutes » agissent sur la recette ouverte.
- Réutilisation du micro global de LIA ; aucun deuxième pipeline de reconnaissance.
- La musique reste routée vers la capacité musique générale.
- « Silence / tais-toi » coupe la réponse sans provoquer une nouvelle phrase.

## V0.279 — Ouvrir/lancer la recette avec LIA

- « Ouvre cette recette » ouvre la fiche de la recette ciblée.
- « Lance / commence cette recette » ouvre directement le mode cuisine.
- Plusieurs recettes sans focus = une clarification.
- Tout reste dans Notre Table ; aucun lien externe n’est nécessaire.

## V0.278 — Recette visuelle vers planning

- « Mets-la au dîner demain » peut réutiliser la recette ciblée du dernier scan.
- Plusieurs recettes sans focus = une clarification de recette, pas un choix silencieux.
- Le planning existant garde la gestion du jour/repas et ses clarifications.
- Aucun nouvel état persistant n’est créé pour le contexte visuel.

## V0.277 — Manquants du scan vers les courses

- « Ajoute ce qui manque aux courses » utilise la recette de référence du dernier scan.
- Plusieurs recettes sans contexte clair = une seule question de clarification.
- Aucun ajout si la recette ne manque de rien.
- Écriture via la frontière d’actions LIA et retour honnête en cas de réussite partielle.

## V0.276 — Scan vers stock sur ordre explicite

- « Garde ça dans mon stock » enregistre les produits confirmés du dernier scan.
- Aucun scan n’écrit le stock automatiquement.
- Les quantités ne sont conservées que si leur confiance visuelle est suffisante.
- Une réussite partielle est annoncée comme telle ; aucun faux succès global.

## V0.275 — Contexte visuel de session pour LIA

- Après le scan, LIA retient uniquement les produits confirmés et les meilleures recettes, jamais la photo brute.
- « Qu’est-ce que tu vois ? », « je peux cuisiner quoi avec ça ? » et « il manque quoi ? » sont résolus localement.
- Les éléments incertains ne deviennent pas des faits confirmés.
- Le contexte expire après 30 minutes et n’est pas persisté.

## V0.274 — Vision frigo/placard déclenchée par LIA

- « LIA, regarde ce que j’ai dans le frigo » ouvre directement « Avec ce que j’ai » et lance la caméra.
- La commande réutilise le moteur de vision existant ; aucun second pipeline photo n’est créé.
- Les produits incertains gardent leur confirmation avant d’être utilisés pour les recettes.
- Aucun stock persistant n’est écrit silencieusement à partir d’une photo.

## V0.273 — Proactivité calendrier discrète

- Un rendez-vous proche (10 min à 3 h) peut produire un rappel privé à l’ouverture.
- Maximum deux rappels calendrier par jour et jamais deux fois pour le même événement.
- Aucun rappel vocal spontané ; aucune question automatique.
- Pause LIA, navigation active ou réengagement prioritaire bloquent ce rappel.

## V0.272 — Point journée/semaine + Right Hand réel

- LIA répond localement au point de journée, de semaine et au prochain rendez-vous.
- Le calendrier alimente le moteur Right Hand existant au lieu de créer un briefing parallèle.
- Les rendez-vous sont classés « personal » pour éviter une exposition spontanée à table.
- Les résumés restent courts et sans question retour automatique.

## V0.271 — Portée des séries récurrentes

- LIA distingue « le prochain » de « toute la série ».
- Une suppression de série retire seulement les occurrences futures et conserve l’historique passé.
- Les rappels futurs de la série sont annulés avant suppression.
- Une série ambiguë déclenche une seule question de portée au lieu d’une liste d’occurrences.

## V0.270 — Séries hebdomadaires bornées

- « Tous les lundis… pendant 6 semaines » crée une série réelle et liée.
- Sans borne explicite, LIA demande combien de semaines / combien de fois.
- Maximum initial : 24 occurrences ; aucune récurrence infinie implicite.
- Insertion backend atomique et vérification de conflits sur toute la fenêtre avant écriture.

## V0.269 — Durées réelles et conflits fiables

- LIA comprend « de 10 h à 11 h » et « à 10 h pendant 2 heures ».
- L’heure de fin est enregistrée uniquement si elle est explicitement donnée.
- Les conflits utilisent un chevauchement réel dès qu’une fin est connue.
- Déplacer un rendez-vous avec durée déplace aussi sa fin et conserve la durée.

## V0.268 — Conflits horaires du calendrier

- Avant une création ou un déplacement vocal, LIA vérifie les événements du même jour.
- Conflit certain = même heure de départ, ou heure placée dans un événement dont la fin est connue.
- LIA annonce le conflit et demande uniquement si l’utilisateur veut maintenir l’action.
- Oui = action exécutée ; non = aucune écriture. LIA n’invente jamais une durée pour un événement sans heure de fin.

## V0.267 — Calendrier → En route avec LIA

- Un événement avec adresse peut lancer directement En route avec LIA depuis le calendrier.
- Une commande vocale visant « mon rendez-vous … » résout le rendez-vous privé avant de lancer la navigation.
- Aucun trajet n’est lancé si le rendez-vous est ambigu, introuvable ou sans adresse.
- La navigation reste dans Notre Table et conserve les quotas/protections déjà validés.

## V0.266 — Rappels de rendez-vous pilotés oralement

- Un rappel peut être ajouté, changé ou retiré sur un rendez-vous existant sans recréer l’événement.
- Les demandes de rappel qui mentionnent un rendez-vous restent dans la voie Calendrier ; les rappels ordinaires restent dans la voie Reminder.
- Suppression visuelle d’un événement = annulation de son alarme liée.
- Ambiguïté sur l’événement = aucun choix silencieux.

## V0.265 — Rappel lié au cycle de vie du rendez-vous

- `reminder_minutes_before` est stocké avec l’événement privé.
- Création calendrier + « rappelle-moi X avant » = un seul acte LIA.
- Déplacement de l’événement = resynchronisation du rappel ; suppression = annulation du rappel.
- Refus de notifications ou rappel déjà trop tardif est annoncé sans faux succès.

## V0.264 — Calendrier personnel Notre Table piloté par LIA

- Ajout d’un calendrier personnel privé par utilisateur, stocké dans Notre Table avec RLS et mode démo local.
- Surface Calendrier accessible depuis LIA ; aucun handoff vers Apple Calendar/Google Calendar.
- LIA peut ouvrir, lire, créer, déplacer et supprimer des événements ; les ambiguïtés échouent proprement.
- Les clarifications restent minimales : titre, jour ou heure uniquement si l’information manque.

## V0.263 — Contrôle du trajet et arrêts réellement sur la route

- « LIA, arrête le guidage » coupe la navigation active via un contrôle de session partagé.
- Recherche station-service / parking / pharmacie / restaurant réellement contrainte à la route restante.
- Google Routes API fournit la polyline ; Places Text Search Search Along Route classe les candidats avec résumé de routage.
- LIA propose le meilleur arrêt et attend un oui/non avant de modifier le trajet.
- Le natif Google reçoit arrêt + destination finale ; arrivée à l’arrêt = passage automatique au prochain waypoint.
- Aucun historique GPS persistant ; panne provider = aucun arrêt inventé.

## V0.262 — Contexte de trajet vivant pour LIA

- État de session navigation : destination, ETA, distance, prochaine manœuvre, distance à la manœuvre et reroutage.
- Questions directes « on arrive quand ? », « combien de km ? », « je tourne où ? » répondent depuis les données Google natives.
- Aucune donnée de trajet n’est persistée après la session.
- Réactions sociales spontanées suspendues pendant la conduite ; LIA reste disponible à l’adresse directe.

## V0.261 — Instructions réelles + guidage vocal natif

- `GMSNavigationNavInfo` remonte prochaine instruction, distance jusqu’à la manœuvre, état de navigation, routeChanged, ETA et distance finale.
- L’écran **En route avec LIA** affiche la prochaine consigne en grand et un état de reroutage non ambigu.
- `GMSNavigator.voiceGuidance = .alertsAndGuidance`, Bluetooth autorisé et volume normal pour le guidage vocal natif.
- La voix personnelle LIA n’est pas encore substituée à la voix Google de navigation : aucun timing de sécurité n’est simulé.

## V0.260 — Destination Google réelle + guidage natif

- Edge Function authentifiée `lia-navigation-resolve`, clé Google serveur uniquement.
- Text Search (New), jusqu’à 3 candidats, biais géographique autour de la position actuelle.
- Ambiguïté explicitement présentée au client ; aucune destination choisie au hasard.
- `LiaNavigationMapView` accepte Place ID + coordonnées et lance `GMSNavigator.setDestinations`.
- `isGuidanceActive`, suivi caméra, notifications arrière-plan, ETA/distance et arrivée câblés.
- Quota réservé seulement après préflight Google prêt et destination sélectionnée.

## V0.259 — Surface native Google Navigation

- Vue Expo native `LiaNavigationMapView` prête à héberger `GMSMapView` dans Notre Table.
- Import Google conditionnel : aucun guidage/cartographie simulé sans SDK réel.
- Événements natifs `onReady` / `onUnavailable` pour distinguer disponibilité réelle et absence du package.
- V0.258 reste intégralement conservée : préflight clé, conditions Google, permission Always et background location.

## V0.258 — Préflight natif Google Navigation iPhone
- Clé Google Navigation iOS centralisée mais optionnelle tant que le service n’est pas activé.
- Permission de localisation Always uniquement au démarrage d’un vrai guidage.
- Background location + motion privacy préparés.
- Conditions Google obligatoires, fail-closed.
- Prochaine étape : vue native GMSMapView + GMSNavigator.

## V0.257 — Quota navigation partagé par abonnement
- En route avec LIA : 30 trajets mensuels par foyer/abonnement.
- Compteur production autoritaire dans Supabase via RPC atomique ; multi-appareils = quota commun.
- Pas de consommation tant que le moteur natif réel n’est pas disponible.
- LIA avertit seulement à l’approche de la limite ; aucun compteur permanent.
- Prochaine étape native : liaison réelle Google Navigation SDK, clé API et build iPhone.

## V0.256 — En route avec LIA + réponses sociales moins interrogatives
- Commande vocale locale « LIA, emmène-moi / guide-moi… » avec clarification de destination si nécessaire.
- Surface **En route avec LIA** ouverte dans Notre Table, sans bascule automatique vers une autre application.
- Module natif iOS Core Location : permission uniquement au moment d’une demande de guidage et acquisition réelle de la position courante.
- Frontière `liaNavigationEngine` prête pour un moteur intégré ; aucun faux itinéraire si aucun moteur natif n’est enregistré.
- Petits échanges « comment ça va ? » : réponses variables, courtes et sans relance systématique.
- Questions sur les limites de LIA : formulations physiques variables, humaines et honnêtes plutôt qu’une liste technique.
- Validation finale : **583/583 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/acceptation/projet PASS, **198 TS/TSX audités sans diagnostic (201 dans le balayage élargi avec modules)**. Build natif et navigation réelle encore à valider sur appareil.

## V0.255 — LIA disponible dès l’ouverture

- Base : V0.254 conservée ; aucune reconstruction.
- App active : le LIA principal démarre automatiquement l’écoute, sans exiger l’ouverture de la feuille LIA ni un appui sur le bouton micro.
- Commande directe : « LIA, … » ou surnom accepté est reconnu au premier plan ; une conversation ambiante non adressée reste ignorée hors session sociale.
- Clarifications : une demande déjà engagée peut être complétée sans répéter le prénom de LIA.
- iOS : analyse sonore, ShazamKit et reconnaissance directe partagent le même flux micro natif.
- Auto-écoute : la reconnaissance directe est suspendue pendant la voix de LIA puis reprise automatiquement.
- Appels : suspension complète pendant tout appel actif, reprise après fin réelle, règles V0.252 inchangées.
- Handoffs : continuité téléphone/musique V0.251 conservée.
- Permissions : micro + reconnaissance vocale restent soumises à l’autorisation système ; refus = silence fail-closed.
- Android : reconnaissance vocale globale non revendiquée tant que le runtime natif RECORD_AUDIO/speech n’est pas validé.

Validation locale V0.255 : **579/579 régressions PASS**, **17/17 gates EAS PASS**, audits principaux PASS, **193 TS/TSX sans diagnostic**. Validation iPhone physique encore requise pour la nouvelle écoute directe native.

## V0.254 — Minuteurs généraux et initiative créative de LIA

- Base : V0.253 conservée ; aucune reconstruction.
- Minuteur global : démarrer, demander le temps restant et annuler depuis la conversation LIA, partout dans l’assistance.
- Plusieurs minuteurs : aucune sélection silencieuse ; LIA demande lequel.
- Fin au premier plan : LIA annonce le minuteur uniquement lorsqu’elle ne parle pas déjà et qu’aucune parole humaine n’est active.
- Initiative : LIA peut ponctuellement proposer une option inattendue ou une question à deux voies (« classique » / « épater la galerie ») lorsqu’elle apporte une vraie valeur.
- Garde-fous : pas d’initiative créative dans un moment sensible/urgent, pendant qu’une personne parle, après usage récent du même ressort ou quand l’utilisateur demande une exécution stricte.
- La surprise porte sur les idées et questions ; elle ne donne jamais le droit d’exécuter une action externe/destructive non demandée.

## V0.253 — Rapport exportable du test iPhone LIA

- Base : V0.252 conservée ; aucune reconstruction.
- Le diagnostic natif iPhone peut être exporté volontairement en JSON depuis la surface LIA.
- Le rapport contient uniquement l’état audio/app et une trace bornée à 80 transitions ; aucune donnée de contacts ou du foyer n’y est ajoutée.
- Le partage du rapport est observationnel et ne modifie aucun état audio, appel ou action LIA.
- ShazamKit reste un App Service Apple à activer pour `com.notretable.app` avant le test physique.

## V0.252 — Diagnostic iPhone natif et pause stricte de LIA pendant les appels

- Base : V0.251 conservée ; aucune reconstruction.
- Diagnostic iOS : état micro, moteur audio, ShazamKit, morceau reconnu, interruption et reprise visibles depuis LIA pour le test appareil.
- Appels : CallKit observe les appels système. Tout appel actif suspend parole, écoute et reconnaissance de LIA.
- Reprise : aucune reprise tant qu’un appel reste actif ; réarmement uniquement après la fin réelle du dernier appel.
- Continuité : si la dictée/reconnaissance était active avant l’appel, elle est prioritairement restaurée ; sinon l’écoute/identification demandée reprend.
- Musique : règle V0.251 inchangée — LIA ne parle pas spontanément pendant le morceau.
- ShazamKit : service App ID Apple à activer avant build appareil ; test physique iPhone encore requis.

## V0.251 — Musique, continuité d’assistance et silence pendant les morceaux
- Les commandes musicales directes rejoignent la couche d’actions de LIA ; service musical préféré mémorisé après choix explicite.
- Les handoffs Téléphone/Musique initiés par LIA ne provoquent plus l’arrêt immédiat de la session lors du passage temporaire en arrière-plan.
- iOS : `UIBackgroundModes: audio` et reconnaissance ShazamKit branchée sur le flux micro natif existant. Le résultat natif fournit titre/artiste/identifiant ; JS ne fabrique aucun match.
- Politique sonore : musique active = aucune intervention spontanée de LIA ; une adresse directe reste prioritaire. Après fin de morceau, le morceau reconnu reste disponible comme contexte de session.
- Anecdotes artiste/morceau : route `verified_research` obligatoire pour obtenir des faits sourcés via l’outil de recherche du fournisseur, sinon LIA ne doit pas improviser.
- Cuisine : le flux conversationnel est disponible pour les demandes directes, mais les tours ambiants ne déclenchent pas de commentaire spontané.
- Android : reconnaissance/background micro non revendiqués comme terminés dans V0.251 ; un service microphone au premier plan conforme Android reste nécessaire.

Validation locale V0.251 : **560/560 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et acceptation PASS, **189 TS/TSX sans diagnostic de transpilation**. Le runtime natif ShazamKit et la continuité sur appareil restent à valider sur un vrai build.

## V0.250 — Actions vocales internes réellement exécutées par LIA

- Une commande explicite peut désormais ajouter un article aux courses, inscrire un repas au planning ou créer un Mémo depuis le flux vocal principal.
- L’ordre adressé à LIA vaut accord pour l’acte demandé ; aucun second « tu confirmes ? » artificiel n’est ajouté.
- LIA confirme oralement après réussite réelle : courses ajoutées, repas planifié ou Mémo créé.
- Si une donnée manque, elle demande uniquement cette donnée et conserve le reste de la demande pendant la session.
- Une nouvelle commande explicite remplace proprement l’action en clarification ; annulation, arrêt d’écoute et arrière-plan nettoient l’état temporaire.
- Une référence ambiguë comme « ça » n’est jamais inventée : LIA demande ce qu’elle doit mémoriser.

Validation locale : **553/553 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **184 fichiers TS/TSX transpilés sans diagnostic**.

## V0.249 — Rappels vocaux directs et confirmation d’action de LIA

- Une demande vocale explicite de rappel est exécutée localement sans second « oui » artificiel.
- LIA confirme oralement uniquement après que le planificateur natif a réellement accepté le rappel.
- Si l’heure, le moment ou le contenu manque, LIA demande seulement l’élément manquant et garde le reste en mémoire de session.
- Une annulation ou une nouvelle commande explicite nettoie la clarification de rappel en attente.
- Un refus de permission ou un échec natif produit une réponse honnête, jamais un faux « c’est fait ».
- Un appel effectivement lancé reçoit aussi une confirmation vocale courte de LIA.

Validation locale : **546/546 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **182 fichiers TS/TSX transpiles sans diagnostic**.

## V0.248 — Message famille préparé par l’assistante, envoi final humain

- Une demande « préviens la famille » charge désormais le contexte famille utile avant de proposer l’action.
- Le pont d’exécution accepte `family.prepare_message` uniquement avec confirmation explicite, foyer, destinataires exacts et texte non vide.
- Les membres sont revalidés contre les données réelles du foyer au moment de l’action : actif, numéro utilisable et éligibilité message.
- Le composeur SMS natif peut être ouvert avec plusieurs destinataires, mais LIA n’envoie jamais le message elle-même.
- Aucun numéro de téléphone n’est injecté dans les faits transmis au moteur IA ; seul l’état joignable/sans numéro accompagne le prénom.

Validation locale : **539/539 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **180 fichiers TS/TSX transpiles sans diagnostic**.

## V0.247 — Continuité vocale des deux présentations de LIA

- La première présentation reste exactement le texte d’onboarding validé ; aucun texte alternatif n’est ajouté.
- La seconde présentation après la fiche famille prononce désormais exactement `lia.secondIntro` avec la voix préférée déjà choisie pour LIA.
- Lecture automatique uniquement hors lecteur d’écran, avec contrôle visible Écouter/Arrêter et arrêt avant de quitter l’écran.
- La voix ne change pas l’identité ou le contenu de LIA : elle ne fait que vocaliser les textes déjà validés.

Validation locale : **535/535 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **180 fichiers TS/TSX transpiles sans diagnostic**.

## V0.246 — Frontière d’exécution confirmée pour LIA

Les propositions de LIA disposent maintenant d’un pont d’écriture unique vers les services Notre Table. Ajouter aux courses, inscrire un repas ou créer un Mémo exige une action structurée valide et une confirmation explicite ; toute donnée manquante ou toute panne échoue fermée sans faux succès. V0.245 reste la couche de compréhension/contextualisation en amont.

Validation locale : 532/532 régressions PASS, 17/17 gates EAS PASS, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, 180 fichiers TS/TSX transpiles sans erreur.

## V0.245 — Objectifs multi-étapes et contexte applicatif réel

LIA peut maintenant transformer une demande quotidienne en objectif unique et déterminer quelles données de Notre Table sont utiles : placards, recettes, planning, courses et Mémos. Elle rassemble ces données en lecture seule avant sa réponse et peut calculer les meilleures correspondances entre stock et recettes. Les modifications restent des propositions explicitement marquées comme nécessitant confirmation : planning, ingrédients manquants, Mémo et message famille ne sont jamais déclarés effectués sans résultat d’action réel.

Validation locale : 528/528 régressions PASS, 17/17 gates EAS PASS, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, 178 fichiers TS/TSX transpiles sans erreur. Le build Metro natif complet n’est pas revendiqué sans dépendances installées dans l’archive.

## V0.244 — Identité LIA, surnoms consentis et assistance active

LIA conserve son prénom canonique LIA, peut accepter un surnom explicite qui devient un alias réel d’appel, et peut utiliser un surnom utilisateur uniquement après accord. Sa répartie sur les taquineries de prénom reste légère et respectueuse, jamais basée sur une vulnérabilité ou un sujet sensible. Le contrat agentique renforce aussi son comportement d’assistante active multi-étapes sans contourner les confirmations ni les preuves existantes.

Validation exécutable ici : 521/521 régressions PASS. TypeScript/Metro complets non revendiqués dans cet environnement faute de dépendances restaurées.

## V0.243 — Repli vocal honnête

Une demande directe n’aboutit plus à un silence incompréhensible lorsque le moteur échoue. LIA répond sans jargon, ne fabrique aucune preuve et garde les pannes ambiantes ou sensibles silencieuses à table.

Validation locale complète : 514/514 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 908 modules chacun.

## V0.242 — Exécution fournisseur bornée

Les appels IA ont maintenant un délai adapté à la tâche, un vrai signal d’annulation, des états de panne contrôlés et aucune relance payante automatique. Les actions locales sortent avant toute dépendance au modèle.

Validation locale complète : 508/508 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 907 modules chacun.

## V0.241 — Requête fournisseur minimale et vérifiable

Le futur fournisseur reçoit un paquet minimal : texte utile, langue, route, règles immuables de LIA et au plus huit faits confirmés et pertinents. Aucun identifiant technique de locuteur n’est transmis. Une recherche sans preuve vérifiée est bloquée avant la voix.

Validation locale complète : 502/502 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 906 modules chacun.

## V0.240 — Classification agentique automatique

Le texte réellement entendu est classé avant tout appel fournisseur : conversation économique, raisonnement complexe ou recherche actuelle vérifiée. La détection d’un sujet privé devient un plancher de confidentialité non contournable et force également la réponse silencieuse.

Validation locale complète : 496/496 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 905 modules chacun.

## V0.239 — Routage agentique économique

LIA conserve sa personnalité et ses règles Notre Table, tandis qu’un contrat de routage choisit désormais local, modèle économique, modèle standard, raisonnement renforcé ou recherche vérifiée. Les sujets sensibles n’utilisent ni Web ni mémoire large ; aucun fournisseur absent n’est déclaré disponible.

Validation locale complète : 490/490 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 904 modules chacun.

## V0.238 — Remplacement explicite d’une action vocale

Une nouvelle commande directe adressée à LIA remplace toute clarification d’appel ou de SMS encore en attente. Les réponses courtes continuent le dialogue courant ; les vraies nouvelles commandes ne sont jamais avalées comme un prénom ou un texte de message.

Validation locale complète : 484/484 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 902 modules chacun.

## V0.237 — Annulation vocale sûre

Une commande d’appel ou de SMS encore en clarification peut être annulée oralement. Tout état temporaire est effacé à l’arrêt de l’écoute, en arrière-plan ou à la fermeture de LIA, afin qu’une ancienne commande ne capture jamais une conversation ultérieure.

Validation locale complète : 481/481 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 902 modules chacun.

## V0.236 — Clarification d’appel continue

LIA garde en mémoire de session uniquement le contact ou le numéro d’appel à préciser. Elle prononce les choix trouvés et comprend les réponses courtes nom, oui, portable, travail ou domicile, sans faire répéter la commande complète et sans choisir à la place de l’utilisateur.

Validation locale complète : 478/478 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 902 modules chacun.

## V0.235 — Commande SMS partielle

LIA conserve la partie déjà comprise d’un SMS incomplet et ne demande que le destinataire ou le texte manquant, sans faire recommencer la commande.

Validation locale complète : 474/474 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS PASS avec 902 modules chacun.

## V0.234 — Clarification SMS continue

LIA conserve en mémoire de session le brouillon SMS pendant la résolution d’un contact ou d’un numéro ambigu. L’utilisateur répond uniquement à la précision demandée, sans recommencer la commande.

## V0.233 — Composeur SMS réel

LIA peut préparer une demande SMS explicite dans le composeur natif avec contact et texte résolus, sans jamais envoyer silencieusement ni prétendre que le message est parti. Toute ambiguïté reste fail-closed.

## V0.232 — Répétition naturelle du prénom et construction stricte

LIA conserve la commande d’appel en cours lorsque le prénom n’est pas compris : elle demande une première répétition, puis utilise la relance humoristique validée au deuxième échec, sans faire recommencer toute la commande et sans choisir un contact par supposition. Le typecheck React Native installé est propre ; les validations d’environnement, audits et régressions restent consignés séparément.

## V0.231 — Assistant vocal et Contacts téléphone

Couche assistant devant la conversation de table : commandes directes seulement, résolution via Contacts locaux comme source unique d’identité téléphonique, clarification des ambiguïtés, composeur système réel, messages fail-closed sans provider. Base reconstruite depuis la V0.230 authentifiée puis validée à 461/461 tests.

## V0.230 — Table conversation runtime

Conversation de table raccordée au LiaOrb avec adaptateurs réels, confidentialité session-only et bridges vers rappels/Mémos.

# État du projet Notre Table

## V0.229 — Conversation familiale et orchestration repas
- Présence sociale, réponses repas, habitudes familiales et orchestration LIA intégrées.
- Checkpoint en validation de clôture.

## V0.228 — Participation familiale LIA
- Participation spontanée bornée, aide parentale, Mémos consentis, humour contextuel et connaissance quotidienne fiable.

## V0.227 — Fermeture LIA hors premier plan
- La surface LIA se ferme avec l’écoute/voix au passage en arrière-plan ; aucun keep-awake résiduel.

## V0.226 — Cycle de vie LIA
- Passage en arrière-plan : écoute/voix arrêtées, keep-awake libéré ; aucun redémarrage implicite au retour.

## V0.225 — Écran éveillé pendant LIA active
- LIA suspend l’auto-extinction seulement pendant sa surface ouverte ou son écoute explicite, puis libère immédiatement le keep-awake.

## V0.224 — Frontière STT cuisine
- Le mode cuisine possède maintenant un contrat d’adaptateur vocal ; son UI mains-libres reste cachée tant qu’aucun moteur réel n’est disponible.

## V0.223 — Contrôleur cuisine réutilisable
- Le moteur mains-libres est désormais accessible via un service unique, prêt pour un adaptateur vocal natif.

## V0.222 — Runtime cuisine relié à l’écran
- Les actions mains-libres pilotent désormais le vrai state étape/minuteur de CookingModeScreen.

## V0.221 — Ignorance inférée sans faux événement
- Un pending non ouvert depuis 24 h incrémente exactement une fois le compteur d’ignorés avant la prochaine décision.

## V0.220 — Pending de relance
- Chaque notification réellement envoyée peut maintenant rester identifiable jusqu’à son ouverture.

## V0.219 — Relance in-app à propriétaire unique
- MainScreen affiche désormais le résultat du runtime unique via l’Orb LIA et aucun second moteur ne double la relance.

## V0.218 — Runtime relié au cycle de vie
- L’orchestration V0.217 s’exécute désormais sur foyer actif et retour au premier plan.

## V0.217 — Orchestration réelle des relances
- Silence, sélection, livraison et surface sont maintenant reliés dans un seul runtime.

## V0.216 — Envoi réel relié à l’historique
- Le runtime marque désormais `sent` uniquement après une notification réellement programmée.

## V0.215 — Ouverture notification reliée à l’historique
- L’ouverture réelle d’une notification de réengagement est maintenant enregistrée et réinitialise le compteur d’ignorées.

## V0.214 — Historique consommé automatiquement
- Le service de sélection des relances charge lui-même l’historique persisté, fermant la boucle V0.210–V0.213.

## V0.213 — Historique de réengagement persisté
- L’historique déterministe des relances est maintenant sauvegardé par le service réel afin de survivre aux sessions.

## V0.212 — Historique des relances
- Envoi/ouverture/ignorée sont maintenant transformés en historique déterministe utilisable par la politique de cooldown et d’arrêt après relances ignorées.

## V0.211 — Runtime de livraison du réengagement
- Les décisions `none` / `in_app` / `notification` issues du moteur sont maintenant respectées par le runtime de notifications, sans permission surprise.

## V0.210 — Réengagement branché aux fils persistés
- Le service réel d’open loops consomme désormais la politique de réengagement validée en V0.201 ; pas de fil réel, pas de notification de rétention.

## V0.209 — Fin de minuteur vocale
- LIA annonce une fin de minuteur uniquement lorsque le tour de parole est libre et la session toujours active.

## V0.208 — Réponses vocales cuisine sur état réel
- LIA répond à « répète » et « temps restant » depuis l’étape et le minuteur réellement actifs, sans inventer de valeur.

## V0.207 — Runtime cuisine mains libres
- Les commandes vocales sûres agissent désormais sur un état local borné sans dépasser la recette ni simuler une action externe.

## V0.206 — Actions vocales cuisine bornées
- LIA transforme les commandes cuisine reconnues en actions locales sûres et distingue explicitement les demandes qui exigent une intégration externe réelle.

## V0.205 — Cuisine mains libres
- LIA comprend les commandes vocales de base pendant la recette, avec minuteurs uniquement sur durée explicite et sans fausse intégration musicale.

## V0.204 — Orchestration vocale
- LIA cède toujours la parole à l’humain, annule la parole en attente lors d’une interruption et adapte son délai de réponse entre cuisine et table.

## V0.203 — Suivi après événement
- LIA ferme réellement les boucles : une relance après l’événement, fermeture si résolu/annulé, proposition de prochain pas si une action reste, silence si l’utilisateur décline.

## V0.202 — Brief de journée LIA
- LIA priorise le prochain événement ou suivi réellement utile et propose l’aide correspondante sans transformer la journée en tableau de tâches.
- Les actions continuent d’exiger l’accord prévu par la politique bras droit et les sujets privés ne surgissent pas à table.

## V0.201 — Réengagement contextuel
- LIA peut donner envie de rouvrir Notre Table grâce à un vrai sujet précédent, jamais par une notification générique de rétention.
- Les sujets privés restent masqués sur l’écran verrouillé et hors des surfaces familiales ; les relances ignorées ralentissent automatiquement.

## V0.200 — Présence sociale LIA à table
- LIA sait choisir entre question légère, clin d’œil familial, appréciation du repas, idée d’après-repas et silence.
- La conversation humaine reste prioritaire ; humour et anecdotes exigent une base réelle et non sensible.

## V0.199 — Boucle curiosité → mémoire → retour utile
- LIA sélectionne ses questions à partir de ce qu’elle ne sait pas encore, puis respecte consentement, sensibilité et contexte avant mémorisation.
- Les faits confirmés peuvent nourrir plus tard une aide ou un clin d’œil, sans exposer de contenu privé à table.


## V0.198 — Curiosité contextuelle en cuisine
- Les temps morts de cuisson deviennent un contexte relationnel contrôlé : question spontanée, musique ou compagnie silencieuse selon parole humaine, sensibilité et fréquence récente.
- La curiosité est pilotée par les faits encore inconnus, jamais par un questionnaire séquentiel ; une réponse confirmée ferme le besoin de redemander ce fait.
- Les banques externes de phrases préparées par Walter pourront enrichir cette mécanique sans changer ses garde-fous.


## V0.197 — LIA propose puis exécute les aides quotidiennes
- Politique de bras droit pour rendez-vous, récupération enfant, courses, achats, travail et famille.
- LIA peut demander une donnée manquante ; toute action qui modifie rappels/données reste soumise à confirmation.
- Alarmes LIA uniques ou hebdomadaires, jours sélectionnés, remplacement idempotent et son uniquement sur le canal d’alarme explicitement accepté.
- Sujets personnels/sensibles : texte système générique et offres marquées privées.
- Validation locale V0.197 : **276/276 régressions**, **17/17 gates EAS**, **132 TS/TSX**, **958 clés EN**, audits continuité/hygiène/backend/release/feature/accessibilité PASS ; hygiène source **391 fichiers** ; backend **24 tables client / 17 RPC / 7 Realtime**, migrations **001 → 024**.


## V0.196 — LIA garde les fils ouverts de la journée
- Nouveau moteur `lia_open_loops` : rappel, suivi ou offre d’aide avec échéance, action et confidentialité explicites.
- LIA peut reprendre un sujet ordinaire lorsqu’il devient pertinent, sans attendre une nouvelle question de l’organisateur.
- Anti-harcèlement déterministe : cooldown de 4 h, trois surfaces maximum, pause et parole humaine prioritaires.
- Les sujets personnels/sensibles restent hors des surfaces partagées et doivent utiliser la voie privée.
- Persistance propriétaire Supabase/RLS + fallback local démo ; aucun transcript complet n’est stocké.
- Validation locale V0.196 : **273/273 régressions**, **17/17 gates EAS**, **131 TS/TSX**, **958 clés EN**, audits continuité/hygiène/backend/release/feature/accessibilité PASS ; hygiène source **389 fichiers** ; backend **24 tables client / 17 RPC / 7 Realtime**, migrations **001 → 024**.


## V0.195 — LIA relationnelle + fiche protégée
- Ajout de la situation personnelle à cocher : Célibataire / Marié(e) / Divorcé(e) / En couple.
- Les informations relationnelles manquantes deviennent des lacunes souples : elles ne bloquent pas la fiche ; LIA peut revenir dessus avec tact.
- LIA ne peut jamais parler de couple, divorce, partenaire, enfant ou contact en l’inférant : ces références doivent venir de la fiche structurée.
- Les préférences sociales apprises en conversation restent séparées et ne sont réutilisables que lorsqu’elles ont été confirmées et jugées sûres pour le contexte.
- Ajout de la dictée assistée de fiche sur iOS : LIA transcrit uniquement après action explicite, prépare une proposition et n’écrit rien sans confirmation de l’organisateur.
- L’âge et les numéros manquants restent non bloquants ; une valeur fournie mais invalide ou un numéro dupliqué reste signalé.
- Android reste fail-closed pour la dictée tant que l’autorisation micro native actuelle reste bloquée par configuration.

## V0.194 — notification privée → message privé
- Un tap sur une notification LIA privée ouvre explicitement le message privé référencé dans l’application.
- Le payload système reste limité à `screen: lia-private` + `messageId`; aucun texte sensible n’est ajouté.
- L’ouverture relit le message avec `ownerId + messageId`, donc un identifiant d’un autre compte ne peut pas révéler son contenu.
- Le dernier tap système est effacé après traitement pour éviter de rouvrir le même message au prochain lancement.
- L’onboarding et la fiche famille gardent la priorité : l’écran privé ne s’affiche qu’une fois la session/foyer prêts.
- Validation locale V0.194 : **263/263 régressions**, **17/17 gates EAS**, **122 TS/TSX**, **925 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **375 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.193 — orchestration LIA privée
- Le détail sensible est d’abord enregistré dans l’inbox privée du propriétaire.
- Si l’app est ouverte, LIA reste sur l’écran privé sans créer de notification inutile.
- Si le canal choisi est `private_notification`, la notification reçoit uniquement l’identifiant du message privé et l’aperçu générique validé ; jamais le texte sensible.
- Une permission notification absente ou refusée reste un refus silencieux : aucune demande surprise n’est déclenchée par un message privé.
- Le mode pause/silence reste prioritaire et peut empêcher toute livraison proactive.
- Validation locale V0.193 : **261/261 régressions**, **17/17 gates EAS**, **120 TS/TSX**, **922 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **372 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.192 — panne sponsorisée isolée
- Les recherches organiques et sponsorisées se résolvent séparément.
- Une panne du provider sponsorisé donne simplement zéro carte sponsorisée et ne masque jamais les restaurants organiques valides.
- Une panne du provider organique continue, elle, d’afficher l’erreur Commander normale : aucune disponibilité n’est inventée.
- Aucun changement du classement naturel, du rayon 10 km ou des règles de livraison.
- Validation locale V0.192 : **259/259 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **922 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **370 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.191 — choix explicite « ici ou à la maison »
- Si une adresse courante autorisée diffère de l’adresse du foyer, Commander demande explicitement quelle destination utiliser.
- Tant que le choix n’est pas fait, aucun provider restaurant/livraison n’est interrogé.
- Sans consentement de localisation précise, ou sans adresse courante fiable, aucun choix n’est affiché et l’adresse du foyer reste le fallback normal.
- Une adresse manuelle de session reste possible et ne modifie toujours pas l’adresse du foyer.
- Validation locale V0.191 : **258/258 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **922 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **369 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.190 — impressions sponsorisées visibles uniquement
- Charger une carte sponsorisée ne crée jamais une impression.
- Une impression n’est enregistrée qu’après interaction réelle avec le carrousel lorsque la carte sponsorisée est la carte visible, ou lorsqu’elle est ouverte explicitement.
- Une même campagne/carte n’est comptée qu’une fois par ouverture de l’écran Commander, par prudence contre le gonflement artificiel.
- La mesure reste séparée du provider restaurant et reste soumise au consentement analytics pour la télémétrie produit.
- Validation locale V0.190 : **256/256 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **918 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **368 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.189 — session Commander anti-répétition
- « Autre chose » cherche d’abord une carte encore non vue dans le carrousel actif de la session.
- Les cartes vues sont mémorisées uniquement pendant l’ouverture courante de Commander ; rien n’est envoyé en profil, Mémos ou télémétrie.
- Quand toutes les cartes utiles ont été vues, le carrousel peut recommencer normalement.
- Les commandes suivant/précédent et les ouvertures explicites continuent d’utiliser le même classement existant.
- Validation locale V0.189 : **255/255 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **918 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **367 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.




## V0.188 — LIA pilote le carrousel Commander actif
- Commandes contextuelles : suivant, précédent, ouvre celui-là, ordinal 1→8 et autre chose.
- Le contexte actif vient d’une interaction utilisateur avec le carrousel, jamais de l’auto-défilement.
- Aucun changement du classement naturel, du rayon 10 km, de la vérité livraison ou des règles sponsorisées.
- Validation locale V0.188 : **254/254 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **918 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **366 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.186 — release doctor avec preuve bêta physique
- Nouveau stage `Physical beta evidence` dans le release doctor.
- Les gates 16 scénarios et 53 scénarios sont audités séparément à partir de `.validation/` et restent bloqués sans preuve réelle.
- La validation locale normale reste distincte de la preuve appareil.

## V0.185 — preuve bêta des 53 scénarios
- Le protocole de preuve physique Commander + LIA est maintenant exécutable sans modifier le runtime.
- `feature:beta:template` génère 53 scénarios `pending`; `feature:beta:audit` refuse toute preuve incomplète, sans build, sans révision ou avec moins de deux appareils.
- Le gate reste hors validation locale normale pour préserver la distinction entre tests statiques et preuve physique.
- Validation locale V0.185 : 248/248 régressions, 17/17 gates EAS, 118 TS/TSX, 913 clés EN ; audits PASS.

## V0.184 — matrice d’acceptation versionnée
- 53 scénarios Commander/LIA.
- 33 invariants critiques.
- Gate structurel ajouté à `verify`, sans changer le runtime.
- Les preuves appareils restent séparées et obligatoires avant une bêta déclarée validée.
- Validation locale V0.184 : **246/246 régressions**, **17/17 gates EAS**, **118 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, **53/53 scénarios** de matrice présents dont **33 critiques**, audits continuité/hygiène/backend/release/feature-acceptance PASS ; hygiène source **358 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.183 — consentement/localisation fail-safe
- Consentements analytics, publicité personnalisée et localisation précise : `unknown` par défaut.
- Adresse foyer conservée comme fallback Commander.
- Utilisation de l’adresse courante uniquement avec consentement précis accordé.
- Aucun prompt natif automatique ni historique de déplacement ajouté.
- Validation locale V0.183 : **244/244 régressions**, **17/17 gates EAS**, **118 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **354 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.182 — télémétrie commerciale minimale et privée
- Provider désactivé par défaut, branchement explicite uniquement.
- Allowlist stricte des événements et métadonnées Commander.
- Aucun contenu privé/sensible ni Mémo n’est envoyé.
- Aucun comptage d’impression sponsorisée avant vraie visibilité.
- Validation locale V0.182 : **241/241 régressions**, **17/17 gates EAS**, **116 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **351 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.181 — états Commander sans ambiguïté
- Adresse absente : aucune recherche provider n’est lancée ; l’utilisateur peut définir l’adresse de la session.
- Hors ligne : aucune disponibilité restaurant/livraison n’est présentée comme actuelle.
- Reconnexion : nouvelle vérification automatique sans modifier les règles Commander existantes.
- Les règles V0.170–V0.180 restent inchangées.
- Validation locale V0.181 : **239/239 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **349 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.180 — navigation explicite des Mémos liés
- Un Mémo lié peut ramener vers l’espace existant correspondant après pression explicite.
- Aucun auto-launch, aucun flux parallèle et aucun mélange Favoris/Mémos.
- Les liens `other` restent seulement informatifs.
- Validation locale V0.180 : **237/237 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **909 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **348 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.179 — Mémos liés sans automatisme
- Les Mémos privés peuvent porter un lien structuré facultatif (`kind`, `ref`, `label`) vers l’objet utile concerné.
- Aucun transcript/confidence n’est enregistré par cette évolution.
- L’absence de lien reste valide ; l’affichage est informatif uniquement.
- Favoris restaurants et Mémos restent deux concepts séparés.
- Backend : migration 021 additive sur `lia_memos`, RLS propriétaire inchangée.
- Validation locale V0.179 : **235/235 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **908 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **347 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.178 — confidentialité contextuelle LIA
- Sujet sensible : canal privé obligatoire, jamais voix, même en mode social/table.
- Hors écran : notification discrète avec aperçu générique ; le détail privé reste dans une inbox propriétaire.
- La pause proactive garde la priorité et aucune permission notification surprise n’est déclenchée.
- Aucun signal sensible n’est ajouté à Commander ou à la publicité.
- Validation locale V0.178 : **232/232 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **907 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **345 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

# État de projet — Notre Table




















## V0.177 — garde commerciale locale
- Modèle de campagne sponsorisée distinct du classement organique.
- Filtrage 10 km, fenêtre active, budget/schedule provider, catégorie et fréquence quotidienne.
- Intercalage sponsorisé après au moins deux cartes naturelles, jamais en première position.
- Compteur d’impression explicite, non déclenché au préchargement.
- Aucun signal sensible admis dans le contexte publicitaire.

## V0.176 — providers multiples sans dépendance unique
- Discovery organique multi-source avec `Promise.allSettled` et séparation sponsorisée maintenue.
- Dédoublonnage exact et conservateur ; première source canonique.
- Vérification livraison multi-provider en cascade uniquement sur les lignes encore inconnues.
- Plusieurs chemins de commande vérifiés peuvent coexister sur une même fiche.
- Validation locale V0.176 : **225/225 régressions**, **17/17 gates EAS**, **111 TS/TSX** sans erreur de transpilation, **905 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **339 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.175 — fiche restaurant + handoff de commande
- La fiche détail peut exposer téléphone, image, ETA min/max, frais et minimum uniquement quand un provider vérifié les fournit.
- Frais/minimum nécessitent une devise explicite ; aucun montant commercial n’est synthétisé.
- Appeler et Commander restent conditionnels à des cibles réellement disponibles.
- Retour depuis la fiche : adresse, filtres, position de liste et carte active sont conservés.
- Validation locale V0.175 : **221/221 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **905 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **337 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.174 — distance Commander + carrousel proche
- Distance réelle calculée depuis l’adresse active pour les résultats Google.
- Champ facultatif `distanceKm` dans le contrat Commander.
- Nouveau carrousel « À moins de 3 km » trié par distance.
- Distance visible sur carte/carrousel/fiche et toujours séparée de la vérité de livraison.

## V0.173 — provider de vérification livraison séparé
- La découverte organique, l’inventaire sponsorisé et la confirmation de livraison sont trois frontières indépendantes.
- Le provider de livraison enrichit uniquement des restaurants déjà découverts et ne peut pas créer d’établissement.
- `unavailable` est éliminé ; absence de réponse ou panne ne devient jamais une confirmation.
- ETA/frais/minimum/lien de commande ne sont enrichis que par données explicitement fournies.
- Aucun provider de livraison réel n’est activé à ce checkpoint.
- Validation locale V0.173 : **215/215 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **335 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.172 — Google Places serveur + séparation organique/sponsorisé
- Découverte Google Places derrière l’Edge Function authentifiée `commander-search`, clé Google exclusivement serveur et activation mobile opt-in.
- Rayon serveur <= 10 km ; `delivery=unknown` et `orderUrl=null` pour toute découverte Google.
- Attribution Google Maps affichée près du contenu ; aucune photo/review demandée.
- Favoris Google : stockage durable limité à provider/Place ID, avec garde serveur migration 020.
- Provider organique et provider sponsorisé séparés ; sans provider sponsorisé vérifié, aucune offre sponsorisée n’apparaît.
- Validation locale V0.172 : **212/212 régressions**, **17/17 gates EAS**, **110 TS/TSX**, **897 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **334 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**. Aucun appel Google réel, déploiement Edge ou appareil physique revendiqué.

## V0.171 — Favoris restaurants privés dans Commander
- Un restaurant vérifié peut être ajouté ou retiré des **Favoris** depuis sa fiche Commander.
- **Favori ≠ Mémo** : les favoris restent un état restaurant privé et ne créent jamais un Mémo LIA.
- En mode démo, les favoris restent locaux ; avec Supabase, la migration `202609160019_commander_favorites.sql` applique une RLS strictement propriétaire (`user_id = auth.uid()`).
- Le bouton Favori annonce correctement ses états `selected`, `disabled` et `busy`, et toute erreur est annoncée comme alerte accessible.
- Aucune donnée restaurant n’est inventée : la fonction ne s’applique qu’à une fiche issue du provider Commander.
- Validation locale V0.171 : **206/206 régressions**, **17/17 gates EAS**, **108 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 019**. Le build installé, Supabase distant et les appareils physiques ne sont pas revendiqués.

## V0.170 — destination Commander modifiable par session
- L’adresse du foyer reste le défaut.
- L’utilisateur peut saisir une autre adresse uniquement pour la recherche Commander en cours.
- Le changement de session ne persiste pas sur le foyer et relance le provider avec le plafond 10 km.
- Validation locale V0.170 : **204/204 régressions**, **17/17 gates EAS**, **107 TS/TSX** sans erreur de transpilation, **892 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **326 fichiers** ; backend **21 tables client / 17 RPC / 7 Realtime**, migrations **001 → 018**. Le build installé, Supabase distant et les appareils physiques ne sont pas revendiqués.

## V0.169 — destination foyer prête pour Commander
- Création du foyer : adresse de livraison facultative, sans blocage si vide.
- `households.delivery_address` est ajouté par migration 018 ; les anciens foyers restent compatibles avec `NULL`.
- Le service Commander reçoit l’adresse du foyer et applique toujours la limite maximale de 10 km avant d’appeler un provider.
- Aucun provider réel n’est inventé : sans intégration vérifiée, la liste reste vide.
- Validation locale V0.169 : 202/202 régressions, 17/17 gates EAS, 107 TS/TSX, 883 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 325 fichiers. Backend : 21 tables client / 17 RPC / 7 Realtime ; migrations 001 → 018.

## V0.168 — navigation Commander complète sur données vérifiées
- Commander utilise désormais des carrousels horizontaux avec swipe, pagination et auto-défilement respectant Reduce Motion.
- Une interaction utilisateur stoppe l'auto-défilement ; 1 à 2 résultats restent une liste courte.
- Une fiche détail restaurant est disponible, avec commande externe uniquement si un lien vérifié existe.
- Le provider reste volontairement vide tant qu'une source réelle n'est pas connectée : aucune donnée locale n'est inventée.
- Aucune règle ou fonction de V0.167 n'est retirée ou réinterprétée.

## V0.167 — Mémos + Commander + âge enfant facultatif
- V0.166 reste la base de travail et ses fonctions existantes sont conservées.
- L’âge d’un enfant peut rester vide sans bloquer la fiche ; un âge saisi reste validé. LIA explique que l’âge aide seulement à situer les enfants dans la hiérarchie familiale.
- Une seconde présentation LIA, validée produit, apparaît une fois après la fiche famille de l’administrateur.
- Mémos : espace privé à sauvegarde explicite, aucun enregistrement automatique, stockage local démo + table Supabase RLS privée.
- Commander : surface LIA additive, rayon maximal 10 km, catégories prêtes, aucune disponibilité inventée sans provider réel.
- Navigation historique inchangée ; Mémos et Commander sont ouverts depuis le panneau LIA.
- Backend : nouvelle migration 017 pour `lia_memos` et l’âge enfant optionnel.
- Validation locale V0.167 : 198/198 régressions, 17/17 gates EAS, 105 TS/TSX, 858 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 320 fichiers. Backend : 21 tables client / 17 RPC / 7 Realtime ; migrations 001 → 017. Build installé, Supabase distant et appareils restent à prouver.

## V0.166 — fiche famille + proactivité respectueuse + confidente
- LIA ouvre une fiche famille au lieu de poser les informations structurées une par une.
- Organisateur/adultes : prénom, âge, téléphone ; enfants : prénom, âge et téléphone seulement s'ils en ont un ; autres personnes : lien familial explicite.
- Validation avant sauvegarde : champs manquants, âge invalide, téléphone invalide ou dupliqué, lien manquant.
- RPC `complete_household_family_setup` transactionnelle ; roster léger réutilisé comme source des personnes sans compte.
- Rappel LIA vers midi si l'app n'a pas été ouverte ; ouverture de l'app annule le rappel du jour.
- Silence : aujourd'hui / N jours / jusqu'à nouvel ordre. Silence demandé = respect immédiat, sans humour. Retour anticipé comique seulement pour une pause avec échéance.
- Conversation : confidente, ménagère ou les deux ; le repas n'est proposé comme pont relationnel que s'il peut concrètement aider.
- Backend : 20 tables client / 17 RPC / 7 Realtime ; migrations 001 → 016.
- Validation locale V0.166 : 196/196 régressions, 17/17 gates EAS, 99 TS/TSX, 818 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 312 fichiers.

## V0.165 — LIA prend en charge le premier contexte du foyer
- Les anciens foyers restent hors onboarding ; seuls les foyers nouvellement créés entrent dans le setup LIA.
- Deux questions : comment appeler l’organisateur, puis combien de personnes mangent habituellement à la maison.
- Aucun paywall ni création de membre premium dans cette étape.
- `default_party_size` alimente immédiatement la valeur de portions par défaut du planning.
- État serveur via `setup_completed` + RPC admin `complete_household_setup` ; migration 015 additive.
- Validation locale V0.165 : 193/193 régressions, 17/17 gates EAS, 96 TS/TSX, 767 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 307 fichiers.
- Backend : 20 tables client / 16 RPC / 7 Realtime ; migrations 001 → 015.

## V0.164 — premier contact vocal de LIA
- Après le choix de langue, LIA se présente dans cette langue avec la synthèse vocale native locale.
- Auto-présentation unique seulement hors lecteur d’écran ; contrôle Écouter/Arrêter toujours visible quand la couche native est disponible.
- La voix est coupée en quittant l’écran ou en continuant.
- Le parcours reste : langue → LIA → compte → foyer ; aucun paywall n’est injecté avant la découverte réelle du produit.
- Validation locale V0.164 : 191/191 régressions, 17/17 gates EAS, 95 TS/TSX, 751 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 304 fichiers.
- Le build natif et la voix réelle sur téléphone restent à tester ; aucun succès appareil n’est revendiqué.

## V0.163 — identité vocale LIA à valider à l’oreille
- Trois candidates A/B/C sont proposées à partir des voix natives disponibles dans la langue courante.
- La comparaison utilise une phrase identique et trois prototypes de réaction : sourire, petit rire, rire bref.
- Le choix de voix est persisté par appareil. Un changement de voix invalide automatiquement l’autorisation des rires.
- Le moteur social refuse tout rire vocal tant que l’utilisateur n’a pas explicitement approuvé les réactions de la voix choisie.
- Les prototypes actuels utilisent le TTS natif ; aucun rire studio définitif n’est prétendu validé avant écoute réelle sur appareil.
- Validation locale V0.163 : 189/189 régressions, 17/17 gates EAS, 95 TS/TSX, 745 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 303 fichiers.

## V0.162 — classificateur audio Android local prêt à être vendored
- Le module Android possède maintenant un vrai pipeline `AudioClassifier` + `TensorAudio` + `AudioRecord` basé sur YAMNet/TFLite, exécuté sur un thread périodique hors UI.
- Seul le meilleur label au-dessus du seuil est envoyé au runtime LIA ; aucune donnée audio brute n'est persistée ni envoyée au cloud.
- Le modèle Android est verrouillé par taille + SHA-256 avant vendoring.
- Le checkpoint reste fail-closed : le modèle n'est pas présent dans ce snapshot et Android garde `RECORD_AUDIO` bloqué jusqu'au build où le modèle officiel aura été vérifié et inclus.
- Le vrai Gradle/prebuild/build Android et l'étalonnage sur téléphone restent obligatoires avant activation production.
- Validation locale V0.162 : 187/187 régressions, 17/17 gates EAS, 95 TS/TSX, 728 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 302 fichiers.

## V0.161 — voix native et écoute sociale iOS
- LIA possède maintenant un module natif propre : AVSpeechSynthesizer sur iOS et TextToSpeech sur Android, sans TTS cloud obligatoire.
- Le panneau LIA peut tester/changer la voix disponible dans la langue courante.
- iOS dispose d'un chemin Sound Analysis local pour rire/parole, uniquement après action explicite et permission micro.
- La parole humaine annule la réaction sociale en attente et interrompt la voix de LIA.
- Aucun audio ambiant n'est envoyé au cloud pour cette classification.
- Android garde RECORD_AUDIO bloqué : voix oui, écoute sociale non tant que son classificateur local n'est pas intégré.
- Validation locale V0.161 : 186/186 régressions, 17/17 gates EAS, 95 TS/TSX, 728 clés EN, audits continuité/hygiène/backend/release PASS ; hygiène source 296 fichiers.
- Validation appareil native non encore prouvée ; V0.161 reste un checkpoint de code/contrat jusqu'au vrai build.

## V0.160 — présence sociale de LIA
- Le comportement social du rire est maintenant défini et testable : LIA ne réagit jamais automatiquement à chaque rire.
- Réaction possible uniquement dans une session Cuisine / À table explicitement active, avec consentement micro et classificateur local disponible.
- La parole humaine, une interruption ou un contexte sensible ont toujours priorité et annulent la réaction.
- Le moteur applique seuil de confiance, silence post-rire, cooldown 45 s et budget de réactions (Présente 2/10 min, Animatrice 3/10 min, Discrète 0).
- Aucun audio ambiant ne doit être envoyé au cloud pour la détection du rire.
- Le chemin natif est défini (Apple Sound Analysis / MediaPipe Audio Classifier), mais pas encore intégré : `RECORD_AUDIO` reste bloqué jusqu'à un vrai module local testé.
- Validation locale V0.160 : 183/183 régressions, 17/17 gates EAS, 92 TS/TSX, 716 clés EN, audits continuité/hygiène/backend/release PASS.

## V0.159 — découverte LIA protégée avant abonnement
- Le premier contact pré-auth reste local : aucun coût IA cloud obligatoire pour un simple téléchargement.
- Après authentification et avant achat, LIA peut utiliser quelques appels cloud de démonstration dans une enveloppe d’acquisition à vie de 0,05 USD par compte.
- `src/lib/liaDiscovery.ts` sépare explicitement `local_intro`, `cloud_normal`, `cloud_economy`, `local_only` et `subscriber`.
- Le backend possède un compteur service-only et une réservation transactionnelle/idempotente de coût (`reserve_lia_discovery_budget`) ; le mobile ne peut pas s’accorder lui-même du budget.
- Les abonnés ne sont jamais enfermés dans le budget découverte : ils utilisent la politique normale de LIA par foyer.
- Le fournisseur IA réel n’est toujours pas connecté dans ce checkpoint ; avant tout branchement, l’appel payant devra passer par la réservation serveur et le futur endpoint ajoutera un rate limiting anti-multi-comptes.
- Validation locale V0.159 : 180/180 régressions, 17/17 gates EAS, 91 TS/TSX, 716 clés EN, audits continuité/hygiène/backend/release PASS.

## V0.158 — premier contact : langue puis LIA
- Le premier écran du premier lancement est désormais le choix explicite de langue.
- La sélection est persistée séparément du fallback système afin qu'une langue d'appareil détectée ne soit jamais confondue avec un choix utilisateur.
- Après validation, LIA se présente immédiatement dans la langue choisie avant l'authentification et la création du foyer.
- Le contrat de présentation de LIA est centré sur l'aide : comprendre le but, proposer le prochain coup de main utile, mémoriser le contexte nécessaire et accompagner jusqu'à l'action.
- Langues actuellement rendues sélectionnables : FR / EN / ES / HE, car ce sont les seules dont le runtime complet est localisé aujourd'hui.
- IT / PT-BR / AR restent décidées pour l'expansion, mais sont volontairement masquées tant que la traduction complète n'est pas prête.
- Aucun microphone ou TTS n'est activé par ce changement ; la voix reste un chantier séparé à intégrer avec contrôle explicite.

## V0.157 — abonnement durable et économie de LIA
- Une seule LIA fonctionnelle dans toutes les durées d’abonnement ; la durée change, pas la qualité de l’assistant.
- Prix de référence business : 6,99 $ mensuel ; 34,99 $ six mois ; 59,99 $ annuel. Les Stores restent source de vérité pour les prix localisés en production.
- Le paywall supporte désormais trois packages RevenueCat/Store (`monthly`, `semiannual`, `annual`) et fail-closed si la grille attendue n’est pas disponible.
- Nouveau module `src/lib/liaEconomics.ts` : coût mensuel estimé par foyer et projection flotte, avec cible interne 1 $/mois/foyer.
- À 0,75 $ le routage passe en mode économie ; à 1 $ il protège la marge pour les usages coûteux non essentiels. Les aides essentielles ne sont jamais bloquées par cette logique.
- Les tarifs API fournisseurs sont injectés dans le calcul et ne sont pas figés dans le client.

## V0.156 — cuisiner avec ce que j’ai, lot de photos cumulatives

### Reconnaissance internationale
- La photo du frigo/placard utilise un contrat multi-source : vision + OCR + code-barres + catalogue + mémoire.
- La langue et la région servent de contexte, mais un produit peut être détecté dans une autre langue.
- Les produits sont ramenés vers une clé d’ingrédient neutre, tout en conservant le libellé original.
- Les niveaux de reconnaissance sont `exact_product`, `ingredient`, `category`, `unknown`; l’incertitude déclenche une confirmation courte au lieu d’une invention.
- Plusieurs photos appartiennent à la même session et s’additionnent ; elles ne se remplacent jamais.

- La fonction est intégrée à Recettes/Cuisiner, pas dans un nouvel onglet.
- L’organisateur peut prendre plusieurs photos successives du frigo et du placard : porte, étagères, bacs, niveaux.
- Une nouvelle photo s’ajoute aux précédentes ; elle ne les efface jamais.
- L’analyse fusionne les doublons mais conserve tous les produits uniques pour calculer les recettes.
- L’interface ne montre qu’un résumé compact pour ne pas devenir brouillonne ; le moteur garde pourtant l’ensemble détecté.
- Maximum 3 idées de repas affichées.
- La reconnaissance vision réelle dépend encore d’un endpoint externe configuré ; le mode démo reste disponible.
- Le parcours est conversationnel : Notre Table demande comment commencer puis, après une photo, « Tu veux compléter ? » au lieu d’afficher un formulaire technique.
- L’organisateur peut compléter la session par une nouvelle photo, une image existante ou une saisie manuelle courte ; tout est fusionné dans le même lot.
- Les produits reconnus avec une confiance insuffisante sont isolés : ils ne servent pas au matching recette tant que l’organisateur ne les a pas confirmés.
- Le flux partage maintenant le contexte du dîner : avant de proposer une recette, Notre Table cherche le nombre de convives déjà planifié. S’il manque, l’organisateur peut demander à la famille ou indiquer directement combien ils seront.
- Les réponses familiales sont montrées comme contexte mais ne sont pas transformées silencieusement en nombre définitif tant que le total réel n’est pas certain (réponses manquantes / « peut-être » / organisateur non compté).
- Les quantités détectées sur photo sont conservées seulement quand elles sont estimables ; une quantité inconnue reste `null` avec sa confiance séparée.
- Les quantités des recettes sont mises à l’échelle selon `convives / portions de base`. Le moteur distingue produit absent, quantité insuffisante, quantité inconnue et quantité suffisante.
- Validation locale après ce lot interactif : 167/167 régressions, audit projet PASS, audit hygiène source PASS, 86 TS/TSX transpillés sans erreur, 690 clés EN avec parité.

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
