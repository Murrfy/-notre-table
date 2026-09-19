# Notre Table — V0.299


## V0.299 — LIA accompagne toute l’appli sans devenir envahissante

V0.299 généralise le guidage contextuel inauguré avec Message famille. La première fois qu’une grande fonction est ouverte — **Planning, Courses, Recettes, Famille, Commander ou Mémos** — LIA donne une explication courte, personnalisée avec le prénom réel de la cliente lorsqu’il est disponible, puis considère cette présentation comme acquise.

Après cette première fois, LIA ne récite plus le mode d’emploi. Sur les parcours où un blocage est objectivement détectable, elle suit la progression réelle : Planning sans plat choisi, Courses vide ou produit saisi non validé, création d’un Mémo incomplète, Commander bloqué sur la localisation ou l’adresse. Une progression à l’écran réinitialise l’attente ; LIA aide sur **une seule étape**, puis se tait. Recettes et Famille bénéficient de l’explication initiale mais aucun faux blocage n’est déduit tant qu’un signal suffisamment fiable n’existe pas.

Le moteur reste celui de LIA déjà présent dans l’application et conserve le suivi V0.298 quand toutes les réponses famille sont arrivées. Le formulaire d’inscription reste court : l’enrichissement progressif anniversaire / plat préféré continue ensuite une petite question à la fois, toujours facultative et espacée.

## V0.298 — LIA reprend le fil quand les réponses famille sont arrivées

V0.298 prolonge V0.297 : quand toutes les personnes **à qui la demande a réellement été envoyée** ont répondu dans Message famille, LIA reprend le fil avec la cliente. Elle résume les choix nominatifs une seule fois, tient compte d’une éventuelle direction « facile » ou « épater la galerie », puis demande si l’on continue maintenant ou plus tard.

LIA ne transforme jamais ce résumé en vote automatique : si les choix divergent, elle ne désigne pas de gagnant. Un consensus peut être constaté, mais ne déclenche ni commande, ni planning, ni achat sans demande explicite. Si quelqu’un a coché « Je m’occupe de tout », le suivi de fin de réponses est supprimé parce que le repas est déjà considéré comme pris en charge.

Le suivi est dédupliqué localement par question. Une nouvelle ronde Message famille réarme le mécanisme dès que les réponses redeviennent incomplètes, tandis qu’une simple modification d’un choix après que tout le monde a répondu ne provoque pas une nouvelle annonce mécanique.

## V0.297 — « Facile ou épater la galerie ? » a maintenant de vraies conséquences

V0.297 reprend V0.296 et rend le rebond de LIA après un choix **Plat fait maison** réellement actionnable. Quand LIA demande « facile ou épater la galerie ? », la réponse peut être « facile », « épater la galerie » ou « plus tard / attends les autres ». Un choix clair est enregistré sur le repas familial en cours ; « plus tard » ferme simplement la question sans inventer de préférence.

La direction **facile** ou **épater** devient un fait du repas visible par le contexte de planification de LIA. Elle peut donc orienter ses futures propositions de la journée sans reposer la même question à chaque nouvelle réponse familiale. Si le Message famille est reconfiguré, cette direction est remise à zéro. Si quelqu’un prend entre-temps le repas entièrement en charge, LIA abandonne cette clarification et cesse les relances d’organisation inutiles.

## V0.296 — LIA apprend les goûts petit à petit

V0.296 généralise le moteur d’enrichissement progressif créé pour les anniversaires. Le formulaire initial reste court : après les dates d’anniversaire, LIA peut apprendre un deuxième fait familial utile, **le plat préféré de chacun**, toujours dans un moment calme et jamais sous forme de questionnaire massif.

La cadence reste stricte : une seule petite question à la fois, au moins 48 heures entre deux initiatives, possibilité de répondre « plus tard » ou de refuser, et aucune inférence silencieuse. Une réponse comme « elle adore les lasagnes » enregistre seulement **lasagnes** comme fait explicitement confirmé.

L’information devient utile sans devenir autonome : à l’approche d’un anniversaire, si LIA sait que la personne adore un plat précis, elle peut le proposer comme simple piste — « Je sais que Myriam adore le couscous… ça peut nous donner une idée » — mais elle ne crée jamais de repas, rappel, achat ou réservation sans demande explicite.

## V0.295 — LIA utilise les anniversaires qu’elle a appris

V0.295 donne une utilité concrète aux anniversaires collectés progressivement en V0.294. Quand l’application est ouverte dans un moment calme, LIA peut signaler un anniversaire dans les sept jours, puis le jour même. Elle ne mentionne jamais l’âge et ne crée aucun rappel, achat, réservation ou repas sans demande explicite.

L’intervention reste légère : « L’anniversaire de Myriam approche… si tu veux prévoir quelque chose, je suis là. » Le jour J, LIA peut souhaiter l’anniversaire ou proposer de rendre le repas un peu spécial. Chaque étape — « à venir » et « aujourd’hui » — n’est dite qu’une fois par personne et par anniversaire. Si un anniversaire mérite une intervention, LIA ne pose pas en plus une nouvelle question de profil dans le même moment calme.

## V0.294 — LIA accompagne l’utilisation et apprend la famille progressivement

V0.294 transforme Message famille en tableau vivant : les choix actifs sont uniquement **Fait maison, Pizza, Pâtes, Sushi et Chinois**. Chaque destinataire peut modifier sa réponse jusqu’à l’expiration du lien, et chacun voit les choix nominatifs des autres ainsi que les totaux. « Surprends-moi » est retiré du modèle actif. « Je m’occupe de tout » reste une décision séparée du choix de repas et ne peut avoir qu’un seul responsable à la fois.

LIA n’est plus un tutoriel récité. À la première utilisation, elle explique brièvement comment utiliser Message famille ; ensuite elle se tait si la personne avance normalement et intervient seulement si elle semble bloquée. Quand une réponse réelle arrive, LIA peut réagir : **Fait maison** déclenche un accompagnement du type « facile ou épater la galerie ? » ; **Je m’occupe de tout** fait considérer le repas comme pris en charge et coupe les relances d’organisation inutiles. L’humour reste contextuel, par exemple « n’oubliez pas de m’inviter à table 😏 », jamais mécanique.

Le formulaire initial reste court. LIA peut ensuite compléter doucement le profil familial, une petite question à la fois, dans un moment calme. Le premier fait ajouté est l’anniversaire : jour et mois suffisent, l’année reste facultative. Elle peut demander « Au fait, pour que je pense aux anniversaires… c’est quand celui de Myriam ? Le jour et le mois me suffisent. Et le poids… non je plaisante 😏 ». Ces initiatives sont espacées, peuvent être repoussées ou refusées, et réutilisent le même moteur vocal LIA.

## V0.293 — « Il me manque du lait » puis « ajoute-le aux courses »

V0.293 prolonge V0.292 sans rendre une simple phrase de manque dangereuse. « LIA, il me manque du lait » ne modifie toujours rien : LIA garde seulement « lait » dans un contexte de session pendant deux minutes et l’explique à l’utilisateur. Si l’utilisateur enchaîne ensuite par « ajoute-le aux courses », cet ordre explicite réutilise le manque récent et passe par l’action `shopping.add_item` existante.

Le contexte n’est jamais écrit en stockage persistant, expire automatiquement et peut être annulé. Si le contexte n’existe plus, « ajoute-le aux courses » redevient une demande incomplète et LIA demande quoi ajouter au lieu de deviner. L’exécution finale reste obligatoirement confiée à `executeLiaAssistantApprovedAction`.

## V0.292 — Dire naturellement qu’un ingrédient manque et l’ajouter aux courses

V0.292 reprend le moteur d’actions LIA existant au lieu de créer une logique spéciale cuisine. Une formulation comme « LIA, il me manque du lait, ajoute-le aux courses » ou « je n’ai plus d’œufs, mets-les dans la liste de courses » devient une vraie action `shopping.add_item`.

Le garde-fou reste strict : une simple constatation comme « il me manque du lait » ne modifie rien. L’utilisateur doit explicitement demander l’ajout aux courses. L’écriture passe ensuite par la frontière d’actions approuvées déjà utilisée par Notre Table et ne produit jamais de faux succès.

## V0.291 — « Et le lait ? » garde le même nombre de personnes

V0.291 reprend V0.290 et rend le contexte de portions encore plus naturel. Après une demande comme « combien de farine pour 6 personnes ? », LIA comprend désormais « et le lait ? » et réutilise automatiquement les 6 personnes. Le même principe fonctionne avec les autres langues déjà prises en charge par le parseur court.

Le suivi ne s’active que dans la fenêtre cuisine récente de deux minutes. Le mot proposé doit correspondre à un ingrédient réel de la recette ouverte ; sinon LIA ne fabrique pas de correspondance. Le contexte reste en mémoire de session uniquement et réutilise le même pipeline vocal global.

## V0.290 — « Et pour 8 ? » sans tout répéter

V0.290 reprend V0.289 et rend les demandes de portions réellement conversationnelles. Après une question comme « combien de farine pour 6 personnes ? » ou « adapte les ingrédients pour 6 personnes », LIA comprend désormais un suivi court comme « et pour 8 ? » ou « and for six? » sans obliger l’utilisateur à répéter l’ingrédient ou toute la commande.

Le contexte reste strictement local au mode cuisine et expire après deux minutes. Une valeur isolée comme « 8 » n’est jamais interprétée comme une commande. Le micro global de LIA reste le seul pipeline d’écoute : pendant cette courte fenêtre il accepte le suivi sans nouveau « LIA », puis revient automatiquement au comportement normal.

## V0.289 — Adapter toute la liste d’ingrédients

V0.289 reprend V0.288 sans modifier la recette enregistrée. En mode cuisine, LIA comprend désormais des demandes comme « adapte les ingrédients pour 6 personnes » ou « adjust the ingredients for 8 servings » et recalcule à la volée toutes les quantités qui disposent d’une base exacte.

Le calcul reste déterministe : quantité enregistrée × portions demandées / portions de base. Si certaines quantités manquent, LIA donne d’abord celles qu’elle peut calculer exactement, signale les ingrédients incomplets puis demande l’autorisation avant d’approximer uniquement ce qui manque. Si les portions de base sont absentes, elle demande aussi l’accord avant toute approximation. Les valeurs approximatives restent clairement séparées des données réelles de la recette et ne sont jamais enregistrées.

## V0.288 — Adapter une quantité à un nombre de personnes

V0.288 reprend V0.287 sans modifier la recette ni créer d’état parallèle. Pendant le mode cuisine, LIA peut maintenant répondre à une demande ciblée comme « combien de farine pour 6 personnes ? » ou « how much milk for six people? ».

Le calcul exact reste une proportion stricte entre la quantité enregistrée, le nombre de portions réel de la recette et le nombre de personnes demandé. Si la quantité de l’ingrédient ou le nombre de portions de base manque, LIA explique ce qui manque puis demande : « Tu veux que je te fasse une approximation ? ». Aucune approximation n’est produite sans un « oui » explicite. Après accord, LIA donne une estimation prudente, clairement annoncée comme approximative et séparée des données réelles de la recette. La cible reste bornée de 1 à 50 personnes.

## V0.287 — Demander une quantité d’ingrédient à LIA

V0.287 reprend V0.286 sans créer de nouveau moteur cuisine. Pendant une recette ouverte, LIA comprend désormais des questions ciblées comme « combien de farine ? », « il faut combien d’œufs ? » ou « how much milk do I need? ».

La réponse est calculée uniquement depuis les ingrédients réellement enregistrés dans la recette ouverte. Si l’ingrédient n’est pas présent, si sa quantité n’est pas renseignée ou s’il apparaît plusieurs fois avec des usages potentiellement différents, LIA le dit explicitement au lieu d’inventer ou d’additionner silencieusement des valeurs.

## V0.286 — Aller directement à une étape précise

V0.286 reprend V0.285 sans modifier la navigation séquentielle déjà validée. LIA comprend maintenant des demandes explicites comme « va à l’étape 4 », « reviens à l’étape deux » ou « go to step three » et ouvre directement l’étape réelle correspondante.

Le numéro peut être dicté en chiffres ou avec les nombres courants reconnus en français, anglais, espagnol et hébreu. Une étape hors limites n’est jamais rabattue silencieusement sur la première ou la dernière : l’état reste inchangé et LIA annonce le nombre réel d’étapes de la recette.


## V0.285 — Le mode cuisine peut se terminer entièrement à la voix

V0.285 reprend V0.284 et ajoute une sortie mains libres explicite du mode cuisine. LIA comprend « j’ai fini la recette », « termine la recette », « ferme la recette » ou « quitte le mode cuisine », puis ferme la surface existante et confirme la fin.

La fermeture n’est jamais déclenchée par un vague « j’ai fini » : le mot recette ou l’expression mode cuisine reste nécessaire afin d’éviter une sortie accidentelle au milieu d’une préparation. Aucun état de recette n’est inventé et aucune nouvelle surface n’est créée.


## V0.284 — « J’ai fini cette étape » devient une vraie commande mains libres

V0.284 reprend V0.283 sans modifier le moteur cuisine existant. Pendant une recette ouverte, LIA comprend maintenant des formulations explicites comme « j’ai fini cette étape », « étape terminée » ou « done with this step ». La commande avance uniquement vers l’étape réelle suivante et LIA lit immédiatement cette instruction.

La navigation reste strictement bornée : si l’utilisateur est déjà sur la dernière étape, aucun index supplémentaire n’est créé et LIA indique simplement qu’il s’agissait de la dernière étape. Aucun nouvel écran, aucun second pipeline vocal et aucun état persistant ne sont ajoutés.


## V0.283 — LIA sait dire exactement où vous en êtes dans la recette

V0.283 reprend V0.282 sans reconstruire le mode cuisine. LIA comprend maintenant « on en est où ? », « je suis à quelle étape ? » et « il reste combien d’étapes ? ». Elle répond à partir de l’index réel de la recette ouverte et relit l’instruction courante.

La question sur le nombre d’étapes est volontairement prioritaire sur le raccourci « il reste combien ? » du minuteur : « il reste combien d’étapes ? » ne peut donc plus être interprété comme une demande de temps restant. Aucun nouvel état n’est créé.

## V0.282 — Les ingrédients deviennent réellement mains libres

V0.282 reprend V0.281 sans reconstruire le mode cuisine. Pendant une recette ouverte, LIA comprend désormais « montre-moi les ingrédients », « cache les ingrédients » et « lis-moi les ingrédients ». L’affichage utilise le panneau d’ingrédients déjà présent ; aucune nouvelle surface ni aucun second pipeline vocal n’est créé.

Quand l’utilisateur demande la liste oralement, LIA lit uniquement les ingrédients réellement enregistrés dans la recette, avec les quantités disponibles. Si la recette n’a aucun ingrédient renseigné, elle le dit au lieu d’inventer une liste. Les commandes restent locales au mode cuisine et continuent de passer par la session LIA globale.

## V0.281 — Le mode cuisine comprend mieux les commandes naturelles

V0.281 reprend V0.280 sans reconstruire l’application. Dans une recette ouverte, LIA comprend maintenant « étape précédente », « il reste combien ? » et « annule / arrête le minuteur ». Ces commandes passent par le même handler de session cuisine déjà raccordé au micro global.

L’annulation d’un minuteur de recette est volontairement traitée avant l’ordre générique « arrête / silence » : LIA annule donc bien le chrono demandé au lieu de simplement cesser de parler. Le retour à l’étape précédente reste borné à la première étape et ne crée aucun état parallèle.

## V0.280 — Le mode cuisine utilise enfin le micro global de LIA

V0.280 reprend V0.279 sans reconstruire l’application. Lorsqu’une recette est en mode cuisine, les commandes directes « LIA, répète », « étape suivante », « il reste combien ? » ou « mets 5 minutes » sont désormais exécutées par le moteur mains libres déjà présent, via le micro global de LIA. Aucun second micro ni second bouton d’assistante n’est nécessaire.

Les commandes restent locales et bornées : navigation d’étapes et minuteur de recette. Une demande musique non gérée par le moteur cuisine retombe vers le moteur musique global. « Silence / tais-toi » ne provoque pas une réponse supplémentaire.

## V0.279 — LIA ouvre ou lance directement la recette ciblée

V0.279 reprend V0.278 sans reconstruire l’application. Après un scan, « ouvre cette recette » ouvre directement la fiche de la recette ciblée et « lance / commence cette recette » démarre son mode cuisine. La recette est résolue depuis le contexte visuel confirmé ; si plusieurs recettes restent possibles, LIA demande laquelle.

La navigation reste entièrement interne à Notre Table. Le flux ferme proprement la surface « Avec ce que j’ai », sélectionne la recette déjà chargée et ne dépend d’aucun lien externe.

## V0.278 — Une recette vue peut être planifiée par pronom

V0.278 reprend V0.277 sans reconstruire l’application. Après un scan et une recette ciblée, LIA comprend désormais des demandes comme « mets-la au dîner demain » ou « planifie cette recette ce soir ». Le pronom est résolu uniquement depuis le contexte visuel confirmé de la session.

Si plusieurs recettes restent possibles et qu’aucune n’a été ciblée, LIA demande laquelle. Une fois la recette résolue, la demande est transmise au moteur de planning existant, qui conserve ses clarifications minimales sur le jour ou le repas. Aucun nouveau moteur de planning parallèle n’est créé.

## V0.277 — Les manquants d’une recette vue peuvent aller directement aux courses

V0.277 reprend V0.276 sans reconstruire l’application. Après un scan et une proposition de recette, une demande explicite comme « ajoute ce qui manque aux courses » ajoute les ingrédients manquants à la liste de courses de la semaine active. Si LIA vient de détailler une recette, elle devient la référence de session. Sinon, plusieurs recettes possibles déclenchent une seule clarification ciblée au lieu d’un choix silencieux.

L’écriture passe par la même frontière d’actions approuvées que les autres actes Notre Table. Les ajouts sont bornés, normalisés par rayon et une réussite partielle est annoncée comme telle. Si rien ne manque pour la recette, LIA le dit et n’écrit rien.

## V0.276 — Un scan peut devenir le stock seulement sur ordre explicite

V0.276 reprend V0.275 sans reconstruire l’application. Après un scan frigo/placard, une demande explicite comme « LIA, garde ça dans mon stock » enregistre les produits confirmés dans le stock du foyer. Le scan seul ne déclenche toujours aucune écriture persistante.

L’écriture passe par la frontière d’actions approuvées de LIA. Les produits incertains sont exclus avant l’action ; une quantité visuelle n’est conservée que si sa confiance atteint le seuil déjà utilisé par le moteur de recettes. En cas d’échec partiel, LIA annonce combien de produits ont réellement été ajoutés au lieu de prétendre que toute l’opération a réussi.

## V0.275 — LIA comprend le résultat du scan sans envoyer la photo au modèle

V0.275 reprend V0.274 sans reconstruire l’application. Après une analyse frigo/placard, LIA conserve en mémoire de session uniquement les produits confirmés et les trois meilleures correspondances de recettes. La photo brute n’entre pas dans ce contexte et n’est pas transmise au moteur conversationnel général.

Une demande directe comme « qu’est-ce que tu vois ? », « qu’est-ce que je peux cuisiner avec ça ? » ou « il manque quoi ? » est résolue localement à partir de ce contexte réel. Les réponses n’inventent aucun produit ni aucune recette et expirent automatiquement après 30 minutes. Les produits encore incertains ne sont pas utilisés comme faits confirmés.

## V0.274 — LIA peut ouvrir directement la caméra pour regarder le frigo ou le placard

V0.274 reprend V0.273 sans reconstruire l’application. Une demande directe comme « LIA, regarde ce que j’ai dans le frigo », « scanne le placard » ou « je te montre mes ingrédients » devient maintenant une vraie intention d’assistante. LIA ouvre la surface « Avec ce que j’ai » de Notre Table et déclenche directement la caméra, sans obliger l’utilisateur à parcourir les écrans ou à appuyer une seconde fois sur « Photographier ».

Le flux réutilise intégralement le moteur de vision déjà présent : permission caméra native, reconnaissance configurée, fusion de plusieurs vues, confirmation des éléments incertains et classement de recettes. Aucun produit n’est inventé et aucun stock persistant n’est modifié silencieusement. Si la reconnaissance photo n’est pas configurée ou échoue, l’erreur existante reste affichée honnêtement.

La demande visuelle reste distincte des actions d’écriture et des autres clarifications vocales. Elle peut interrompre proprement une clarification d’action en cours lorsqu’elle est adressée explicitement à LIA.

## V0.273 — Le calendrier devient proactif sans devenir envahissant

V0.273 reprend V0.272 sans reconstruire l’application. Lorsque Notre Table revient au premier plan, LIA peut désormais afficher discrètement un rappel calendrier privé si un rendez-vous se trouve entre 10 minutes et 3 heures. Ce rappel ne pose aucune question et ne parle pas à voix haute : il utilise la bulle privée déjà prévue pour les retours LIA.

La proactivité est strictement bornée : maximum deux rappels calendrier par jour, jamais deux fois pour le même rendez-vous, jamais pendant une navigation active, jamais lorsque LIA est en pause et jamais à la place d’un retour plus important déjà sélectionné par le moteur de réengagement. Les horaires de nuit sont exclus.

## V0.272 — LIA fait le point sur la journée et alimente son moteur Right Hand

V0.272 reprend V0.271 sans reconstruire l’application. Les demandes « fais-moi le point sur ma journée », « qu’est-ce que j’ai cette semaine ? » et « c’est quoi mon prochain rendez-vous ? » sont maintenant résolues localement depuis le calendrier Notre Table. Aucun appel à un modèle général n’est nécessaire pour lire ou résumer ces événements.

Le calendrier alimente aussi le moteur Right Hand déjà présent dans le projet : les rendez-vous réels deviennent des fils de journée avec heure, caractère récurrent et sensibilité personnelle. Cette classification empêche leur exposition spontanée à table tout en donnant à LIA une base réelle pour prioriser ce qui compte ensuite. Les réponses restent concises et n’ajoutent pas automatiquement une question retour.

## V0.271 — LIA gère la portée d’une série récurrente

V0.271 reprend V0.270 sans reconstruire l’application. Lorsqu’une demande de suppression vise un rendez-vous récurrent, LIA distingue désormais une occurrence d’une série. Une demande explicite « supprime toute la série » annule les occurrences à venir de cette série ; les occurrences passées restent dans l’historique du calendrier.

Si la demande reste ambiguë (« supprime mon rendez-vous dentiste » alors que plusieurs occurrences futures appartiennent à la même série), LIA ne récite plus toutes les occurrences : elle demande simplement « le prochain rendez-vous ou toute la série ? ». Les rappels liés aux occurrences supprimées sont annulés avant la suppression. La suppression de la série utilise une seule frontière de stockage et reste limitée aux occurrences futures.

## V0.270 — Rendez-vous récurrents bornés et sûrs

V0.270 reprend V0.269 sans reconstruire l’application. LIA comprend les séries hebdomadaires explicites comme « tous les lundis à 10 h pendant 6 semaines » ou « chaque mardi à 9 h, 4 fois ». Une série n’est jamais infinie : si l’utilisateur ne donne pas de limite, LIA demande combien de semaines ou combien de fois. Le premier garde-fou est fixé à 24 occurrences maximum.

Chaque occurrence est un vrai événement du calendrier, relié par un identifiant de série et un index. En production, toute la série est insérée en une seule opération backend afin d’éviter une création partielle. Avant l’écriture, LIA vérifie la fenêtre complète en une seule lecture ; si une occurrence entre en conflit, elle annonce le premier conflit et demande si toute la série doit quand même être créée. Le calendrier marque visuellement les occurrences récurrentes.

## V0.269 — Durées réelles et chevauchements fiables dans le calendrier

V0.269 reprend V0.268 sans reconstruire l’application. LIA comprend désormais les rendez-vous avec plage horaire (« de 10 h à 11 h ») et les durées explicites (« à 10 h pendant 2 heures »). L’heure de fin réelle est stockée dans l’événement ; aucune durée par défaut n’est inventée si le client ne la donne pas.

La détection de conflits utilise maintenant un vrai chevauchement d’intervalles dès qu’une fin est connue. Lorsqu’un rendez-vous avec durée est déplacé, sa durée est conservée et son heure de fin suit le déplacement. Les rendez-vous sans fin explicite restent des événements ponctuels pour la détection : LIA ne transforme jamais silencieusement un rendez-vous en créneau d’une heure.

## V0.268 — LIA protège le calendrier contre les conflits horaires certains

V0.268 reprend V0.267 sans reconstruire l’application. Avant de créer ou déplacer un rendez-vous par la voix, LIA vérifie le calendrier du jour. Si un conflit est certain — même heure de départ, ou nouvelle heure située dans un événement dont la fin est connue — elle n’écrit rien silencieusement et demande simplement si l’utilisateur veut maintenir ce choix. Un « oui » exécute l’action malgré le conflit ; un « non » l’abandonne proprement.

LIA ne fabrique aucune durée pour les anciens rendez-vous qui n’ont pas d’heure de fin. Deux événements sans durée ne sont donc considérés en conflit que s’ils commencent réellement à la même heure. Les clarifications habituelles du calendrier, les rappels liés aux événements et les commandes d’annulation restent prioritaires et inchangés.

## V0.267 — Un rendez-vous devient directement une destination LIA

V0.267 reprend V0.266 sans reconstruire l’application. Lorsqu’un rendez-vous du calendrier contient un lieu, l’utilisateur peut lancer **En route avec LIA** directement depuis sa carte calendrier, sans recopier l’adresse. La commande vocale « LIA, emmène-moi à mon rendez-vous dentiste » résout d’abord le rendez-vous dans le calendrier privé puis transmet uniquement son lieu au moteur de navigation existant.

LIA ne devine jamais : rendez-vous introuvable, plusieurs correspondances ou adresse manquante = réponse claire et aucun guidage lancé. « Mon prochain rendez-vous » désigne explicitement le prochain événement à venir ; sinon une ambiguïté reste une ambiguïté. Le calendrier reste interne à Notre Table et le moteur Navigation existant conserve ses protections, son quota et sa résolution Google.


## V0.266 — LIA modifie oralement les rappels des rendez-vous existants

V0.266 reprend V0.265 sans reconstruire l’application. Une demande directe comme « LIA, rappelle-moi 30 minutes avant mon rendez-vous dentiste » reste dans la voie Calendrier, retrouve l’événement concerné et modifie son rappel sans recréer le rendez-vous. LIA peut également retirer le rappel d’un événement existant. En cas d’ambiguïté, elle ne choisit jamais un événement au hasard.

Le calendrier visuel affiche maintenant la présence du rappel et annule aussi l’alarme liée lorsqu’un rendez-vous est supprimé depuis l’écran. Un rappel ordinaire sans référence à un rendez-vous continue d’utiliser le moteur de rappels général : les deux fonctions restent distinctes.

## V0.265 — Les rappels appartiennent aux rendez-vous

V0.265 ajoute `reminder_minutes_before` aux événements du calendrier. Une phrase unique comme « mets dentiste demain à 10 h dans mon calendrier et rappelle-moi 30 minutes avant » crée le rendez-vous et son rappel comme une seule intention. Le rappel utilise l’identifiant stable de l’événement ; lorsqu’un rendez-vous est déplacé, il est reprogrammé, et lorsqu’il est supprimé, il est annulé.

Si les notifications sont refusées ou si l’heure du rappel est déjà passée, LIA conserve le rendez-vous mais l’annonce honnêtement au lieu de prétendre que l’alerte a été programmée.

## V0.264 — Le calendrier personnel vit dans Notre Table et LIA commence à le piloter

V0.264 reprend V0.263 sans reconstruire l’application. Notre Table possède maintenant un calendrier personnel privé par utilisateur, stocké côté backend avec RLS et une sauvegarde locale en mode démo. Le calendrier est accessible depuis les raccourcis LIA et permet de consulter les événements à venir, ajouter un rendez-vous et le supprimer sans ouvrir Apple Calendar ou Google Calendar.

LIA peut désormais comprendre les demandes directes liées au calendrier : ouvrir l’agenda, ajouter un rendez-vous avec date/heure, lire ce qui est prévu un jour donné, déplacer un événement et supprimer un événement identifiable. Une demande explicite est exécutée sans confirmation redondante ; si le titre, le jour ou l’heure manque, LIA demande uniquement l’information manquante. Les recherches ambiguës échouent proprement au lieu de choisir un rendez-vous au hasard.

## V0.263 — LIA contrôle le trajet et ajoute un arrêt réellement situé sur la route

V0.263 reprend V0.262 sans reconstruire l’application. Pendant un guidage actif, une demande directe comme « LIA, arrête le guidage » coupe réellement la navigation et ferme proprement le mode route. Une nouvelle destination explicite continue de passer par le flux de navigation existant : LIA peut donc changer de destination sans créer un second système parallèle.

LIA sait désormais aussi traiter des demandes telles que « trouve-moi une station-service sur la route », « un parking sur la route » ou « une pharmacie sur la route ». La recherche reste côté serveur : Notre Table calcule la route restante avec Google Routes API, transmet uniquement la polyline encodée à Places Text Search (New) avec Search Along Route, puis récupère jusqu’à trois candidats avec leur résumé de routage. LIA choisit le candidat avec le détour estimé le plus faible, l’annonce et demande simplement si le client veut l’ajouter au trajet. Rien n’est ajouté silencieusement.

Après accord, la vue native Google Navigation reçoit l’arrêt intermédiaire et la destination finale. À l’arrivée à l’arrêt, `GMSNavigator` avance vers la destination suivante et réactive le guidage. La destination finale reste le contexte principal de LIA pour les questions ETA/distance. Les données de recherche ne sont pas persistées dans un historique GPS.

Le checkpoint reste fail-closed : pas de trajet actif, position indisponible, backend absent, Routes/Places en échec ou résultat non fiable = aucun arrêt inventé. Cette fonction utilise des appels Google supplémentaires (Routes + Places, et des destinations Navigation SDK lorsqu’un arrêt est réellement ajouté) ; elle devra donc être incluse dans le suivi de coût réel avant production, sans modifier le quota utilisateur de 30 trajets validé à ce stade.

## V0.262 — LIA connaît le trajet en cours et reste disponible sans bavarder

V0.262 reprend V0.261 et ajoute un **contexte de navigation vivant** partagé avec l’assistante. Dès que Google Navigation confirme le départ, Notre Table conserve en mémoire de session uniquement les données utiles du trajet : destination, ETA, distance restante, prochaine instruction, distance avant la manœuvre et état de reroutage. Cet état est effacé à l’arrivée, à l’échec ou à la fermeture du mode route.

Pendant le trajet, une demande directe comme « LIA, on arrive quand ? », « il reste combien de kilomètres ? » ou « je tourne où ? » est répondue localement à partir des données natives réelles, sans envoyer la question vers un modèle générique et sans inventer de chiffre. En cas de reroutage, LIA dit simplement qu’elle recalcule et attend la nouvelle route.

La conduite devient aussi un contexte social particulier : les rires/réactions spontanées et la conversation sociale automatique de table/cuisine sont suspendus pendant une navigation active. LIA reste néanmoins disponible via son écoute directe de premier plan lorsqu’on l’appelle par son prénom ou son surnom accepté.

## V0.261 — Instructions virage par virage réelles dans « En route avec LIA »

V0.261 reprend V0.260 sans modifier la résolution de destination, le quota ni les règles LIA déjà validées. Le flux natif Google Navigation remonte maintenant vers Notre Table la **prochaine instruction réelle**, la distance avant la manœuvre, l’état de navigation (`enroute`, reroutage, arrêt), le nom de voie, l’ETA, la distance restante et les changements de route.

L’écran **En route avec LIA** affiche l’instruction courante en grand au-dessus de la carte, avec la distance avant la prochaine manœuvre, et remplace proprement l’instruction par « Je recalcule l’itinéraire… » pendant un reroutage au lieu de laisser une consigne périmée. La carte reste native et intégrée à Notre Table.

Le `GMSNavigator` est explicitement configuré avec le guidage vocal Google **alertes + indications**, sortie Bluetooth lorsqu’elle existe et volume normal. Ce checkpoint fournit donc un vrai guidage vocal de navigation dans l’expérience LIA. Il ne prétend pas encore remplacer la voix Google de navigation par la voix personnelle choisie de LIA : cette personnalisation devra être validée séparément pour ne pas dégrader le timing ni la sécurité du guidage.

Comme les checkpoints précédents, tout reste fail-closed : sans SDK Google réel, clé/API, conditions, localisation, résolution de destination et quota disponible, aucun faux guidage n’est affiché ou annoncé.

## V0.260 — Destination réelle et démarrage du guidage natif

V0.260 reprend V0.259 et ferme le maillon qui manquait entre la phrase de l’utilisateur et la carte native. Une destination formulée naturellement est maintenant résolue côté serveur par **Google Places Text Search (New)** via l’Edge Function authentifiée `lia-navigation-resolve`. La clé Google reste exclusivement côté serveur ; le mobile ne reçoit que les trois candidats maximum nécessaires au guidage.

Notre Table ne choisit pas silencieusement une destination ambiguë : un résultat unique ou une correspondance exacte est accepté, sinon LIA présente les possibilités afin que le client précise. Une fois le préflight Google Navigation réellement prêt, le quota du foyer est réservé puis la vue native reçoit latitude, longitude, Place ID et titre. Côté iOS, `GMSNavigator.setDestinations(...)` calcule alors la route et `isGuidanceActive = true` démarre le guidage. ETA et distance restantes reviennent vers React Native via les événements natifs du navigateur.

Le guidage reste **fail-closed** : absence de backend, clé/API, SDK, conditions Google, localisation Always ou destination fiable = aucun trajet inventé et aucun départ silencieux. La facturation Google n’est toujours pas activée artificiellement dans le projet ; le code est prêt à l’utiliser lorsqu’elle sera réellement configurée.

## V0.259 — Carte native Google dans « En route avec LIA »

V0.259 reprend V0.258 sans modifier les permissions, le quota ni les comportements LIA déjà validés. Le module iOS `lia-navigation` expose maintenant une vraie **vue native Expo** destinée à héberger `GMSMapView` directement dans Notre Table. La vue est enregistrée via Expo Modules API et peut remonter explicitement `onReady` lorsque Google Navigation est réellement présent, ou `sdk_unavailable` lorsque le package n'est pas lié.

Côté Swift, la carte reste protégée par `#if canImport(GoogleMaps) && canImport(GoogleNavigation)`. Lorsque le SDK est réellement lié et les conditions acceptées, elle active les capacités de navigation du `GMSMapView`, le suivi de caméra, la localisation utilisateur et les contrôles essentiels. Sans SDK, aucun faux fond de carte ni faux guidage n'est rendu.

Ce checkpoint crée donc la **surface native réelle** qui vivra dans l'écran « En route avec LIA ». Le calcul de destination et `navigator.setDestinations(...)` restent l'étape suivante ; ils ne sont pas simulés dans V0.259.

## V0.258 — Préparation native du vrai Google Navigation iPhone

V0.258 reprend V0.257 sans modifier le quota ni les comportements déjà validés. Le projet prépare maintenant explicitement les exigences natives du vrai Google Navigation SDK sur iPhone : configuration centralisée d’une clé iOS Google Navigation, détection conditionnelle du SDK natif, autorisation de localisation « Toujours » demandée uniquement lorsqu’un vrai guidage doit démarrer, conditions d’utilisation Google obligatoires, capteur de mouvement et mode de localisation en arrière-plan.

La navigation normale de Notre Table ne demande donc pas l’autorisation « Toujours » à l’ouverture de l’application. Cette autorisation reste cantonnée au flux **En route avec LIA**. Si la clé API est absente, le SDK non lié, les conditions refusées ou la localisation permanente refusée, le flux échoue proprement et n’invente aucun guidage.

Le module Swift utilise des imports conditionnels `GoogleMaps`/`GoogleNavigation`, ce qui permet au projet de continuer à se compiler tant que le package Swift Google n’est pas encore installé. Une fois le package réel ajouté au build iOS, le même module pourra enregistrer la clé et présenter les conditions sans réécrire la couche React Native.

Le vrai `GMSMapView` et le démarrage `GMSNavigator.setDestinations(...)` restent volontairement l’étape suivante : V0.258 prépare les permissions et le contrat natif mais ne prétend pas encore afficher une carte Google ni guider virage par virage.

Validation locale finale : **591/591 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/acceptation/projet PASS, **200 fichiers TS/TSX transpilés sans diagnostic** par l’audit projet. Le vrai build iPhone et le guidage Google restent à valider après liaison effective du package Swift, de la clé API et de la facturation.

## V0.257 — En route avec LIA : quota mensuel partagé et contrôle de coût

V0.257 reprend V0.256 sans reconstruire l’application. Le mode **En route avec LIA** intègre maintenant la règle commerciale validée de lancement : **30 trajets de navigation par mois et par abonnement/foyer**. Le quota n’est pas stocké uniquement sur l’iPhone : en production, il est réservé atomiquement côté Supabase à l’échelle du foyer afin que plusieurs appareils partageant le même abonnement ne puissent pas chacun consommer 30 trajets.

Un trajet n’est jamais décompté tant que le moteur de navigation réel n’est pas disponible dans le build. Quand le moteur est disponible, Notre Table réserve le trajet avant l’appel au fournisseur afin de bloquer proprement une 31e demande et d’éviter une dépense Google non contrôlée. En production, la réservation passe par un RPC `security definer`, vérifie l’appartenance au foyer et l’accès Family, et refuse les écritures directes du client mobile sur le compteur.

Le quota reste volontairement discret : aucun compteur permanent n’est affiché dans l’interface. LIA n’en parle qu’à des seuils utiles (5, 2 puis 1 trajet restant) avec son ton naturel ; à épuisement, elle explique que les 30 trajets du mois ont été utilisés. Les builds demo/preview disposent d’un compteur local séparé pour tester le comportement sans toucher à la consommation de production.

Le branchement du **Google Navigation SDK** réel reste l’étape native suivante. V0.257 ne simule toujours aucun guidage tant que le SDK, sa clé API et la facturation ne sont pas réellement activés dans le build iPhone.

## V0.256 — « En route avec LIA » et présence conversationnelle plus naturelle

V0.256 reprend V0.255 sans reconstruire l’application. Une demande directe comme « LIA, emmène-moi à l’aéroport » ou « LIA, guide-moi vers Tel Aviv » devient une intention locale de navigation, distincte des actions Notre Table ordinaires. Si la destination manque, LIA demande uniquement où aller et conserve le contexte de clarification ; une demande complète ouvre directement la surface interne **En route avec LIA** sans envoyer l’utilisateur vers une autre application.

Le checkpoint ajoute une première frontière native iOS de localisation basée sur Core Location. La position n’est demandée qu’au moment où l’utilisateur sollicite un guidage. L’écran route ne fabrique jamais un itinéraire : tant qu’un moteur de navigation intégré (par exemple Google Navigation SDK) n’est pas réellement enregistré dans le build, il annonce honnêtement que le moteur doit encore être relié. L’architecture expose un adaptateur `liaNavigationEngine` afin de connecter ce moteur ultérieurement sans réécrire le flux vocal ni l’interface LIA.

V0.256 renforce aussi la présence conversationnelle validée : les petits échanges comme « LIA, comment ça va ? » reçoivent des réponses courtes, variables et généralement sans question retour. Quand on demande ses limites, LIA ne récite pas une fiche technique : elle exprime ses limites physiques de façon vivante et changeante — pas de mains pour faire les lacets, pas de corps pour toucher des cheveux, pas d’odorat pour sentir un parfum ou un café — tout en restant honnête sur ses capacités. Le provider reçoit la même règle : réponse d’abord, relance seulement si elle apporte réellement quelque chose.

Validation finale : **583/583 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/acceptation/projet PASS, **198 fichiers TS/TSX transpilés sans diagnostic par l’audit projet (201 dans le balayage élargi incluant les modules natifs TS)**. Le `tsc --noEmit` complet ne peut pas être revendiqué dans cet environnement car les dépendances Expo/React ne sont pas installées (`expo/tsconfig.base`, React Native, etc.). Le guidage virage-par-virage réel reste à valider après branchement du moteur natif et build appareil.

## V0.255 — LIA disponible dès l’ouverture : micro et commandes directes de premier plan

V0.255 reprend V0.254 sans reconstruire l’application. Lorsque Notre Table est ouverte et active, le LIA principal démarre automatiquement l’écoute locale autorisée : analyse sonore, contexte musical et reconnaissance des commandes directement adressées à « LIA » (ou à son surnom accepté). La première activation reste soumise aux permissions micro et reconnaissance vocale du téléphone ; un refus laisse LIA silencieuse et fail-closed.

Sur iOS, la reconnaissance vocale directe partage maintenant le même flux micro que Sound Analysis et ShazamKit afin qu’une commande adressée à LIA ne désactive pas la reconnaissance musicale. Les paroles ambiantes non adressées à LIA restent ignorées hors d’une vraie session table/cuisine. Une clarification déjà engagée peut continuer sans répéter « LIA ». Pendant la propre parole de LIA, sa reconnaissance directe est suspendue pour éviter l’auto-écoute, puis réarmée.

Les règles d’interruption existantes restent prioritaires : appel téléphonique actif = parole et écoute suspendues ; reprise après fin réelle de l’appel. Les handoffs téléphone/musique explicitement initiés par LIA conservent leur continuité V0.251. Une pause volontaire de LIA ou de l’écoute reste possible. Android conserve son état fail-closed pour la reconnaissance vocale globale tant que RECORD_AUDIO + runtime speech ne sont pas validés.

Validation locale : **579/579 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et matrice d’acceptation PASS, **193 fichiers TS/TSX transpilés sans diagnostic** par l’audit projet. Le comportement natif de reconnaissance directe reste à valider sur un iPhone physique.

## V0.254 — Minuteurs globaux et initiative créative de LIA

V0.254 reprend V0.253 sans reconstruire l’application. Les minuteurs deviennent un acte général de LIA, utilisable en dehors d’une recette : une demande comme « LIA, mets un minuteur de 12 minutes » démarre un minuteur persistant et notifié ; « il reste combien ? » interroge le temps restant ; « arrête le minuteur » l’annule. Si plusieurs minuteurs sont actifs, LIA demande lequel au lieu de deviner. Une fin de minuteur au premier plan n’interrompt jamais une personne qui parle.

Le checkpoint renforce aussi un principe central de personnalité : LIA ne doit pas être seulement correcte et fonctionnelle, elle doit parfois surprendre intelligemment dans ses démarches et ses questions. Lorsqu’une alternative réellement utile existe, elle peut proposer un angle inattendu ou un choix ludique — par exemple « Tu veux faire classique ou épater la galerie ? » — adapté au contexte et à la langue. Cette initiative reste occasionnelle, non mécanique et disparaît dans les moments sensibles, urgents ou lorsqu’une exécution stricte a été demandée. La surprise concerne les idées et les questions ; elle n’autorise jamais une action externe ou destructive non demandée.

Validation locale : **572/572 régressions PASS** avant verrouillage final du checkpoint. Les validations de release complètes sont régénérées lors de l’archivage V0.254.

## Historique conservé

# Notre Table — V0.253

## V0.253 — Rapport exportable du test iPhone LIA

V0.253 reprend V0.252 sans modifier les règles validées de LIA. Le diagnostic iPhone devient exportable sous forme d’un rapport JSON local contenant l’état courant et une trace bornée des transitions audio observées : permission micro, moteur d’écoute, ShazamKit, état de l’app, interruption système, état d’appel, résultat de reprise et dernier morceau reconnu.

Le rapport est strictement observationnel : il ne peut ni démarrer/arrêter l’écoute, ni lancer un appel, ni parler à la place de LIA. Il n’intègre ni contacts, ni numéros de téléphone, ni données du foyer. Son but est de rendre le premier essai physique iPhone exploitable sans deviner ce qui s’est passé côté iOS.

La carte « Test audio iPhone » expose maintenant un bouton explicite de partage du rapport. La trace est limitée à 80 états et reste locale jusqu’à une action volontaire de partage par l’utilisateur.

ShazamKit reste un App Service à activer pour l’App ID `com.notretable.app` avant le build physique ; aucun entitlement iOS ShazamKit ne doit être inventé dans le projet.

Validation locale : **566/566 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et matrice d’acceptation PASS, **190 fichiers TS/TSX transpilés sans diagnostic**. Le test iPhone physique reste requis pour valider ShazamKit et la continuité audio réelle.

## V0.252 — Test iPhone natif : diagnostic audio et suspension complète pendant les appels

V0.252 reprend V0.251 sans revenir sur les règles existantes. Le checkpoint prépare le premier test réel iPhone de la continuité LIA + ShazamKit en rendant l’état audio natif observable : permission micro, moteur d’écoute, disponibilité Shazam, morceau reconnu, interruption système et résultat de reprise sont exposés dans un diagnostic iPhone interne.

La gestion des appels téléphoniques est maintenant explicite au niveau natif iOS avec CallKit. Dès qu’un appel apparaît — sonnerie entrante, appel sortant, appel connecté ou en attente — LIA suspend complètement sa parole, son analyse sonore et sa reconnaissance vocale. Une notification audio indiquant qu’une reprise serait possible ne suffit jamais à relancer LIA tant que CallKit voit encore un appel actif. La session n’est réarmée qu’après la fin réelle du dernier appel. Si une reconnaissance vocale était active avant l’appel, V0.252 tente de la reprendre ; sinon elle réarme l’écoute/identification musicale qui était demandée.

Cette règle ne change pas le comportement musique validé en V0.251 : LIA reste silencieuse pendant un morceau tant que l’utilisateur ne l’interpelle pas. Le diagnostic V0.252 sert à vérifier sur appareil réel que l’écoute survit aux handoffs autorisés, que ShazamKit identifie effectivement un titre et que la suspension/reprise autour d’un appel est correcte.

ShazamKit reste un service App ID à activer dans Apple Developer avant le build appareil. Aucun nouveau texte de présentation, aucune règle relationnelle et aucune logique d’action LIA existante ne sont modifiés par ce checkpoint.

Validation locale : **563/563 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et matrice d’acceptation PASS, **190 fichiers TS/TSX transpilés sans diagnostic**. Le test iPhone physique reste l’étape suivante et n’est pas encore revendiqué comme réussi.


## V0.251 — LIA lance la musique, reste disponible et reconnaît ce qui joue sans parler par-dessus

V0.251 reprend V0.250 et ajoute la première vraie couche musique du comportement d’assistante. Une demande directe comme « LIA, mets de la musique » ou « LIA, joue la chanson Imagine sur Spotify » est maintenant routée comme un acte local. Le service musical explicitement choisi est mémorisé pour les prochaines demandes ; si aucun service n’a encore été choisi, LIA demande uniquement lequel utiliser. Après ouverture réelle du service, LIA confirme ce qu’elle a lancé.

Les ouvertures externes Téléphone/Musique ne détruisent plus automatiquement la session LIA : un handoff explicitement déclenché par l’assistante préserve l’écoute logique et la session est réarmée au retour dans Notre Table. Sur iOS, le checkpoint déclare le mode audio d’arrière-plan nécessaire à cette continuité. Les arrière-plans ordinaires continuent au contraire de couper l’écoute, la voix et les clarifications comme avant.

Quand une session d’écoute est active sur iOS, le module natif utilise maintenant ShazamKit pour identifier un morceau réellement entendu. Le titre et l’artiste deviennent un contexte de session confirmé ; aucune identification n’est inventée côté JavaScript. Tant qu’un morceau est détecté comme actif, LIA bloque ses interventions spontanées et reste silencieuse. Si l’utilisateur l’interpelle directement, elle peut répondre. Après la fin, le morceau reste disponible pour une conversation. Une demande d’anecdote ou d’information sur l’artiste passe par la route de recherche vérifiée afin d’éviter les histoires inventées.

Le mode cuisine utilise désormais le même flux de demandes directes que le mode table, mais garde `contributionUseful:false` pour les tours ambiants : LIA peut être appelée en cuisine sans se mettre à commenter spontanément tout ce qu’elle entend.

Limite connue : la reconnaissance ShazamKit doit être validée sur un vrai build iOS avec le service ShazamKit activé pour l’App ID Apple. Android conserve son état natif antérieur dans ce checkpoint ; la continuité micro d’arrière-plan Android nécessite un foreground service microphone conforme aux restrictions du système et n’est pas revendiquée comme terminée ici.

Validation locale : **560/560 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et matrice d’acceptation PASS, **189 fichiers TS/TSX transpilés sans diagnostic** par l’audit projet. Le préflight confirme Node 22.16.0/npm 10.9.2, mais `node_modules` est absent : aucun build Expo/Xcode/Android installé n’est revendiqué dans cet environnement.

# Notre Table — V0.250

## V0.250 — LIA agit directement dans Notre Table : courses, planning et Mémos

V0.250 reprend V0.249 et raccorde enfin l’exécuteur interne de LIA au flux vocal principal. Une commande explicite comme « LIA, ajoute du lait aux courses », « LIA, mets des lasagnes demain soir au planning » ou « LIA, mets appeler le plombier dans Mémos » est maintenant traitée localement comme un vrai acte Notre Table, puis LIA confirme oralement uniquement après le retour de l’action réelle.

L’ordre explicite adressé à LIA matérialise l’accord : elle ne redemande pas un « oui » artificiel. Si un élément indispensable manque, elle demande seulement ce qui manque et conserve le reste en mémoire de session. Les clarifications restent annulables et une nouvelle commande explicite remplace l’ancienne. « Mets ça dans Mémos » ne devine jamais ce que « ça » désigne : LIA demande le contenu au lieu d’inventer.

La couche historique d’actions confirmées reste la frontière d’écriture : les commandes directes structurées y entrent avec `confirmed:true`, tandis qu’une simple proposition du moteur ne devient toujours pas une écriture sans acte utilisateur explicite. Les appels, SMS et rappels déjà branchés restent inchangés.

Validation locale : **553/553 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **184 fichiers TS/TSX transpilés sans diagnostic**.

## V0.249 — LIA exécute les rappels vocaux explicites et confirme ses actions

V0.249 reprend V0.248 et fait avancer le comportement d’assistante vocale de LIA. Une demande directe et suffisamment précise comme « LIA, rappelle-moi demain à 10 h d’acheter du pain » est maintenant traitée comme une instruction explicite : LIA programme le rappel local puis confirme oralement ce qu’elle a pris en charge. Elle ne demande pas une seconde autorisation pour répéter l’ordre déjà donné.

Si une information indispensable manque, LIA demande uniquement cette information et conserve le reste de la demande pendant la session : heure manquante, moment manquant ou contenu du rappel. Une nouvelle commande explicite remplace cette clarification, et « annule » nettoie le rappel en attente. En cas de refus de permission ou d’échec du planificateur natif, LIA l’annonce au lieu de prétendre que le rappel existe. Un appel lancé avec succès reçoit également une confirmation vocale courte (« J’appelle … »).

Validation locale : **546/546 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **182 fichiers TS/TSX transpiles sans diagnostic**.

# Notre Table — V0.248

## V0.248 — LIA peut préparer un vrai message famille sans l’envoyer

V0.248 reprend exactement V0.247 et ferme le trou entre l’objectif `family.prepare_message` déjà reconnu par l’assistante et son exécution réelle. Lorsqu’une demande vise à prévenir la famille, LIA peut maintenant lire la liste des membres utiles en contexte, sans transmettre leurs numéros au modèle, puis préparer une action structurée avec les destinataires explicitement choisis et le texte du message.

La frontière de confirmation reste obligatoire. Après accord, l’exécuteur recharge les membres réels du foyer, vérifie qu’ils sont actifs, joignables et autorisés à recevoir un message selon les règles familiales existantes, puis ouvre le composeur SMS natif avec tous les destinataires. **LIA ne peut pas appuyer sur Envoyer** et ne présente l’action comme `prepared` que si le composeur s’est réellement ouvert. Un destinataire absent, inactif, sans numéro ou ambigu fait échouer l’action fermée au lieu d’être ignoré silencieusement.

Validation locale : **539/539 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **180 fichiers TS/TSX transpiles sans diagnostic**.

# Notre Table — V0.247

## V0.247 — Les deux présentations validées de LIA ont la même voix

V0.247 reprend exactement V0.246 et relie la seconde présentation validée de LIA, affichée après la fiche famille, à la même couche vocale que sa première présentation. Aucun nouveau texte d’introduction n’est inventé : la voix prononce `lia.secondIntro`, déjà validé. La voix préférée de LIA est réutilisée, la lecture peut être écoutée ou arrêtée manuellement, s’arrête avant de poursuivre, et l’auto-lecture reste désactivée si VoiceOver/TalkBack est actif.

Validation locale : **535/535 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **180 fichiers TS/TSX transpiles sans diagnostic**. La qualité perceptive de la voix reste à valider sur un appareil natif réel.

## V0.246 — Les actions de LIA passent par une frontière de confirmation unique

V0.246 reprend exactement V0.245 et ajoute le pont d’exécution sécurisé de l’assistante. Une action proposée par LIA ne peut plus devenir une écriture Notre Table sans passer par un contrat structuré et un contrôle final de confirmation. Trois écritures natives sont préparées : ajouter un article aux courses, inscrire un repas au planning et créer un Mémo. Les paramètres incomplets ou incohérents échouent fermés ; le moteur ne complète jamais silencieusement un foyer, une date, un repas ou un contenu manquant.

Le pont réutilise uniquement les services existants de Notre Table (`shopping`, `planning`, `memos`). Un résultat `completed` n’est produit qu’après retour réel du service ; une exception devient `failed` et ne peut pas être présentée comme un succès. Cette couche n’autorise toujours aucune exécution automatique depuis une simple proposition du modèle : l’accord utilisateur doit être matérialisé dans l’action structurée avant l’écriture.

Validation locale de ce checkpoint : **532/532 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **180 fichiers TS/TSX transpiles sans erreur**. Le build Metro natif complet n’est pas revendiqué sans dépendances installées dans l’archive.

# Notre Table — V0.245

## V0.245 — LIA comprend un objectif et va chercher le contexte utile dans Notre Table

V0.245 reprend exactement V0.244 et ajoute la première orchestration concrète du mode **assistante IA**. LIA peut maintenant reconnaître localement qu'une demande concerne les placards, les recettes, le planning, la liste de courses ou les Mémos, puis rassembler automatiquement les données utiles de Notre Table avant de formuler sa réponse. Une demande multi-étapes comme « organise le dîner de demain avec ce qu'on a » est conservée comme **un seul objectif** : LIA peut consulter le planning, le stock et les recettes, calculer les meilleures correspondances stock/recettes et identifier les étapes suivantes utiles.

Cette couche est volontairement séparée des écritures : la lecture du contexte peut être automatique, mais modifier le planning, ajouter les ingrédients manquants aux courses, créer un Mémo ou préparer un message famille reste une **action proposée avec confirmation**. Une source de données qui échoue est omise ; LIA ne la remplace jamais par une supposition. L'identité, les surnoms, l'humour, la confidentialité et les garde-fous V0.239–V0.244 restent inchangés.

Validation locale de ce checkpoint : **528/528 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **178 fichiers TS/TSX transpiles sans erreur**. Le build Metro natif complet n’est pas revendiqué sans dépendances installées dans l’archive.

# Notre Table — V0.244

## V0.244 — LIA garde son identité, accepte les surnoms et renforce son rôle d’assistante

V0.244 reprend exactement V0.243 et ajoute une couche relationnelle sans retirer aucune règle existante. LIA sait toujours qu’elle s’appelle **LIA** et répond ainsi quand on lui demande son prénom. Un surnom explicitement proposé peut être accepté et mémorisé comme alias d’appel, sans jamais remplacer son identité LIA. L’utilisateur peut aussi autoriser un surnom pour lui-même. Le contrat conversationnel autorise une répartie légère en miroir quand son prénom est taquiné, tout en bloquant l’escalade, les humiliations et l’usage de sujets sensibles comme matière à plaisanterie.

La même politique précise que LIA doit se comporter comme une assistante IA active : comprendre les demandes multi-étapes, relier le contexte utile de Notre Table, proposer l’étape suivante et utiliser les actions/outils disponibles plutôt que rester dans une conversation générique. Les protections V0.239–V0.243 sur les outils, preuves, actions externes, confidentialité et pannes restent inchangées.

Validation exécutable dans cet environnement : **521/521 régressions PASS**. Le typecheck/Metro complet n’est pas revendiqué ici car l’archive de travail ne contient pas les dépendances installées et leur restauration n’a pas abouti dans cet environnement.

# Notre Table — V0.243

## V0.243 — LIA ne laisse plus une demande directe sans réponse

V0.243 transforme les pannes contrôlées de V0.242 en réponses humaines et honnêtes. Si Walter ou un membre appelle directement LIA et que la réponse tarde, manque de preuve ou échoue, elle le dit brièvement sans jargon et sans inventer. Une conversation ambiante n’est jamais interrompue pour annoncer une panne, et un sujet sensible reste silencieux à table. Les réponses existent en français, anglais, espagnol et hébreu.

Validation locale : 514/514 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 908 modules chacun.

## V0.242 — LIA ne reste pas bloquée sur un fournisseur

V0.242 borne chaque appel IA : 8 secondes pour une conversation simple, 15 pour un raisonnement complexe et 20 pour une recherche avec outils. À expiration, le fournisseur reçoit un signal d’annulation ; une panne devient un état contrôlé plutôt qu’une erreur qui casse la conversation. Un tour ne provoque jamais de relance payante automatique, et une action locale n’attend aucun modèle.

Validation locale : 508/508 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 907 modules chacun.

## V0.241 — contrat fournisseur sûr et réponses prouvées

V0.241 prépare chaque requête IA avec l’identité immuable de LIA et seulement le contexte confirmé réellement utile. Les identifiants techniques de locuteur ne partent pas chez le fournisseur. Les sujets sensibles restent limités à la session sans Web. Le contrat interdit à LIA de prétendre qu’une action a réussi sans résultat d’outil, et une recherche actuelle non accompagnée de preuves vérifiées est rejetée avant d’être prononcée.

Validation locale : 502/502 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 906 modules chacun.

## V0.240 — LIA reconnaît elle-même le niveau d’aide nécessaire

V0.240 relie le routage agentique au texte réellement entendu. Une recherche actuelle exige automatiquement une source vérifiée ; une analyse, une comparaison ou une décision peut atteindre le raisonnement renforcé ; la conversation ordinaire reste économique. Les sujets privés de santé, couple, finance ou droit coupent le Web, limitent la mémoire à la session et forcent une réponse silencieuse même si un futur fournisseur omet son propre marquage de confidentialité.

Validation locale : 496/496 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 905 modules chacun.

## V0.239 — notre LIA, puissance d’agent et coût maîtrisé

V0.239 ajoute le contrat de routage du futur moteur IA sans inventer de fournisseur connecté. Les actions déterministes de Notre Table restent locales ; la conversation ordinaire utilise le niveau économique ; le raisonnement complexe n’emploie un moteur renforcé que lorsque nécessaire ; une recherche actuelle exige des outils de vérification et ne retombe jamais sur une réponse non vérifiée. Les sujets sensibles interdisent le Web et restent limités au contexte privé de session. Le garde économique V0.157 continue de réduire les routes non essentielles avant toute aide essentielle.

Validation locale : 490/490 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 904 modules chacun.

## V0.238 — une nouvelle commande remplace l’ancienne

V0.238 empêche une clarification d’appel ou de SMS de capturer une nouvelle commande explicite. Si LIA attend un prénom ou un texte et que l’utilisateur dit « LIA, appelle David », « LIA, envoie un SMS à Myriam… », demande un rappel ou lance une recherche, l’ancienne action est effacée et la nouvelle prend immédiatement sa place. Une réponse courte comme « oui », « portable » ou un prénom continue cependant de répondre à la clarification en cours. Validation locale : 484/484 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 902 modules chacun.

## V0.237 — annulation vocale et fin de session propre

V0.237 permet d’abandonner immédiatement un appel ou un SMS en clarification avec « annule », « laisse tomber » ou « oublie ça ». LIA répond simplement qu’elle annule, efface les choix en attente et ne transforme jamais cette phrase en nom de contact ou en contenu de message. Les brouillons vocaux temporaires sont également supprimés à l’arrêt de l’écoute, au passage en arrière-plan et à la fermeture de la surface LIA. Validation locale : 481/481 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 902 modules chacun.

## V0.236 — clarification d’appel sans recommencer

V0.236 conserve uniquement pendant la session le choix d’appel en attente. Quand plusieurs contacts ou plusieurs numéros existent, LIA prononce les options réelles et l’utilisateur répond seulement par le nom complet, « oui », « portable » ou « travail », sans répéter « LIA, appelle… ». Les libellés natifs anglais des contacts (`mobile`, `work`, `home`) comprennent maintenant leurs réponses françaises équivalentes, pour les appels comme pour les SMS. Aucune ambiguïté ne déclenche un choix silencieux. Validation locale : 478/478 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 902 modules chacun.

## V0.235 — SMS incomplet, une seule question utile

V0.235 évite de faire recommencer une commande SMS incomplète. Si le destinataire est compris mais que le texte manque, LIA demande uniquement ce qu’il faut écrire. Si le texte est compris mais que le destinataire manque, elle demande uniquement à qui l’envoyer. La partie déjà comprise reste en mémoire de session jusqu’à la réponse, puis rejoint le flux sûr de résolution du contact et d’ouverture du composeur. Validation locale : 474/474 régressions, 17/17 gates EAS, TypeScript strict et audits PASS, exports Metro Android/iOS réussis avec 902 modules chacun.

## V0.234 — clarification SMS sans recommencer

V0.234 conserve temporairement la commande SMS pendant une clarification. Après un contact ambigu, une confirmation ou plusieurs numéros, l’utilisateur répond seulement par le nom complet, « oui » ou le libellé du numéro ; le destinataire et le texte initial restent attachés au même tour de dialogue. Cet état reste uniquement en mémoire de session, disparaît à la résolution et n’autorise toujours aucun envoi automatique. Validation locale : 471/471 régressions, 17/17 gates EAS et exports Metro Android/iOS réussis.

## V0.233 — préparation SMS réelle, envoi toujours humain

V0.233 raccorde les demandes explicites de message de LIA au composeur SMS natif iOS/Android. LIA extrait un destinataire et un texte réellement prononcés, résout le contact sans deviner, puis ouvre Messages avec le numéro et le corps préremplis. Le dernier geste reste obligatoirement humain : Notre Table ne clique jamais sur Envoyer et ne présente jamais un composeur ouvert comme un message envoyé. Demande incomplète, contact absent, ambigu ou doté de plusieurs numéros : clarification, jamais de choix silencieux. Validation locale : 468/468 régressions, 17/17 gates EAS, prébuild Expo et exports Metro Android/iOS réussis.

## V0.232 — continuité vocale des appels et construction stricte

V0.232 avance depuis V0.231 sans modifier les règles validées. Si LIA ne comprend pas le prénom demandé pour un appel, elle demande d’abord de le répéter. Après une deuxième incompréhension consécutive, elle utilise la relance humoristique validée « Tu peux arrêter de bafouiller ? Allez, redis-moi le prénom. », puis reste en attente d’une prononciation exploitable. Aucun contact n’est choisi et aucun appel n’est ouvert par supposition. Le contrôle TypeScript installé est désormais propre ; les fonctions Supabase/Deno restent contrôlées par leur chaîne dédiée et ne sont pas faussement compilées comme du React Native. Validation locale : 464/464 régressions, 17/17 gates EAS et exports Metro Android/iOS réussis.

## V0.231 — assistant vocal, Contacts téléphone et appels réels

V0.231 reprend exactement V0.230 et ajoute la couche assistant vocal devant la conversation normale. Les commandes directes adressées à LIA sont routées par intention ; les appels utilisent uniquement les Contacts locaux du téléphone, ne devinent jamais une identité ambiguë et ouvrent le composeur système via `tel:` après résolution sûre. Les demandes de message restent fail-closed tant qu’aucun fournisseur réel n’est connecté. La parole ambiante ne peut jamais déclencher un appel. Cette récupération a été reconstruite sur l’archive V0.230 authentifiée par SHA-256 puis validée par **461/461 régressions**.

## V0.230 — conversation de table raccordable en conditions réelles

V0.230 raccorde le mode Table de LIA au LiaOrb existant : frontière STT/diarisation réelle, suivi multi-locuteurs, appels directs, rythme d'intervention, suivi de sujet, questions ouvertes, intentions et commandes typées, bridges vers rappels et Mémos, frontière du moteur de réponse et gate final avant synthèse vocale. Aucun STT/LLM fictif n'est déclaré disponible : les adaptateurs doivent être réellement enregistrés. Les tours vocaux bruts et pistes locuteurs restent uniquement en mémoire de session et sont effacés à l'arrêt.










































































## V0.229 — Conversation familiale et orchestration repas
- LIA relie réponses famille, habitudes, décisions repas et prochaine action.
- Les interventions sont courtes, dédupliquées et exploitables par voix/UI.
- Les habitudes établies évitent les questions inutiles sans transformer une supposition en confirmation.
- Une action externe engageante conserve une validation finale.
- Une réponse tardive ne modifie jamais silencieusement une commande déjà confirmée.

## V0.228 — LIA participe réellement à la table
- LIA peut rejoindre spontanément un sujet familial ordinaire quand elle a une contribution concrète et fiable.
- Elle attend une ouverture naturelle et ne parle jamais par-dessus une personne.
- Elle peut proposer une aide pratique à un parent, faire la recherche acceptée puis proposer de ranger les résultats dans Mémos avec accord.
- Elle peut poursuivre un sujet sur un ton léger si l’ambiance et la personne s’y prêtent.
- Elle peut apporter une connaissance quotidienne brève ; en cas d’ambiguïté elle demande une précision au lieu d’inventer.
- Aucune transmission automatique de confidence ou sous-entendu à un conjoint.

## V0.227 — Fin nette de la session LIA hors premier plan
- Si l’application passe en arrière-plan alors que la surface LIA est ouverte, cette surface se ferme.
- Cela garantit que l’état « LIA active » et le keep-awake ne peuvent pas rester accrochés à une ancienne session.
- Au retour, LIA reste disponible via son Orb mais ne reprend ni fenêtre, ni micro, ni voix automatiquement.

## V0.226 — LIA libère proprement le téléphone en arrière-plan
- Dès que l’application quitte le premier plan, l’écoute explicite et la voix LIA sont arrêtées.
- Le keep-awake V0.225 est alors automatiquement libéré par le même état d’écoute.
- Le retour au premier plan ne redémarre jamais le micro sans action explicite de l’utilisateur.

## V0.225 — LIA active maintient l’écran éveillé
- Quand la surface LIA est ouverte ou que son écoute explicite est active, l’auto-extinction de l’écran est suspendue.
- Dès que LIA n’est plus active, le comportement normal du téléphone est restauré.
- Aucun verrouillage manuel de l’utilisateur n’est contourné.

## V0.224 — Frontière vocale réelle du mode cuisine
- Un contrat `LiaCookingSpeechAdapter` relie désormais une future reconnaissance vocale native au contrôleur cuisine V0.223.
- Le bouton mains-libres n’apparaît que lorsqu’un adaptateur réel déclare être disponible.
- Sans moteur STT installé, l’application ne simule ni micro ni écoute.

## V0.223 — Contrôleur cuisine réutilisable
- Le traitement d’une commande cuisine est extrait dans `liaCookingRuntime`.
- L’écran cuisine utilise ce même contrôleur ; une future couche de reconnaissance vocale pourra l’appeler sans dupliquer la logique métier.
- Les limites locales existantes restent inchangées : pas de faux streaming musical, pas d’action non reconnue.

## V0.222 — Le moteur mains-libres agit sur la vraie session cuisine
- `CookingModeScreen` relie maintenant les intentions V0.205–V0.208 à son vrai index d’étape et à son vrai minuteur.
- Navigation et minuteur restent bornés par le moteur existant.
- Aucun faux micro/STT n’est annoncé : cette version prépare le point d’entrée réel pour la couche vocale native suivante.

## V0.221 — Une notification non ouverte ralentit réellement LIA
- Un pending non ouvert depuis 24 h devient un `ignored` une seule fois, puis son pending est effacé.
- La réconciliation se fait avant la sélection suivante : la politique existante peut donc ralentir naturellement les relances.
- Aucun callback de rejet fictif n’est utilisé.

## V0.220 — Une relance envoyée reste identifiable jusqu’à son ouverture
- L’historique mémorise maintenant l’open-loop et l’heure d’une notification réellement envoyée.
- Une ouverture efface ce pending et remet le compteur d’ignorés à zéro.
- Le schéma reste compatible avec l’historique V0.213 existant : les nouveaux champs sont optionnels.

## V0.219 — Relance in-app réellement affichée, sans double moteur
- `MainScreen`, déjà propriétaire du retour au premier plan et de l’Orb LIA, utilise désormais le runtime unique V0.217.
- Le corps décidé par le runtime est affiché dans l’Orb uniquement pour une livraison `in-app`.
- Le chemin parallèle historique et le second listener ajouté au niveau `App` ont été supprimés : une seule sélection, un seul comptage de surface.

## V0.218 — Le runtime vit dans l’application
- Le runtime de réengagement est maintenant appelé quand un foyer est actif puis à chaque retour réel de Notre Table au premier plan.
- Un verrou empêche deux exécutions concurrentes lors des transitions rapides de l’application.
- Comme l’app est au premier plan, la politique existante garde la relance dans l’app au lieu de produire une notification OS inutile.

## V0.217 — Orchestration réelle des relances
- Un service unique relie maintenant état de silence réel → sélection persistée → politique V0.201 → livraison → comptage de surface.
- Aucun compteur parallèle ni nouvelle règle de notification : si rien n’est livré, le fil n’est pas marqué comme montré.

## V0.216 — Un vrai envoi démarre le cooldown
- Une relance n’est maintenant marquée `sent` qu’après programmation réussie de la notification réelle.
- Un refus de permission ou une décision `none`/`in_app` ne falsifie donc pas la date du dernier envoi et ne déclenche pas artificiellement le cooldown de 12 h.

## V0.215 — Une notification ouverte ferme réellement la boucle
- Le cycle de vie principal détecte maintenant l’ouverture d’une notification de réengagement LIA et l’enregistre comme `opened`.
- Cela remet réellement à zéro le compteur d’ignorées via l’historique V0.212–V0.214, sans confondre les notifications privées déjà existantes.

## V0.214 — Le moteur consomme son historique tout seul
- Le sélecteur réel de réengagement lit maintenant automatiquement l’historique persisté de V0.213.
- Les appelants n’ont plus à lui transmettre manuellement le nombre de relances ignorées ni la date du dernier envoi ; les valeurs explicites restent possibles pour les tests/contrôles.

## V0.213 — Historique de réengagement persisté
- L’état envoi/ouverture/ignorée de V0.212 est maintenant réellement persisté dans le stockage existant de l’application.
- Le compteur survit donc aux réouvertures de Notre Table et peut alimenter la règle « deux relances ignorées = LIA ralentit/se tait » sans nouvelle table backend.

## V0.212 — Mémoire des relances
- Le moteur dispose maintenant d’un historique déterministe des relances : envoi, ouverture et relance ignorée.
- Une ouverture remet le compteur d’ignorées à zéro ; une relance ignorée l’incrémente. Ce compteur alimente directement la règle déjà validée qui coupe les relances après deux ignorées.

## V0.211 — Livraison réelle du réengagement
- Le canal décidé par la politique V0.201/V0.210 est maintenant consommé par le runtime de notifications : `none` ne fait rien, `in_app` reste dans l’application et `notification` passe par Expo Notifications.
- Aucune demande surprise d’autorisation : sans permission existante, la relance n’est pas envoyée.
- Le contenu utilisé est celui déjà filtré par la politique de confidentialité ; le runtime ne réinterprète pas le sujet.

## V0.210 — Reconnexion du réengagement aux vrais fils persistés
- La politique de V0.201 n’est plus seulement une règle de bibliothèque : le service réel des fils LIA peut maintenant sélectionner un fil persisté dû et produire le canal/corps de réengagement correspondant.
- Aucun fil réel = aucune relance. Les règles de pause, confidentialité, cooldown et relances ignorées restent celles déjà validées.

## V0.209 — Fin de minuteur respectueuse de la conversation
- LIA peut annoncer la fin d’un minuteur actif, mais jamais par-dessus une personne ni pendant qu’elle parle déjà.
- Une session terminée ou un minuteur non arrivé à zéro reste silencieux.

## V0.208 — Réponses vocales liées à l’état réel de la recette
- « Répète » renvoie l’étape réellement affichée ; « combien de temps reste ? » lit le minuteur réellement actif.
- Sans minuteur actif, LIA ne fabrique aucun temps restant.
- La dernière étape est reconnue afin que « suivante » ne fasse pas sortir de la recette.

## V0.207 — Exécution locale bornée en cuisine
- Les actions vocales sûres peuvent maintenant modifier un état d’exécution cuisine borné : lancer le minuteur, avancer d’une étape et arrêter la voix.
- La navigation est plafonnée à la dernière étape et une action externe/non disponible (ex. musique sans intégration) ne modifie rien localement.

## V0.206 — De la phrase vocale à l’action cuisine
- Les intentions mains libres de V0.205 produisent maintenant un plan d’action borné : minuteur local, navigation de recette, répétition, temps restant ou arrêt vocal.
- Un minuteur n’est exécutable que si une durée explicite a été extraite.
- Une demande de musique est marquée comme nécessitant une vraie intégration de streaming et n’est jamais présentée comme déjà exécutée.

## V0.205 — Commandes mains libres en cuisine
- Le noyau cuisine reconnaît maintenant les intentions vocales essentielles : lancer un minuteur avec durée explicite, demander le temps restant, prochaine étape, répéter, musique et arrêt de la voix.
- Un minuteur n’est jamais inventé : sans durée réellement prononcée, aucune durée n’est créée.
- La musique reste une intention à router vers une intégration disponible ; cette version ne prétend pas disposer d’un service de streaming inexistant.

## V0.204 — Tour de parole vocal
- LIA possède maintenant une politique vocale déterministe : **une voix humaine gagne toujours** et une réponse déjà en attente est annulée si quelqu’un recommence à parler.
- Lorsqu’on s’adresse directement à LIA, elle peut répondre après une courte pause ; spontanément, elle attend davantage à table qu’en cuisine.
- Fin de session ou retrait du consentement micro = arrêt immédiat.

## V0.203 — LIA ferme les boucles après les événements
- Après un rendez-vous ou une tâche terminée, LIA peut demander une seule fois comment cela s’est passé.
- Si tout va bien ou si l’événement est annulé, le fil se ferme ; s’il reste une action, LIA peut proposer un prochain pas et éventuellement un Mémo, sans agir silencieusement.
- Un refus ferme la relance au lieu de créer du harcèlement.

## V0.202 — LIA sait ce qui compte ensuite dans la journée
- Les événements ouverts sont maintenant arbitrés en un **brief de journée** : LIA choisit le prochain fil utile au lieu d’énumérer une liste de tâches.
- Un rendez-vous proche, un suivi dû ou une heure manquante remonte naturellement ; l’action proposée réutilise la politique bras droit existante et exige toujours confirmation lorsqu’elle agit.
- Les fils personnels/sensibles restent exclus de la table familiale.

## V0.201 — LIA donne une vraie raison de revenir
- Les relances hors application partent uniquement d’un **fil ouvert réel et arrivé à échéance** : aucun « ouvre-moi » artificiel pour fabriquer de l’engagement.
- Un sujet ordinaire peut produire une notification contextuelle ; un sujet personnel/sensible n’affiche qu’un aperçu générique et ne surgit jamais sur une surface principale potentiellement visible par la famille.
- Deux relances ignorées suffisent à faire ralentir LIA ; un cooldown de douze heures empêche les répétitions rapprochées et le mode pause garde le silence absolu.

## V0.200 — LIA à table : présence sociale sans envahir
- LIA à table reste explicitement activée et laisse la famille au centre : parole humaine, tension, détresse ou sujet sensible imposent le silence.
- Deux interventions maximum sur vingt minutes ; même un long silence peut rester un vrai silence sans que LIA cherche à le remplir.
- Les blagues exigent un contexte réel, ordinaire, sûr pour le foyer et déjà bien reçu par la personne visée ; poids, corps et santé sont exclus.
- Une anecdote doit correspondre à un événement réel avec un détail concret : aucune anecdote vague, reconstruite ou inventée.

## V0.199 — LIA apprend puis sait revenir dessus
- La curiosité relationnelle est désormais pilotée par des **lacunes de connaissance** : LIA choisit une seule question utile, ne redemande pas un fait connu et abandonne immédiatement en contexte tendu.
- Une réponse significative passe par la politique mémoire existante : les faits sensibles exigent toujours un consentement explicite avant conservation.
- Un souvenir peut ensuite produire un rappel naturel, une aide concrète ou un clin d’œil familial ; les faits personnels/sensibles sont interdits comme matière de table.

## V0.198 — LIA curieuse pendant les temps morts de cuisson
- Ajout d’un arbitre de temps mort : LIA ne lance une intervention que pendant une vraie attente de cuisson, sans parole humaine, sans moment sensible et avec un plafond d’interventions.
- Ajout d’une première banque structurée de curiosité (journée, famille, nutrition, goûts, congés) : ce n’est jamais un questionnaire et une information déjà connue n’est pas redemandée.
- Les questions sensibles (ex. allergie) sont exclues hors contexte privé ; LIA peut choisir le silence ou une proposition de musique plutôt que d’interroger.
- Validation locale V0.198 : **278/278 régressions**, **17/17 gates EAS**, **132 TS/TSX**, **958 clés EN**, audits continuité/hygiène/backend/release/feature/accessibilité PASS ; hygiène source **392 fichiers** ; backend **24 tables client / 17 RPC / 7 Realtime**, migrations **001 → 024**.

## V0.197 — LIA bras droit : proposer puis agir
- Nouveau moteur d’actions quotidiennes : rendez-vous, récupération d’un enfant, course, achat, travail ou sujet familial peuvent produire jusqu’à trois aides concrètes.
- LIA peut demander l’heure manquante sans formalité, mais une alarme, un rappel récurrent, une recherche, un Mémo ou un suivi ne s’exécute qu’après confirmation.
- Pour un rendez-vous sensible, préparation des notes, alarme et suivi restent marqués privés.
- Ajout d’un vrai canal d’alarme LIA audible, séparé des rappels historiques silencieux.
- Une alarme unique ou hebdomadaire peut être créée sur des jours sélectionnés ; reprogrammer le même identifiant remplace l’ancien horaire au lieu de dupliquer les rappels.
- Aucun `SCHEDULE_EXACT_ALARM` Android n’est demandé ; LIA reste sur les déclencheurs de notifications supportés.
- Une alarme personnelle/sensible affiche uniquement un texte générique sur l’écran verrouillé.
- Validation locale V0.197 : **276/276 régressions**, **17/17 gates EAS**, **132 TS/TSX**, **958 clés EN**, audits continuité/hygiène/backend/release/feature/accessibilité PASS ; hygiène source **391 fichiers** ; backend **24 tables client / 17 RPC / 7 Realtime**, migrations **001 → 024**.

## V0.196 — fils ouverts de LIA / bras droit quotidien
- LIA peut désormais conserver un sujet structuré à reprendre plus tard : rappel, suivi ou proposition d’aide.
- Chaque fil possède une échéance, une confidentialité, une action possible, une expiration facultative et un historique de relance.
- La sélection privilégie les rappels réellement dus et limite les relances : minimum 4 h entre deux surfaces et maximum 3 relances ignorées.
- Pause LIA, parole humaine et contexte social restent prioritaires ; un fil personnel ou sensible ne surgit jamais dans une surface familiale partagée.
- Les fils sont privés par RLS (`lia_open_loops`) et ne stockent pas de transcript de conversation, uniquement le résumé structuré nécessaire à la continuité.
- Une notification de fil ouvert ne demande jamais une permission système par surprise ; un sujet personnel/sensible exige le canal privé.
- À la réouverture de Notre Table, LIA peut reprendre un fil ordinaire arrivé à échéance et noter qu’elle l’a déjà relancé pour éviter la répétition.
- Validation locale V0.196 : **273/273 régressions**, **17/17 gates EAS**, **131 TS/TSX**, **958 clés EN**, audits continuité/hygiène/backend/release/feature/accessibilité PASS ; hygiène source **389 fichiers** ; backend **24 tables client / 17 RPC / 7 Realtime**, migrations **001 → 024**.

## V0.195 — LIA relationnelle + fiche protégée + famille par âge + cuisine accompagnée
- Ajout de la situation personnelle à cocher : Célibataire / Marié(e) / Divorcé(e) / En couple.
- Les informations relationnelles manquantes deviennent des lacunes souples : elles ne bloquent pas la fiche ; LIA peut revenir dessus avec tact.
- LIA ne peut jamais parler de couple, divorce, partenaire, enfant ou contact en l’inférant : ces références doivent venir de la fiche structurée.
- Ajout de la dictée assistée de fiche sur iOS : LIA prépare les champs entendus et n’écrit rien sans confirmation explicite.
- L’âge et les numéros manquants restent non bloquants ; une valeur fournie mais invalide ou un numéro dupliqué reste signalé.
- Messagerie adaptée automatiquement à chaque enfant : <16 petit mot seulement ; 16 ans choix repas + petit mot ; 17+ présence + choix + « Je m’en charge » + petit mot. Sans téléphone, aucun lien n’est envoyé.
- Le petit mot familial libre remonte à l’organisateur sans devenir automatiquement un Mémo LIA.
- Le mode cuisson affiche désormais LIA à côté de l’étape : durée explicite → chrono lançable ; sel → conseil prudent ; aucune durée n’est inventée.
- Android reste fail-closed pour la dictée tant que l’autorisation micro native actuelle reste bloquée par configuration.
- Validation locale V0.195 : **269/269 régressions**, **17/17 gates EAS**, **129 TS/TSX**, **958 clés EN**, audits continuité/hygiène/backend/release/feature/accessibilité PASS ; backend **23 tables client / 17 RPC / 7 Realtime**, migrations **001 → 023**.

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
- LIA peut comprendre les commandes contextuelles déjà décidées : « suivant », « précédent », « ouvre celui-là », « le troisième » et « autre chose ».
- Le carrousel actif est celui que l’utilisateur vient réellement de toucher ; l’auto-défilement ne change pas ce contexte.
- Une commande LIA déplace uniquement l’index visible ou ouvre explicitement une carte existante : aucun classement, rayon, résultat, statut de livraison ou placement sponsorisé n’est recalculé.
- Le même parseur accepte les formulations principales en français, anglais, espagnol et hébreu.
- La saisie contextuelle est intégrée dans le contrôle LIA existant afin de ne pas ajouter une nouvelle navigation.
- Validation locale V0.188 : **254/254 régressions**, **17/17 gates EAS**, **119 TS/TSX**, **918 clés EN**, audits continuité/hygiène/backend/release/feature PASS ; hygiène source **366 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.187 — « Voir tout » dans Commander
- Chaque carrousel conserve son aperçu limité à 8 cartes maximum.
- Lorsqu’un carrousel contient davantage de résultats pertinents, un bouton **Voir tout** ouvre sa liste complète.
- Le retour conserve le contexte Commander : adresse, filtres, position verticale et index des carrousels.
- Aucun changement du classement naturel, du rayon 10 km, de la vérité livraison ou des règles sponsorisées.
- Validation locale V0.187 : **252/252 régressions**, **17/17 gates EAS**, **118 TS/TSX**, **914 clés EN**, audits continuité/hygiène/backend/release/feature PASS.

## V0.186 — release doctor avec preuve bêta physique
- Le release doctor expose maintenant un stage séparé **Physical beta evidence**.
- Il exige deux preuves indépendantes avant de considérer la bêta prouvée : 16 scénarios historiques + 53 scénarios Commander/LIA.
- Une preuve absente, incomplète ou liée à une autre version reste **BLOCK** ; aucun contenu sensible de preuve n’est affiché par le doctor.
- Aucun changement de règle produit ni de comportement runtime.

## V0.185 — preuve bêta des 53 scénarios
- Ajout d’un générateur de fichier de preuve pour la matrice Commander + LIA.
- Ajout d’un audit distinct `feature:beta:audit` qui exige build réel, révision source, au moins deux appareils physiques et 53/53 scénarios PASS avec référence de preuve.
- Ce gate reste volontairement hors de `verify` afin qu’une validation locale ne puisse jamais être confondue avec une bêta réelle.
- Aucun changement de règle produit ni de comportement runtime.
- Validation locale V0.185 : **248/248 régressions**, **17/17 gates EAS**, **118 TS/TSX**, **913 clés EN**, audits continuité/hygiène/backend/release/feature PASS.

## V0.184 — matrice d’acceptation Commander + LIA
- 53 scénarios versionnés couvrent localisation, livraison, carrousels, sponsorisation, LIA privée, Mémos/Favoris, réseau, RTL et accessibilité.
- 33 invariants sont marqués critiques.
- `npm run verify` contrôle désormais aussi la structure et la couverture de cette matrice.
- Ce gate ne prétend jamais remplacer une vraie validation sur appareils.
- Aucun comportement utilisateur existant n’est modifié.
- Validation locale V0.184 : **246/246 régressions**, **17/17 gates EAS**, **118 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, **53/53 scénarios** de matrice présents dont **33 critiques**, audits continuité/hygiène/backend/release/feature-acceptance PASS ; hygiène source **358 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.183 — consentement et localisation non bloquants
- Analytics, personnalisation publicitaire et localisation précise démarrent sans consentement accordé.
- La localisation précise ne peut être utilisée qu’après accord explicite.
- Refuser la localisation précise ne bloque pas Commander : l’adresse du foyer reste le fallback normal.
- Aucune permission native n’est demandée automatiquement par ce checkpoint.
- La télémétrie V0.182 exige désormais à la fois un provider explicite et un consentement analytics accordé.
- Validation locale V0.183 : **244/244 régressions**, **17/17 gates EAS**, **118 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **354 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.182 — télémétrie commerciale minimale et privée
- Le provider de télémétrie est désactivé par défaut et doit être branché explicitement.
- Commander mesure uniquement des actions commerciales explicites : ouverture, fiche restaurant, clic sponsorisé et sortie vers une commande vérifiée.
- Les métadonnées suivent une allowlist stricte ; les champs inconnus sont supprimés.
- Aucun contenu de LIA, Mémo, confidence ou donnée sensible n’entre dans cette télémétrie.
- Les impressions sponsorisées restent volontairement non branchées tant qu’une vraie mesure de visibilité n’existe pas.
- Validation locale V0.182 : **241/241 régressions**, **17/17 gates EAS**, **116 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **351 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.181 — états Commander sans ambiguïté
- Sans adresse active, Commander demande une adresse au lieu de lancer une recherche incomplète.
- Hors ligne, Commander affiche un état explicite et ne présente aucune disponibilité ancienne comme actuelle.
- Le retour de la connexion déclenche une nouvelle vérification provider automatiquement.
- L’adresse du foyer reste inchangée : la règle de session V0.170 est conservée.
- Aucun changement des règles de rayon 10 km, de livraison, de Favoris, de Mémos ou de sponsorisation.
- Validation locale V0.181 : **239/239 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **913 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **349 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.180 — retour explicite depuis un Mémo vers son contexte
- Un Mémo lié peut proposer **Ouvrir l’espace lié** uniquement après une action explicite de l’utilisateur.
- Restaurant/Commander réutilisent Commander ; recette réutilise Recettes ; repas réutilise Planning ; courses réutilisent Courses ; famille réutilise Foyer.
- Aucun nouveau flux parallèle n’est créé et aucun Mémo ne navigue automatiquement.
- Les liens `other` restent informatifs uniquement.
- Favori ≠ Mémo reste inchangé.
- Validation locale V0.180 : **237/237 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **909 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **348 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.179 — Mémos liés sans confondre mémoire, Favoris et actions
- Un Mémo peut conserver facultativement un lien structuré vers un restaurant, une recette, un repas, les courses, Commander, la famille ou un autre élément identifié.
- Le lien conserve uniquement `kind`, `ref` et un libellé court ; aucun transcript de conversation ni confidence n’est ajouté aux Mémos.
- Un Mémo sans lien reste parfaitement valide.
- Le lien est affiché comme contexte informatif et ne lance aucune action automatiquement.
- **Favori ≠ Mémo** reste strict : aucun Favori restaurant ne crée de Mémo et aucun Mémo ne crée de Favori.
- Migration additive `202609160021_lia_memo_links.sql` ; RLS propriétaire existante inchangée.
- Validation locale V0.179 : **235/235 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **908 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **347 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 021**.

## V0.178 — confidentialité contextuelle LIA
- Un routeur dédié choisit entre voix, écran privé, notification privée et silence sans modifier la personnalité de LIA.
- Une information sensible n’est jamais prononcée, y compris lorsque LIA est explicitement en mode table/social.
- Hors écran, LIA peut envoyer un signal privé dont l’aperçu reste générique ; le texte sensible n’entre jamais dans le contenu de la notification.
- L’inbox privée locale est séparée par propriétaire et bornée ; ouvrir le message révèle le détail dans l’app, pas sur l’écran verrouillé.
- Une pause demandée continue à bloquer toute initiative proactive ; une interaction volontaire de l’utilisateur reste possible.
- Aucune donnée privée/confidentielle n’est transmise au moteur publicitaire Commander.
- Validation locale V0.178 : **232/232 régressions**, **17/17 gates EAS**, **115 TS/TSX** sans erreur de transpilation, **907 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **345 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.177 — moteur commercial local désactivé par défaut
- Un contrat de campagne sponsorisée locale est ajouté sans activer de régie ni campagne réelle.
- L’éligibilité commerciale ne reçoit que des signaux Commander non sensibles : catégorie demandée, distance, calendrier de campagne et historique d’exposition sponsorisée.
- Rayon campagne limité à **10 km maximum** ; budget, planning complexe et plafond global restent des décisions du provider/serveur de confiance.
- Une campagne expirée, hors budget, hors rayon, hors fréquence ou non explicitement `sponsored=true` est rejetée.
- Un moteur d’intercalage garantit qu’un sponsor n’est pas la première carte et qu’il est séparé par au moins deux cartes naturelles.
- Une impression n’est enregistrée que par un appel explicite après visibilité réelle ; rien n’est compté au simple chargement des données.
- Aucun contenu de confidence, Mémos, santé, relation ou donnée sensible n’entre dans ce moteur.
- Validation locale V0.177 : **228/228 régressions**, **17/17 gates EAS**, **113 TS/TSX** sans erreur de transpilation, **905 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **342 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.176 — abstraction multi-fournisseurs Commander
- Plusieurs providers organiques peuvent être interrogés en parallèle sans mélanger l’inventaire sponsorisé au classement naturel.
- Une panne isolée n’annule pas les autres sources ; si toutes échouent, l’échec reste explicite.
- Dédoublonnage prudent par identité forte : source/id, téléphone exact normalisé ou nom+adresse normalisés.
- La première source reste canonique ; les suivantes peuvent compléter des informations manquantes et des chemins de commande sans écraser silencieusement la vérité de livraison.
- Plusieurs providers de livraison peuvent être configurés ; seuls les restaurants encore `unknown` passent au provider suivant.
- Les chemins de commande peuvent conserver officiel / plateforme / téléphone avec la priorité déjà décidée, sans activer de service réel à ce checkpoint.
- Validation locale V0.176 : **225/225 régressions**, **17/17 gates EAS**, **111 TS/TSX** sans erreur de transpilation, **905 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **339 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.175 — fiche restaurant complète et retour Commander conservé
- La fiche restaurant reste strictement fondée sur des données vérifiées : aucun lien de commande, numéro, frais, minimum ou image n’est inventé.
- ETA en fourchette, frais de livraison et minimum de commande sont affichés uniquement lorsqu’ils sont fournis avec une devise explicite.
- Un bouton **Appeler** n’apparaît que lorsqu’un numéro existe ; le bouton **Commander** reste conditionné à un `orderUrl` vérifié.
- Les médias restent facultatifs ; aucune photo Google supplémentaire n’est demandée par ce checkpoint.
- Au retour de la fiche, Commander conserve l’adresse active, la recherche, la catégorie, la position verticale et l’index de chaque carrousel.
- Favoris, Mémos, classement naturel, sponsorisés et vérité de livraison restent inchangés.
- Validation locale V0.175 : **221/221 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **905 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **337 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.174 — distance réelle et carrousel « À moins de 3 km »
- Le provider de découverte calcule maintenant la distance réelle entre l’adresse active géocodée et chaque restaurant retourné.
- Cette distance est transportée comme donnée facultative `distanceKm` et affichée sur les cartes, carrousels et fiches restaurant lorsqu’elle est disponible.
- Commander ajoute le carrousel déjà décidé **« À moins de 3 km »**, trié par distance réelle.
- La distance reste strictement distincte de la livraison : être proche ne transforme jamais `delivery=unknown` en `confirmed`.
- Les providers sans distance restent compatibles ; aucun faux kilométrage n’est fabriqué côté UI.

## V0.173 — vérification de livraison séparée de la découverte
- Commander possède une troisième frontière provider dédiée à la **livraison réelle vers l’adresse active**.
- La découverte d’un restaurant ne suffit jamais à confirmer sa livraison : le provider de livraison doit répondre explicitement `confirmed`, `unknown` ou `unavailable`.
- Un résultat `unavailable` est retiré ; une réponse absente ou un provider indisponible ne devient jamais `confirmed`.
- Le provider de livraison ne peut pas créer de nouveaux restaurants : il enrichit uniquement les établissements déjà découverts par leur identifiant.
- ETA, frais, minimum de commande et lien de commande peuvent être ajoutés uniquement par une réponse de livraison vérifiée ou conservés s’ils étaient déjà fournis par une source vérifiée.
- Aucun service de livraison réel n’est branché à ce checkpoint : la nouvelle frontière reste inactive par défaut.
- Validation locale V0.173 : **215/215 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **335 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.

## V0.172 — découverte restaurants réelle prête côté serveur
- Commander possède maintenant un provider **Google Places API (New)** derrière l’Edge Function authentifiée `commander-search`, tout en gardant le provider sponsorisé dans une frontière séparée.
- La clé Google reste exclusivement côté serveur (`GOOGLE_MAPS_API_KEY`) ; le mobile ne reçoit qu’un interrupteur de provider `EXPO_PUBLIC_COMMANDER_LIVE_PROVIDER=supabase-edge`.
- Le provider est **désactivé par défaut** : sans activation Supabase + Edge déployée/configurée, Commander continue de ne rien inventer.
- Le serveur géocode l’adresse active puis recherche uniquement des restaurants, avec rayon reclampé à **10 km maximum** côté serveur.
- Google sert uniquement à la **découverte** : chaque résultat reste `delivery=unknown`, `orderUrl=null`, et aucun restaurant n’est présenté comme livrable sans source dédiée.
- Les résultats Google affichent l’attribution **Google Maps** ; aucune photo ni review Google n’est demandée à ce checkpoint.
- Les Favoris Google conservent seulement l’identité provider/Place ID ; la migration `202609160020_google_place_favorite_storage.sql` empêche le stockage durable du nom/catégories Google.
- Le classement naturel et l’inventaire sponsorisé passent par deux providers distincts ; aucun sponsor n’apparaît sans provider commercial vérifié.
- Validation locale V0.172 : **212/212 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **334 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**. Aucun appel Google réel, déploiement Edge, secret distant, build Expo installé ou appareil physique n’est revendiqué.

## V0.171 — Favoris restaurants privés dans Commander
- Un restaurant vérifié peut être ajouté ou retiré des **Favoris** depuis sa fiche Commander.
- **Favori ≠ Mémo** : les favoris restent un état restaurant privé et ne créent jamais un Mémo LIA.
- En mode démo, les favoris restent locaux ; avec Supabase, la migration `202609160019_commander_favorites.sql` applique une RLS strictement propriétaire (`user_id = auth.uid()`).
- Le bouton Favori annonce correctement ses états `selected`, `disabled` et `busy`, et toute erreur est annoncée comme alerte accessible.
- Aucune donnée restaurant n’est inventée : la fonction ne s’applique qu’à une fiche issue du provider Commander.
- Validation locale V0.171 : **206/206 régressions**, **17/17 gates EAS**, **108 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 019**. Le build installé, Supabase distant et les appareils physiques ne sont pas revendiqués.

## V0.170 — changer l’adresse dans Commander sans toucher au foyer
- Commander affiche l’adresse active et permet de la remplacer pour la **session courante**.
- Le changement de session ne réécrit jamais silencieusement `households.delivery_address`.
- Une adresse vide ne peut pas être appliquée ; l’éditeur est accessible et expose son état ouvert/fermé.
- Changer l’adresse recharge immédiatement le contexte du provider tout en conservant le plafond de 10 km.
- Validation locale V0.170 : **204/204 régressions**, **17/17 gates EAS**, **107 TS/TSX** sans erreur de transpilation, **892 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **326 fichiers** ; backend **21 tables client / 17 RPC / 7 Realtime**, migrations **001 → 018**. Le build installé, Supabase distant et les appareils physiques ne sont pas revendiqués.

## V0.169 — adresse de livraison du foyer pour Commander
- Lors de la création du foyer, l’organisateur peut enregistrer une **adresse de livraison facultative** ; elle ne bloque jamais l’onboarding si elle reste vide.
- L’adresse est persistée sur le foyer par la migration additive `202609160018_household_delivery_address.sql` et rechargée avec le foyer.
- Commander reçoit cette adresse comme destination par défaut et conserve son plafond absolu de **10 km**.
- Une interface de provider réelle est prête ; sans provider vérifié ou sans adresse, Commander retourne toujours zéro résultat plutôt que d’inventer une disponibilité.
- Les règles famille, Mémos, LIA et la navigation historique restent inchangées.
- Validation locale : **202/202 régressions**, **17/17 gates EAS**, **107 TS/TSX**, **883 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **325 fichiers**.

## V0.168 — Commander devient navigable sans inventer de données
- Le cœur V0.167 reste inchangé ; cette version complète uniquement la surface Commander déjà validée.
- Les résultats vérifiés de 3 éléments ou plus peuvent être présentés en **carrousels horizontaux** avec swipe, points de pagination et auto-défilement lent.
- Toute interaction tactile arrête l'auto-défilement ; la préférence système de réduction des animations le désactive aussi.
- Avec seulement 1 ou 2 résultats utiles, Commander affiche une liste courte plutôt qu'un faux carrousel.
- Une **fiche restaurant** affiche uniquement les informations effectivement disponibles et n'ouvre une commande que si un `orderUrl` vérifié est fourni.
- Tant qu'aucun provider réel n'est connecté, `loadCommanderPlaces()` reste vide : aucun restaurant, horaire ou lien de commande n'est inventé.
- Aucun onglet historique, règle famille, règle LIA ou logique métier antérieure n'est modifié.

## V0.167 — LIA ajoute Mémos et Commander sans toucher au cœur existant
- V0.166 reste la base fonctionnelle : aucun onglet historique ni flux métier existant n’est supprimé ou remplacé.
- **Âge enfant facultatif** : laisser l’âge vide ne bloque plus la fiche famille ; si un âge est renseigné mais impossible, LIA le signale toujours. Un message LIA explique que connaître les âges aide simplement à situer les enfants dans la hiérarchie familiale.
- Après la fiche famille, l’administrateur voit **une seule fois** la seconde présentation de LIA déjà validée ; son affichage est mémorisé localement.
- **Mémos** devient un espace privé explicite : rien n’est enregistré automatiquement ; création, statut Réglé/Actif et suppression sont disponibles, avec stockage local en démo et table Supabase privée en production.
- **Commander** est ajouté comme surface LIA indépendante, avec règle de rayon maximum **10 km**, catégories et comportement honnête : aucune disponibilité de restaurant n’est inventée tant qu’aucune source locale n’est connectée.
- Commander et Mémos s’ouvrent depuis le panneau LIA ; le TabBar historique Planning / Recettes / Courses / Foyer reste inchangé.
- Migration additive `202609160017_lia_memos_child_age_optional.sql` : table `lia_memos` avec RLS privée + remplacement contrôlé du RPC de fiche famille pour accepter un âge enfant nul.
- Validation locale : **198/198 régressions**, **17/17 gates EAS**, **105 TS/TSX**, **858 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **320 fichiers**. Backend statique : **21 tables client / 17 RPC / 7 Realtime**, migrations **001 → 017**. Le build installé et les appareils physiques restent à prouver séparément.

## V0.166 — LIA ouvre la fiche famille, veille à midi et respecte le silence
- La création du foyer n'est plus un interrogatoire : LIA ouvre une **fiche famille unique** à remplir, avec organisateur, conjoint, enfants et autres personnes du foyer.
- La fiche demande les informations structurées utiles : civilité, prénom, âge et téléphone ; le téléphone reste facultatif pour un enfant qui n'en a pas.
- Avant validation, LIA signale obligatoirement les champs manquants, âges impossibles, numéros invalides, doublons de téléphone et liens familiaux manquants.
- Une seule opération serveur transactionnelle `complete_household_family_setup` enregistre le profil et reconstruit le roster léger du nouveau foyer ; la migration 016 reste additive.
- Si l'organisateur n'ouvre pas Notre Table, LIA peut envoyer un rappel local vers midi pour le déjeuner et le soir. Ouvrir l'app annule le rappel du jour et reprogramme les suivants.
- L'organisateur peut mettre LIA en silence pour aujourd'hui, plusieurs jours ou jusqu'à nouvel ordre. **Aucune blague n'est faite au moment où le silence est demandé.**
- L'humour n'est autorisé que lors d'un **retour volontaire avant la fin d'une pause minutée** ; une pause jusqu'à nouvel ordre n'entraîne pas de remarque comique.
- La politique conversationnelle distingue la **confidente**, la **ménagère** et le mode combiné : un problème personnel peut déboucher sur une aide concrète ou un dîner pour recréer du lien seulement si cela aide réellement et si l'utilisateur ne l'a pas refusé.
- Validation locale : **196/196 régressions**, **17/17 gates EAS**, **99 TS/TSX**, **818 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **312 fichiers**.
- Backend statique : **20 tables client / 17 RPC / 7 Realtime**, migrations **001 → 016**.
- Le vrai `tsc` installé, les bundles Expo, Supabase distant et les tests multi-appareils restent à prouver ; `node_modules` est absent de cet environnement.

## V0.165 — LIA configure le foyer sans questionnaire
- Les foyers déjà existants restent considérés comme configurés ; aucun ancien utilisateur n’est renvoyé dans l’onboarding.
- Un nouveau foyer passe par deux questions seulement : le prénom de l’organisateur puis le nombre habituel de personnes à table.
- Aucun abonnement n’est requis pour cette configuration et aucun membre premium n’est créé artificiellement avant paiement.
- Le prénom et la taille habituelle du repas sont enregistrés côté serveur dans une opération contrôlée réservée à l’administrateur du foyer.
- La taille habituelle devient immédiatement la base des portions du premier repas, même si les autres personnes n’ont pas encore de compte.
- Migration additive `202609160015_household_lia_setup.sql` ; nouveaux foyers `setup_completed=false`, anciens foyers protégés par défaut `true`.
- Validation locale : **193/193 régressions**, **17/17 gates EAS**, **96 TS/TSX**, **767 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **307 fichiers**.
- Backend statique : **20 tables client / 16 RPC / 7 Realtime**, migrations **001 → 015**.
- Le vrai build installé Expo/Supabase distant et les tests multi-appareils restent à prouver ; `node_modules` est absent de cet environnement.

## V0.164 — LIA prend la parole après le choix de langue
- Le premier écran reste le choix explicite de langue ; aucun compte, foyer ou paywall ne passe avant.
- À l’étape suivante, LIA peut se présenter oralement avec la voix native locale du téléphone, donc sans coût TTS cloud obligatoire.
- La présentation automatique est tentée une seule fois après le choix de langue et reste silencieuse si VoiceOver/TalkBack est actif ; un bouton visible permet toujours Écouter/Arrêter.
- LIA annonce clairement la suite : création du compte puis du foyer. Le paiement n’est pas placé dans ce premier contact.
- Quitter l’onboarding ou continuer coupe immédiatement la parole de LIA pour éviter tout son orphelin.
- Validation locale : **191/191 régressions**, **17/17 gates EAS**, **95 TS/TSX**, **751 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **304 fichiers**.
- Le vrai build natif et l’écoute sur appareil physique restent à prouver ; `node_modules` est absent de cet environnement.

## V0.163 — laboratoire d’identité vocale de LIA

- Le panneau LIA propose maintenant **trois voix candidates A / B / C** parmi les meilleures voix réellement disponibles sur l’appareil dans la langue courante.
- Les trois candidates utilisent exactement la même phrase d’essai pour permettre une comparaison honnête.
- Chaque candidate permet d’écouter les trois réactions prévues : sourire vocal, petit rire et rire bref.
- Changer de voix révoque automatiquement toute validation précédente du rire.
- Les réactions de rire sociales restent **désactivées par défaut** et ne peuvent être utilisées à table qu’après validation explicite dans le laboratoire vocal.
- Les essais de rire actuels sont des prototypes rendus par le moteur vocal natif du téléphone ; ils ne sont pas présentés comme des rires studio définitifs.
- Aucun coût TTS cloud supplémentaire n’est introduit.
- Le vrai choix final dépend d’une écoute sur appareil physique ; ce checkpoint construit le mécanisme, il ne prétend pas avoir choisi la voix à la place de l’utilisateur.
- Validation locale : **189/189 régressions**, **17/17 gates EAS**, **95 TS/TSX**, **745 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **303 fichiers**.

## V0.162 — oreille Android YAMNet prête, activation encore fail-closed

- Le module Android de LIA intègre maintenant le chemin réel de classification audio locale avec **TensorFlow Lite Task Audio 0.4.4** et **YAMNet LiteRT/TFLite**.
- YAMNet classifie localement les événements audio ; le runtime ne remonte à LIA que `label + score + timestamp`, jamais le flux audio de la pièce.
- Le modèle attendu est verrouillé par provenance : `google/yamnet` `classification-tflite` v1, **4 126 810 octets**, SHA-256 `10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de`, licence Apache-2.0.
- Nouveau script `npm run vendor:yamnet -- /chemin/vers/1.tflite` : il refuse tout modèle dont la taille ou le SHA diffère avant copie dans les assets Android.
- **Fail-closed volontaire** : le fichier modèle n'a pas pu être téléchargé dans cet environnement ; Android conserve donc `RECORD_AUDIO` bloqué et `isSoundAnalysisAvailable()` reste faux tant que modèle + permission finale ne sont pas réellement packagés.
- La voix Android `TextToSpeech` reste indépendante et disponible dans le contrat natif.
- Aucun upload cloud n'est ajouté au chemin d'écoute sociale.
- Contrat détaillé : `docs/LIA_ANDROID_AUDIO_V0162.md`.
- Validation locale : **187/187 régressions**, **17/17 gates EAS**, **95 TS/TSX**, **728 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **302 fichiers**.
- Le vrai build Gradle/Expo/EAS et les tests sur Android physique restent à faire avant toute activation du micro Android.

## V0.161 — LIA a une voix native et une oreille locale sur iPhone

- Nouveau module Expo local `modules/lia-sound-analysis` : aucun service TTS cloud obligatoire pour faire parler LIA.
- iOS utilise `AVSpeechSynthesizer`; Android utilise `TextToSpeech`. LIA peut tester et changer parmi les voix installées compatibles avec la langue de l'appareil.
- iOS ajoute une oreille sociale locale avec `SNAudioStreamAnalyzer` + `SNClassifySoundRequest` : le rire et la reprise de parole sont classifiés sur l'appareil, sans fichier audio ambiant envoyé au cloud.
- L'écoute reste strictement opt-in : Cuisine/À table puis bouton explicite puis permission micro système. Elle ne démarre jamais automatiquement.
- Si un humain reprend la parole pendant que LIA parle, sa voix est coupée immédiatement. Un rire isolé ne suffit pas à déclencher une réaction.
- Android sait déjà faire parler LIA, mais son classificateur local de rire n'est pas encore intégré : `RECORD_AUDIO` y reste bloqué.
- Contrat détaillé : `docs/LIA_AUDIO_V0161.md`.
- Le code natif n'est pas encore prouvé sur appareil : vrai prebuild/build iOS/Android et tests physiques obligatoires avant de déclarer la fonction matériellement validée.
- Validation locale : **186/186 régressions**, **17/17 gates EAS**, **95 TS/TSX**, **728 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **296 fichiers**.

## V0.160 — LIA participe socialement sans devenir envahissante

- Nouveau moteur `src/lib/liaSocialPresence.ts` : LIA peut choisir `smile`, `chuckle` ou `laugh` après un rire, mais uniquement dans une session sociale explicitement active et consentie.
- Priorité absolue à l'humain : parole active, interruption ou reprise de conversation annulent immédiatement toute réaction sociale en attente.
- Pas de rire mécanique : confiance minimale, vrai silence après le rire, cooldown de 45 s et budget maximal de réactions selon le niveau social.
- Contexte sensible = aucune réaction ludique. Niveau Discrète = aucun rire vocal.
- Contrat privacy local-first : aucun audio ambiant envoyé au cloud pour détecter le rire ; si le classificateur local n'est pas disponible, la fonction reste inactive.
- Chemin natif retenu : Apple Sound Analysis sur iOS et MediaPipe Audio Classifier sur Android. Le module natif n'est pas encore branché dans ce checkpoint, donc `RECORD_AUDIO` reste volontairement bloqué.
- Document de référence : `docs/LIA_SOCIAL_AUDIO_V0160.md`.
- Validation locale : **183/183 régressions**, **17/17 gates EAS**, **92 TS/TSX**, **716 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **285 fichiers**.

## V0.159 — découverte LIA à coût plafonné

- La présentation initiale de LIA avant authentification est **locale/scriptée** : un téléchargement qui ne devient jamais compte ne nécessite aucun appel IA payant.
- Après authentification et avant abonnement, le cloud de découverte dispose d’un budget d’acquisition interne maximal de **0,05 $ à vie par compte**.
- À **0,035 $**, la découverte passe en routage économique ; à **0,05 $**, les appels cloud gratuits s’arrêtent mais l’expérience locale continue.
- Nouveau moteur `src/lib/liaDiscovery.ts` : modes `local_intro`, `cloud_normal`, `cloud_economy`, `local_only`, `subscriber`.
- Nouveau garde serveur transactionnel `reserve_lia_discovery_budget` : plafond 50 000 micro-USD, verrou concurrent, `request_id` idempotent, exécution réservée au `service_role`.
- Risque théorique : 90 000 comptes gratuits arrivant tous au plafond = **4 500 $** d’IA de découverte, au lieu d’un coût non borné.
- Le fournisseur IA cloud n’est pas encore branché dans cette version : le contrat économique est prêt, mais aucun appel fournisseur n’est prétendu opérationnel.
- Validation locale : **180/180 régressions**, **17/17 gates EAS**, **91 TS/TSX**, **716 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **282 fichiers**.

## V0.158 — langue d’abord, puis LIA

- Le premier écran du premier lancement est désormais le choix explicite de langue.
- La langue de l’appareil ne sert que de présélection ; le choix utilisateur est mémorisé séparément.
- Après validation, LIA se présente immédiatement avant authentification et création du foyer.
- V0.158 expose uniquement FR / EN / ES / HE, qui sont les langues complètement localisées aujourd’hui ; IT / PT-BR / AR restent prévues mais masquées tant que la localisation complète n’est pas prête.
- Aucun microphone/TTS n’est activé automatiquement par ce parcours.

## V0.157 — abonnement durable et budget LIA

- Une seule **LIA complète** : aucun modèle de LIA différent selon la durée choisie.
- Trois durées de référence validées pour le modèle économique : **6,99 $ / mois**, **34,99 $ / 6 mois**, **59,99 $ / an**.
- En production, l’écran n’utilise jamais ces montants comme fallback : les prix localisés proviennent obligatoirement d’Apple/Google via l’adaptateur RevenueCat.
- Nouveau moteur `src/lib/liaEconomics.ts` : estimation du coût texte/recherche/voix/TTS/image à partir de tarifs fournis, cible interne **1 $ / foyer / mois**, et paliers `normal` / `economize` / `protect_margin`.
- Le garde de marge ne coupe jamais une aide essentielle : il change d’abord le routage technique et refuse seulement les routes coûteuses non essentielles.
- Projection explicite à l’échelle : 10 000 foyers à 1 $ de coût moyen LIA = 10 000 $/mois de coût IA estimé.
- Les tarifs fournisseur ne sont pas codés en dur dans l’app afin de pouvoir être mis à jour sans publier une nouvelle version.

## V0.156 — LIA, la Confidente

- **LIA** devient la couche intelligente permanente de Notre Table : un seul point d’accès global, au-dessus des onglets, jamais un chatbot isolé dans une page.
- Première surface fonctionnelle ajoutée : états **Cuisine / À table / Discrète**, niveau social **Discrète / Présente / Animatrice**, pause immédiate et message clair sur micro/mémoire.
- Nouveau moteur de politique `src/lib/lia.ts` : une question n’est posée que si elle peut changer une décision ; LIA se tait lorsqu’un humain parle et attend davantage en mode table qu’en cuisine.
- Mémoire structurée prévue avec visibilité `organizer`, `member_private` ou `household`, confirmation et dates de validité. Les informations personnelles temporaires ne deviennent jamais des vérités permanentes.
- Le contrat complet couvre : profils nutritionnels individuels, invités, « Je m’en occupe », restes, chronos, mode cuisine vocal, mode à table, politesse conversationnelle, humour renouvelable, anecdotes, notifications et accès extérieur contrôlé.
- Document de référence : `docs/LIA_CONFIDANTE_V0156.md`.

## V0.156 — cuisiner avec ce que j’ai, photos cumulées

- Nouvelle entrée **Avec ce que j’ai** depuis Recettes/Cuisiner, sans ajouter d’onglet principal.
- Deux sources simples : photo du frigo/placard ou stock déjà enregistré.
- Les photos sont **cumulatives** : étagères, porte, bacs et placard peuvent être photographiés séparément ; chaque nouvelle vue enrichit la même analyse et ne remplace jamais la précédente.
- Les doublons reconnus sont fusionnés par ingrédient ; tous les produits uniques restent pris en compte pour le matching, même si l’écran n’en montre qu’un résumé compact.
- Le moteur limite les propositions à **3 recettes maximum** pour préserver la simplicité.
- Le parcours est **conversationnel** : après une photo, Notre Table demande si l’organisateur veut compléter, reprendre une photo ou écrire un produit à la main.
- Les détections incertaines ne sont jamais utilisées silencieusement pour les recettes : un Oui/Non rapide les confirme ou les retire.
- **Cohérence du dîner** : aucune idée « pour ce soir » n’est affichée tant que le nombre de convives n’est pas connu. Notre Table réutilise d’abord le dîner déjà planifié ; sinon elle propose « Demander à la famille » ou une saisie directe du nombre.
- Le matching recette est désormais **quantitatif** : les quantités de recette sont recalculées selon le nombre de convives et le résultat distingue `suffisant`, `insuffisant` et `quantité à confirmer`. Une quantité non lisible sur photo n’est jamais inventée.
- Validation locale après intégration LIA : **170/170 régressions**, audit projet PASS, audit hygiène source PASS, **88 TS/TSX transpillés sans erreur** et **709 clés EN** avec parité.
- V0.155 reste le checkpoint officiel importé/verrouillé ; V0.156 est la ligne produit en cours de validation.

## V0.155 — lockfile npm réel et reproductible

- Le premier `package-lock.json` réel a été généré sur un runner GitHub avec Node 22.16.0 / npm 10.9.2 puis prouvé par un `npm ci` propre réussi.
- Le lockfile est maintenant versionné et son identité/version racine est gardée synchronisée avec `package.json`.
- Preuve GitHub : bootstrap run `35005422406`, puis resynchronisation V0.155 run `35006195617` / job `104506432590`; `npm ci` PASS sur les deux runs ; lockfile V0.155 SHA-256 `1031e4d59be74bb0228b8812e2a73bf0de17ac026070e0c7b9f5f5852161b029`.
- Validation locale V0.155 : **165/165 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN**, audits PASS ; hygiène source **268 fichiers**.
- La prochaine preuve installée à obtenir reste le vrai `tsc` + exports Expo iOS/Android sur le runtime complet.

## V0.154 — états busy complets sur les écritures visibles
- Aucun changement produit, backend, navigation ou rendu visuel.
- Réactions recette, actions membres légers, avatar et coche des courses annoncent désormais `busy` pendant leurs écritures asynchrones.
- Le contrat statique passe à 21 Pressables avec `accessibilityState.busy`.
- Validation locale V0.154 : **164/164 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source sur **266 fichiers**.

## V0.153 — réactions recettes single-flight
- Aucun changement produit, backend, navigation ou rendu visuel.
- `RecipeTasteCard` ajoute `tasteInFlight` pour bloquer un second tap avant le rerender React.
- Le verrou est toujours relâché dans `finally`, succès ou erreur.
- Garde permanent ajouté dans les régressions et l’audit statique.
- Validation locale V0.153 : **164/164 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source sur **265 fichiers**.

## V0.152 — recettes et présence single-flight
- Imports URL/photo, favoris, ajout aux courses, création de recette et présence protégés contre les doubles déclenchements avant rerender.
- Aucun changement produit, backend, navigation ou rendu visuel.
- Validation locale V0.152 : **164/164 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source sur **264 fichiers**.

## V0.151 — authentification et profil single-flight
- Connexion/inscription/récupération, déconnexion, avatar et préférences protégés contre les doubles soumissions avant rerender.
- Le bouton de sauvegarde des préférences expose aussi `disabled` + `busy` pendant l’écriture.
- Aucun changement produit, backend ou navigation.
- Validation locale V0.151 : **163/163 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source sur **263 fichiers**.

## V0.150 — effets de bord planning/courses/garde-manger single-flight
- Verrous synchrones avant les mutations et exports à effet de bord encore exposés aux doubles taps.
- Aucun changement produit, backend, navigation ou rendu visuel.
- Validation locale V0.150 : **162/162 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source sur **262 fichiers**.

## V0.149 — soumissions foyer single-flight
- Création/jonction du foyer, invitation, export de données et mutations membres légers protégés avant rerender.
- Les états UI existants restent inchangés ; aucun changement produit/backend.
- Validation locale V0.149 : **161/161 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source sur **261 fichiers**.

## V0.148 — actions sensibles single-flight
- Achat, démarrage d’essai et restauration protégés par un verrou synchrone avant tout `await`.
- Suppression de compte protégée par un verrou synchrone avant l’appel serveur.
- Les états UI `busy`/`disabled` existants sont conservés ; aucun changement visuel ou métier.
- Validation locale V0.148 : **160/160 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source sur **260 fichiers**.

## V0.147 — sauvegarde des rappels single-flight

- Le bouton de sauvegarde des notifications ne peut plus lancer deux programmations concurrentes.
- Verrou synchrone `useRef` + état `saving` pour couvrir les taps quasi simultanés.
- Le bouton est temporairement désactivé et expose `busy` aux lecteurs d’écran.
- `notifications.saving` est localisé en EN/FR/ES/HE.
- Validation locale V0.147 : **159/159 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **631 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.146 — saisie heure/date réellement cross-platform

- `numbers-and-punctuation` (iOS seulement) est supprimé des champs heure/date.
- Heure : clavier numérique commun + format automatique `HH:MM` + longueur native 5.
- Date d’expiration : clavier numérique commun + format automatique `YYYY-MM-DD` + longueur native 10.
- Les validateurs métier existants restent inchangés.
- Validation locale V0.146 : **158/158 régressions**, **17/17 gates EAS**, **83 TS/TSX**, **630 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.145 — cible tactile du favori renforcée

- Aucun changement produit ni visuel.
- Le cœur favori conserve sa taille visuelle 34×34 mais reçoit `hitSlop={5}` : cible tactile effective 44×44.
- Le libellé accessible localisé et l’état `selected` restent inchangés.
- Validation locale V0.145 : **155/155 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **630 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.144 — échec de programmation des rappels géré proprement

- Aucun changement produit ni visuel.
- L’enregistrement des préférences et la programmation native des rappels sont maintenant protégés par `try/catch`.
- Une défaillance native/stockage ne remonte plus comme promesse non gérée : elle devient une erreur utilisateur localisée et assertive.
- `notifications.scheduleError` est traduit en EN/FR/ES/HE.
- Validation locale V0.144 : **154/154 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **630 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.143 — couverture complète des erreurs dynamiques accessibles

- Aucun changement produit ni visuel.
- 7 erreurs dynamiques auparavant seulement visuelles deviennent `alert` + `accessibilityLiveRegion="assertive"`.
- Sont couverts : photo de profil, responsabilité/export des courses, chargement/import photo/import URL des recettes et proposition planning.
- Le contrat global passe à 15 alertes assertives ; les 5 statuts/succès restent `polite`.
- Validation locale V0.143 : **153/153 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **629 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.142 — chargements autonomes accessibles

- Aucun changement produit ni visuel.
- 14 `ActivityIndicator` autonomes exposent désormais un rôle `progressbar` et le libellé localisé `common.loading`.
- Les spinners déjà intégrés dans des boutons possédant `accessibilityState.busy` restent inchangés pour éviter une double annonce.
- `common.loading` est présent en EN/FR/ES/HE.
- Validation locale V0.142 : **152/152 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **629 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.141 — saisie robuste des identifiants sensibles

- Aucun changement produit ni visuel.
- Le champ e-mail désactive explicitement l’autocorrection et la capitalisation automatique.
- Les champs mot de passe (connexion, inscription, récupération et confirmation) désactivent autocorrection et capitalisation.
- Le code foyer reste volontairement en majuscules, est normalisé explicitement côté client et n’utilise plus l’autocorrection.
- Un garde de régression et l’audit projet verrouillent ces invariants.
- Validation locale V0.141 : **151/151 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **628 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.140 — annonces accessibles des messages dynamiques

- Aucun changement produit ni visuel.
- 8 sorties d’erreur dynamiques utilisent `accessibilityRole="alert"` et `accessibilityLiveRegion="assertive"`.
- 5 sorties mixtes de succès/statut utilisent `accessibilityLiveRegion="polite"`.
- Les textes statiques restent hors des live regions pour éviter les annonces parasites.
- Validation locale V0.140 : **150/150 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **628 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.


## V0.139 — états busy accessibles des actions asynchrones

- Aucun changement produit ni visuel.
- Les 10 commandes qui restent visibles pendant une opération asynchrone exposent désormais `accessibilityState.busy` quand leur propre tâche est en cours.
- Sont couverts : invitation foyer, ajout course, export PDF, export/suppression des données, sauvegarde planning/recette, achat/restauration et présence.
- Les états `disabled` et `selected` existants sont conservés.
- Validation locale V0.139 : **149/149 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **628 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.


## V0.138 — libellé accessible du Switch notifications

- Aucun changement produit ni visuel.
- Le `Switch` des réglages de notifications expose désormais son intitulé via `accessibilityLabel` et son explication via `accessibilityHint`.
- La sémantique native du `Switch` est conservée : aucun faux rôle `button` n’est ajouté.
- Un garde de régression empêche le retour d’un `Switch` anonyme pour VoiceOver/TalkBack.
- Validation locale V0.138 : **148/148 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **628 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.


## V0.137 — disclosures accessibles complets

- Aucun changement visuel ni produit.
- Quatre panneaux dépliables supplémentaires exposent maintenant `accessibilityState.expanded` : courses cochées, outils de courses, réglages du foyer et activité du foyer.
- Le contrat total passe à 7 disclosures explicitement classifiés.
- Validation locale V0.137 : **147/147 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **628 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.136 — états cochés et favoris accessibles

- Aucun changement visuel ni produit.
- Les lignes de courses sont maintenant annoncées comme des `checkbox` avec `accessibilityState.checked`.
- Les deux actions favori recette annoncent leur état `selected`.
- Un garde de régression verrouille ces états binaires.
- Validation locale V0.136 : **146/146 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **628 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.135 — noms accessibles des boutons icône

- Aucun changement visuel ni produit.
- Les boutons purement symboliques ont maintenant un nom accessible explicite : favori recette, semaine précédente/suivante, ajout course, diminution/augmentation des portions.
- Les libellés sont localisés FR/EN/ES/HE.
- Un garde de régression verrouille ces six contrôles.
- Validation locale V0.135 : **145/145 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **628 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.134 — autofill auth explicite

- Les champs d’authentification exposent maintenant les hints `autoComplete` React Native multiplateformes.
- E-mail : `email`; connexion : `current-password`; inscription et récupération : `new-password`.
- Aucun `textContentType` doublon n’est ajouté : `autoComplete` reste la source unique conformément au contrat React Native courant.
- Un test de régression bloque tout retour à des champs d’authentification sans hint d’autofill.
- Validation locale V0.134 : **144/144 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **623 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.133 — états expanded des panneaux dépliables
- Aucun changement produit ni visuel.
- Les 3 vrais boutons de disclosure annoncent désormais `accessibilityState.expanded` : ingrédients du mode cuisine, filtres avancés des recettes et détails du repas.
- Les boutons ouvrant une modale ne sont pas faussement marqués comme développables.
- Validation locale V0.133 : **143/143 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **623 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.132 — libellés accessibles des champs de saisie
- Aucun changement produit ni visuel.
- Les 24 `TextInput` exposent désormais un `accessibilityLabel` stable à VoiceOver/TalkBack.
- Le champ e-mail d’authentification est désormais localisé via `auth.email` en FR/EN/ES/HE au lieu d’un libellé anglais codé en dur.
- Garde permanent : tout nouveau champ de saisie doit être explicitement labellisé.
- Validation locale V0.132 : **142/142 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **623 clés EN** avec parité, audits continuité/hygiène/backend/release PASS.

## V0.131 — états selected accessibles
- Aucun changement produit ni visuel.
- Les 23 contrôles de sélection ajoutés à ce checkpoint annoncent désormais `accessibilityState.selected` à VoiceOver/TalkBack.
- Les cartes qui servent seulement à naviguer restent de simples boutons.
- Validation locale V0.131 : **141/141 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.

## V0.130 — état disabled accessible
- Aucun changement produit ni visuel.
- Les 30 `Pressable` désactivables exposent désormais leur état via `accessibilityState.disabled`.
- Garde permanent : toute commande tactile avec `disabled={...}` doit annoncer le même état aux lecteurs d’écran.
- Validation locale V0.130 : **140/140 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.

## V0.129 — sémantique native de tous les Pressable
- Aucun changement produit ni visuel.
- Les 111 `Pressable` interactifs qui n’avaient pas encore de rôle exposent désormais `accessibilityRole="button"`.
- Le backdrop invisible du menu d’actions est explicitement `accessible={false}`.
- Les 117 `Pressable` du runtime sont désormais soit sémantiques, soit intentionnellement exclus de l’arbre d’accessibilité.
- Validation locale V0.129 : **139/139 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.

## V0.128 — sémantique d’accessibilité des textes cliquables

- Aucun changement visuel ni produit.
- Les commandes historiques rendues comme `<Text onPress>` exposent maintenant explicitement `accessibilityRole="button"`.
- Sont couverts notamment Fermer, Créer/Rejoindre, Connexion/Inscription, Mot de passe oublié et Démo.
- Un audit permanent interdit l’ajout futur d’un texte cliquable sans sémantique de bouton.
- Validation locale V0.128 : **138/138 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.


## V0.127 — rafraîchissement de la langue système Android

- Aucun changement produit : correction de cohérence locale native.
- `LocaleContext` relit désormais locale, calendrier, fuseau, horloge 24 h et système de mesure lorsque l’app revient au premier plan.
- Corrige le cas Android où l’utilisateur modifie la langue de l’app/téléphone dans Réglages pendant que Notre Table reste ouverte en arrière-plan.
- L’écoute `AppState` est nettoyée au démontage et verrouillée par audit/régression.
- Validation locale V0.127 : **137/137 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.


## V0.126 — zones sûres Android/iOS modernes

- Aucun changement produit : correction de compatibilité native/edge-to-edge.
- Remplacement du `SafeAreaView` legacy de React Native par `react-native-safe-area-context ~5.7.0`, version recommandée par Expo SDK 57.
- `SafeAreaProvider` unique à la racine ; tous les écrans existants utilisent désormais le `SafeAreaView` multi-plateforme.
- Les audits empêchent le retour d’un import `SafeAreaView` depuis `react-native`.
- L’installation réelle de la nouvelle dépendance reste à prouver par `npm ci` / `expo install --check` dès que le registre npm est accessible.
- Validation locale V0.126 : **136/136 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.


## V0.125 — portée iPad explicitement suivie

- Aucun changement produit ni désactivation arbitraire de l’iPad.
- `supportsTablet: true` reste inchangé, mais le release doctor marque désormais la validation iPad physique comme étape manuelle avant Production.
- Preview et la bêta téléphone restent utilisables ; la promesse iPad ne peut plus rester invisible dans la checklist de release.
- Validation locale V0.125 : **135/135 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.

## V0.124 — export compliance iOS explicite

- Aucun changement produit : préparation App Store uniquement.
- `ios.config.usesNonExemptEncryption` est explicitement `false` pour le runtime mobile actuel, qui n’embarque pas de chiffrement applicatif non exempté.
- Le release doctor et l’audit release verrouillent cette déclaration afin qu’elle ne disparaisse pas silencieusement avant soumission.
- Validation locale V0.124 : **134/134 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.

## V0.123 — permission iOS minimale pour les rappels

- Aucun changement produit : principe de minimisation des permissions natives.
- Sur iOS, Notre Table demande uniquement l’autorisation d’afficher les alertes nécessaires aux rappels locaux.
- `allowSound` et `allowBadge` sont explicitement `false`, cohérents avec le handler silencieux et sans badge déjà en place.
- Android conserve son flux V0.121/V0.122.
- Validation locale V0.123 : **133/133 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.

## V0.122 — statut de permission notifications iOS

- Aucun changement produit : correction de robustesse du même flux de rappels locaux.
- Sur iOS, la décision de programmer un rappel lit désormais `ios.status` comme recommandé par Expo.
- `AUTHORIZED`, `PROVISIONAL` et `EPHEMERAL` sont considérés comme des autorisations valides ; Android continue d’utiliser `permission.granted`.
- Le code ne confond plus le modèle de permission iOS plus fin avec le booléen générique multi-plateforme.
- Validation locale V0.122 : **132/132 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS.

## V0.121 — canal Android des rappels locaux

- Aucun changement produit : correction de fiabilité Android des rappels déjà existants.
- Un canal Android stable `notre-table-reminders-v1` est créé avant la demande d’autorisation de notifications.
- Le canal est silencieux et son nom est localisé FR/EN/ES/HE.
- Les rappels quotidien et hebdomadaire utilisent explicitement ce canal sur Android.
- Les permissions Android d’alarme exacte restent explicitement bloquées ; SDK 57 utilise son fallback inexact lorsque nécessaire.
- Cette séquence évite le cas Android 13+ où le prompt de permission ne peut pas apparaître avant la création d’un canal.
- Validation locale V0.121 : **131/131 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS ; hygiène source sur **232 fichiers**.

## V0.120 — thème système Android correctement câblé

- Aucun changement produit.
- `userInterfaceStyle: automatic` est désormais accompagné de `expo-system-ui ~57.0.4` et du plugin CNG `expo-system-ui`.
- Le preflight et l’audit projet verrouillent cette exigence.
- La vraie installation reste volontairement non revendiquée tant que npm n’est pas accessible.
- Validation locale V0.120 : **128/128 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS ; hygiène source sur **231 fichiers** ; manifest de provenance sur **230 fichiers**.

## V0.119 — privacy native et assets Production fail-closed

- Aucun changement produit.
- Android bloque explicitement `RECORD_AUDIO`; l’app ne possède aucune fonction audio.
- Le gate Production exige désormais de vrais assets de marque locaux/versionnés (icône + adaptive icon Android).
- Le release doctor expose ces deux vérifications ; Preview/local restent utilisables sans inventer d’assets.
- Validation locale V0.119 : **127/127 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS ; manifest de provenance sur **229 fichiers**.

## V0.118 — hygiène du checkpoint source

- Aucun changement produit : durcissement local de la release uniquement.
- Nouveau `npm run source:hygiene:audit`, inclus dans `npm run verify`.
- Il refuse l’inclusion accidentelle de vrais `.env`, credentials, clés privées, certificats/signatures mobiles, archives et artefacts temporaires dans le checkpoint source.
- Il vérifie également les règles critiques de `.gitignore` et recherche plusieurs formats de secrets à haut risque dans les fichiers versionnés.
- Le manifest SHA-256 couvre désormais aussi tout le runtime mobile (`App.tsx`, `index.ts`, `src/`, `languages/`).
- Validation locale V0.118 : **125/125 régressions**, **16/16 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS ; manifest de provenance sur **228 fichiers**.

## V0.117 — continuité de checkpoint vérifiée

- Aucun changement produit : durcissement de la reprise et de la release uniquement.
- Nouveau `npm run continuity:audit` exécuté par `npm run verify`.
- Il exige que `package.json`, `app.json`, le titre et la section courante du README, `docs/PROJECT_STATE.md`, `docs/VERIFICATION.md` et le fichier d’audit courant annoncent tous le même checkpoint.
- Une version ne peut plus être considérée propre si sa documentation de reprise reste silencieusement sur un checkpoint antérieur.

## V0.116 — preuve bêta deux appareils

- Aucun changement produit.
- Le protocole `docs/BETA_ACCEPTANCE.md` impose 16 scénarios sur au moins deux appareils physiques.
- `beta:acceptance:audit` refuse l’acceptation sans version/build/source, preuves par scénario et verdict 16/16 `pass`.
- L’exemple reste volontairement `pending` et ne constitue jamais une preuve réelle.

## V0.115 — release doctor / blocages externes observables

- Aucun changement produit.
- `release:doctor` diagnostique la validation installée/CI, Supabase, EAS Preview et Production sans imprimer les secrets.
- Le rapport machine-readable est écrit dans `.validation/release-doctor.json`.

## V0.114 — reproductibilité CI et provenance

- Aucun changement produit.
- Node/npm release alignés, GitHub Actions épinglées sur SHA immuables, permissions CI minimales, `.validation/` ignoré.
- `release:evidence` produit un manifest SHA-256 du contrat de release.

## V0.113 — preuve distante du parcours membre léger

- Aucun nouveau périmètre produit : cette version durcit uniquement la release lane.
- Le smoke backend doit maintenant passer par la vraie Edge Function publique `light-response`, pas seulement par ses RPC internes.
- Il vérifie la page web et ses en-têtes de sécurité, le contexte public sans identifiants sensibles, la soumission, l’anti-rejeu et la sérialisation de « Je prends les choses en main ».
- La documentation distante est alignée sur **15/15 RPC client** et exige le déploiement de `light-response` avant le smoke réel.

## V0.112 — organisateur natif pour les membres légers

- reprise additive depuis V0.111 ; aucun flux historique n’est reconstruit ;
- entrée **« Demander à la famille »** depuis un repas du Planning ;
- ajout / modification / désactivation / réactivation des membres légers, sans suppression de leur historique ;
- sélection native des seules options « Envie ? » proposées ce jour-là ;
- création/mise à jour de la question et avertissement explicite si une modification doit réinitialiser des réponses existantes ;
- partage manuel d’un lien personnel via la feuille de partage du téléphone ; aucun SMS/WhatsApp automatisé ou payant ajouté ;
- synthèse admin + rafraîchissement Realtime des réponses ;
- migration `202609150013_light_member_management.sql` et RPC `update_light_member` ;
- validation locale : **101/101** régressions, **16/16** gate EAS, **82** TS/TSX transpilés, 0 erreur ; audits backend/release PASS.

**Non prouvé localement :** migrations 012/013 réellement appliquées, Edge Function déployée, vrai parcours multi-téléphones, vrai `tsc`, exports Expo, RevenueCat/Stores et build EAS. L’onboarding initial prénom+téléphone reste volontairement séparé tant que son UX exacte n’est pas figée.

## V0.111 — membres légers sans installation : fondation sécurisée

- reprise additive exacte depuis V0.110 ; aucune fonction historique n’est reconstruite ;
- migration `202609150012_light_members_response_foundation.sql` : membres légers, questions par repas, options d’envie choisies par l’organisateur, réponses, tokens one-shot et synthèse admin ;
- token 256 bits, SHA-256 seulement en base, expiration + anti-rejeu, téléphone admin-only ;
- prise en main sérialisée : le premier clic gagne et les autres membres voient seulement qui prend les choses en main ;
- Edge Function publique `light-response` sans JWT utilisateur, avec accès backend via RPC server-only, lien `#token`, `no-referrer`, `no-store` et CSP ;
- page ultralégère FR/EN/ES/HE : présence en 1 clic, envie+présence en 2 clics, « Surprends-moi » et « Je prends les choses en main » en 1 clic ;
- validation locale : **101/101** régressions, **16/16** gate EAS, **80** TS/TSX transpilés, 0 erreur ; audits backend/release PASS.

**Non prouvé localement :** application réelle de la migration 012, déploiement réel de l’Edge Function, vrai `tsc`, exports Expo, RevenueCat/Stores, EAS et test multi-appareils. L’UX native précise d’ajout des membres au premier setup reste la prochaine étape et n’est pas inventée dans ce checkpoint.

## V0.110 — dernier trou RLS sur les idées familiales

- les idées/votes de repas utilisent le garde partagé `householdWriteGuard` ;
- les suppressions à zéro ligne vérifient `can_write_household` et remontent `FAMILY_PLAN_REQUIRED` ;
- validation V0.110 : **93/93** régressions, **16/16** gate EAS, **79** TS/TSX transpilés sans erreur.

## V0.109 — refus RLS silencieux rendus actionnables

- aucune nouvelle fonction produit ; durcissement P1 de l’enforcement Premium ;
- ajout du garde client `can_write_household` pour distinguer un vrai refus d’écriture d’une ligne déjà absente ou d’un conflit ;
- les UPDATE/DELETE directs vérifient désormais les mutations à zéro ligne au lieu de les considérer comme des succès ;
- planning, courses, garde-manger, présences, responsabilité des courses et réactions recettes remontent `FAMILY_PLAN_REQUIRED` vers un paywall/action Famille ;
- la file courses hors-ligne ne peut plus boucler silencieusement sur un refus Premium après reconnexion ;
- `can_write_household(uuid)` devient le 10e RPC client officiel et est exigé par `verify_backend.sql`, `assert_backend.sql` et le smoke réel ;
- validation locale : **92/92** régressions, **16/16** gate EAS, **79** TS/TSX transpilés, 0 erreur ; backend **18 tables / 10 RPC / 6 Realtime** ; audits backend/release PASS.

**Non prouvé localement :** déploiement Supabase réel, RevenueCat/Stores réels, `npm ci`/vrai `tsc`, exports Expo, build EAS et test multi-appareils.

## V0.108 — enforcement Premium serveur et downgrade collaboratif sûr

- migrations additives `202609140010_server_premium_enforcement.sql` et `202609140011_family_collaboration_write_guard.sql` ;
- le mode d’enforcement Premium est stocké uniquement dans Supabase (`app_release_settings`) et n’est ni lisible ni modifiable par le mobile ;
- quand l’enforcement est actif, invitations, imports/copie/idéation Famille et limites Free sont validés côté serveur ;
- après expiration Famille, l’historique partagé reste lisible, les membres non-admin passent en lecture seule et l’administrateur conserve les écritures du produit Free ;
- la réactivation Famille restaure immédiatement la collaboration des membres ;
- les refus serveur `FAMILY_PLAN_REQUIRED`, `FREE_RECIPE_LIMIT` et `HOUSEHOLD_MEMBER_LIMIT` sont transformés en messages/paywall localisés au lieu d’exposer l’erreur brute ;
- le refresh d’accès est protégé contre les réponses périmées lors d’un changement rapide de foyer ;
- le smoke réel doit prouver downgrade → membre refusé → admin Free autorisé → réactivation → membre réautorisé et peut exiger `EXPECT_PREMIUM_ENFORCEMENT=true` sur un backend de staging production-like ;
- validation locale : **87/87** régressions, **16/16** gate EAS, **78** TS/TSX transpilés, 0 erreur ; audits backend/release PASS.

**Non prouvé localement :** déploiement réel des migrations 010/011, valeur distante `premium_enforcement=true`, vrai RevenueCat, `npm ci`/`tsc`, exports Expo, build EAS et test deux appareils.

## V0.103 — abonnement Famille réellement porté par le foyer

- ajout de la migration `202609140009_household_subscription_access.sql` et de la table RLS `household_access` ;
- un paiement RevenueCat reste identifié par l'UUID Auth Supabase du payeur, mais l'accès effectif `family` est désormais une vérité serveur du foyer entier ;
- les membres du même foyer peuvent lire ce statut, un foyer extérieur ne le voit pas et aucun client mobile ne peut l'écrire ;
- nouvelle Edge Function `sync-household-access` : elle vérifie RevenueCat côté serveur puis synchronise le foyer, sans exposer la clé RevenueCat au mobile ;
- une panne temporaire RevenueCat ne rétrograde plus artificiellement un foyer déjà vérifié : la dernière vérité serveur reste utilisée jusqu'à son échéance connue ;
- si le payeur supprime son compte dans un foyer partagé, son identité est détachée mais la période déjà vérifiée reste valable uniquement jusqu'à son expiration ;
- Production continue de refuser le cache local comme preuve d'abonnement ;
- le gate EAS exige désormais aussi le miroir d'entitlement au niveau du foyer avant qu'une future intégration RevenueCat complète puisse débloquer Production ;
- smoke réel étendu : héritage Premium par un autre membre, isolation inter-foyers, écriture mobile interdite et suppression du payeur ;
- `80/80` régressions locales et `16/16` tests du gate EAS passent ;
- le SDK RevenueCat réel reste volontairement absent : aucune build Production n'est revendiquée tant que npm/RevenueCat/Stores/EAS réels ne sont pas connectés.


## V0.102 — nettoyage du harness RevenueCat et checkpoint de confiance

- aucune fonction produit ajoutée ; correction P0/P1 de l'infrastructure de validation ;
- suppression d'un faux `src/services/revenuecat.ts` et de la fausse dépendance `react-native-purchases` laissés par un test interrompu ;
- les tests du gate lèvent désormais une exception au lieu de terminer brutalement le processus, afin que les blocs `finally` restaurent toujours les fixtures ;
- vérification finale byte-for-byte de `package.json` et de l'existence/contenu de l'adaptateur RevenueCat après la suite de tests ;
- audits release/projet refusent désormais tout adaptateur RevenueCat orphelin ou toute dépendance RevenueCat sans adaptateur ;
- V0.102 remplace V0.99–V0.101 comme base de travail propre.


## V0.101 — confirmation email et récupération de mot de passe natives

- aucune fonction métier ajoutée ; P1 d'authentification pré-lancement ;
- inscription email redirigée vers le schéma natif Notre Table ;
- ajout du parcours « mot de passe oublié » avec réponse non révélatrice sur l'existence du compte ;
- consommation explicite des retours Supabase par tokens implicites, code PKCE ou token hash ;
- écran natif de choix du nouveau mot de passe via `updateUser` ;
- la release lane exige désormais la configuration `notretable://**`, un test réel confirmation/récupération et un SMTP de production avant lancement public.


## V0.100 — preuve de cycle d’identité RevenueCat de bout en bout

- aucune nouvelle fonction produit ; durcissement P0/P1 du gate Production ;
- le futur adaptateur doit exposer une commutation utilisateur identifiée (`syncRevenueCatUser`) et un nettoyage spécifique après suppression (`clearRevenueCatIdentityAfterDeletion`) ;
- le gate exige que les changements de session Supabase appellent réellement la commutation RevenueCat ;
- le chemin de suppression permanente doit réellement appeler le nettoyage d'identité SDK ;
- CustomerInfo doit piloter l'accès et les Offerings localisées doivent être transmises aux trois paywalls ;
- jusqu'à ce que ces preuves existent avec le vrai SDK, Production reste volontairement bloquée.


## V0.99 — abonnement Production lié à une identité authentifiée

- aucune nouvelle fonction produit ; correction P0/P1 d'autorisation et de preuve de billing ;
- Production ignore désormais tout ancien cache local d'essai/Famille et démarre `free` tant que RevenueCat n'a pas prouvé l'entitlement ;
- le gate RevenueCat exige `logIn` pour le changement de compte identifié et `logOut` pour le chemin de suppression définitive ;
- un adaptateur RevenueCat, même complet en apparence, ne suffit plus : CustomerInfo doit piloter l'accès et les Offerings localisées doivent atteindre tous les paywalls ;
- la build Production reste donc volontairement bloquée tant que ce câblage réel n'est pas présent et validé avec le SDK installé.


## V0.98 — appels externes bornés

- aucune nouvelle fonction produit ; correction P1 de robustesse réseau ;
- l'import d'une recette par URL utilise un timeout de 15 s ;
- l'OCR photo utilise un timeout de 20 s ;
- l'effacement RevenueCat côté Edge Function utilise un timeout serveur de 10 s avant toute mutation locale destructive ;
- un service externe qui ne répond plus ne peut plus laisser indéfiniment l'interface d'import en attente ;
- aucun timeout brutal n'est ajouté au client de suppression de compte, afin d'éviter de présenter comme échouée une suppression serveur qui pourrait déjà être engagée.


## V0.97 — OCR photo derrière une seule frontière de configuration sécurisée

- aucune nouvelle fonction produit ; correction P0 confidentialité/configuration ;
- `runtimeConfig` validait déjà l'endpoint OCR en HTTPS, mais l'import photo relisait directement `process.env` et contournait cette validation ;
- l'import photo utilise désormais uniquement `runtimeConfig.recipeOcrEndpoint` ;
- un endpoint OCR non HTTPS ou invalide est traité comme non configuré et aucune photo n'est envoyée ;
- audit global : aucun module runtime ne peut lire directement une variable `EXPO_PUBLIC_*` en dehors de `runtimeConfig` ;
- tests ajoutés pour endpoint OCR HTTPS/insecure et absence de contournement de configuration.


## V0.96 — pas de notifications fantômes dans la première bêta

- aucune nouvelle fonction produit ; correction P1 de sincérité/qualité de lancement ;
- les deux préférences de push collaboratif (changement de repas, courses en temps réel) n'avaient aucun token push ni transport serveur réel ;
- elles sont désormais explicitement désactivées dans la première bêta au lieu de laisser croire qu'elles fonctionnent ;
- les anciennes valeurs locales sont normalisées à `false` ;
- les rappels locaux dîner/week-end restent disponibles et fonctionnels sur le téléphone ;
- les textes multilingues ne promettent plus un backend push « plus tard » comme si la fonction était déjà activable.


## V0.95 — suppression de compte alignée avec le billing Store

- aucune nouvelle fonction métier ; P0/P1 conformité abonnement et effacement de données ;
- l'écran de suppression avertit explicitement que supprimer Notre Table n'annule pas l'abonnement App Store/Google Play ;
- accès direct à la gestion des abonnements Apple ou Google depuis la confirmation de suppression ;
- l'Edge Function peut supprimer le profil client RevenueCat via son API serveur avant les mutations destructives locales ;
- la clé secrète RevenueCat reste exclusivement dans les secrets de la fonction Edge ;
- si l'effacement RevenueCat est activé mais mal configuré ou échoue, la suppression locale s'arrête avant de détruire le compte ;
- RevenueCat 404 est traité comme succès idempotent « déjà supprimé » ;
- le smoke réel peut exiger cette preuve avec `EXPECT_REVENUECAT_DELETION=true` ;
- contrat d'identité : l'App User ID RevenueCat devra être l'UUID Auth Supabase.


## V0.94 — paywall Production strictement piloté par le Store

- aucune nouvelle fonction produit ; durcissement P1 de monétisation pré-lancement ;
- Preview/développement peuvent encore afficher les prix de référence business en EUR ;
- Production ne peut afficher que les prix localisés réellement fournis par une Offering RevenueCat/Store ;
- sans packages Store localisés, le paywall Production se désactive au lieu de retomber sur 4,99 €/39,99 € ;
- achat et restauration Production passent uniquement par les callbacks du futur adaptateur RevenueCat réel ;
- le gate EAS exige désormais un adaptateur concret : configuration avec App User ID, Offerings, achat package, restauration, CustomerInfo et vérification d'entitlement ;
- un fichier adaptateur factice ne peut plus débloquer une build Production ;
- `RecipesScreen` accepte correctement l'absence du trial local en Production.


## V0.93 — suppression permanente de compte exécutable sans casser un foyer partagé

- aucune nouvelle fonction produit ; correction P0 de conformité et d’intégrité ;
- migration `202609140008_account_deletion_integrity.sql` ;
- la préparation de suppression est une RPC serveur uniquement (`service_role`), interdite au client ;
- le contenu créé par le compte est supprimé avant la suppression Auth ;
- si le compte est seul, son foyer est supprimé ; s’il reste des membres, le foyer survit et le membre restant le plus ancien devient administrateur seulement si nécessaire ;
- `households.created_by` devient nullable avec `ON DELETE SET NULL`, pour ne pas attribuer faussement le foyer à un autre compte ;
- une Edge Function `delete-account` authentifie le bearer JWT, supprime l’avatar privé, prépare les données puis supprime définitivement `auth.users` ;
- le smoke réel doit prouver les cas foyer partagé + foyer solitaire sur la fonction déployée.


## V0.89 — clé Supabase mobile fail-closed

- aucune nouvelle fonction métier ;
- la configuration publique Notre Table accepte désormais uniquement les clés modernes `sb_publishable_*` ;
- les anciennes clés API Supabase au format JWT sont refusées dans le bundle mobile, supprimant l'ambiguïté entre `anon` et `service_role` ;
- les clés `sb_secret_*` et toute référence explicite `service_role` restent bloquées ;
- le gate EAS, le runtime mobile et le smoke backend appliquent la même règle.


## Historique V0.88


## V0.88 — replay hors-ligne isolé pendant un changement de compte

- aucune nouvelle fonction métier ;
- la file Shopping restait déjà isolée par `foyer + semaine + utilisateur` ;
- un replay en cours vérifie désormais avant chaque mutation que la session appartient toujours au propriétaire de la file ;
- si le compte change ou se déconnecte, les opérations restantes restent en attente au lieu d'être exécutées sous la nouvelle session ;
- un test de régression verrouille cette propriété.


## Historique V0.87


## V0.87 — copie de semaine prouvée sous concurrence

- aucune nouvelle fonction métier ;
- `copy_previous_week` s'appuyait déjà sur l'UPSERT du slot cible, qui sérialise les appels concurrents sur la même ligne ;
- aucune migration SQL inutile n'a été ajoutée ;
- le smoke Supabase réel lance maintenant deux copies simultanées depuis deux membres du même foyer ;
- il exige un seul repas cible, exactement les deux participants attendus et exactement l'invité attendu.


## Historique V0.86


## V0.86 — concurrence placard et courses sérialisée

- aucune nouvelle fonction métier ;
- `upsert_pantry_item`, `add_recipe_to_shopping_list` et `rebuild_weekly_shopping_list` verrouillent désormais le foyer avant leurs mutations de fusion/génération ;
- deux appareils ne peuvent plus observer simultanément une absence puis créer des lignes divergentes ;
- nouvelle migration additive 007 ;
- le smoke Supabase réel exige désormais : un seul article placard fusionné avec quantité exacte, un seul résultat de reconstruction hebdomadaire et une seule ligne recette après deux ajouts concurrents.


## Historique V0.85

## V0.85 — code invitation usage unique sous concurrence

- aucune nouvelle fonction métier ;
- le SQL utilisait déjà `FOR UPDATE` lors de la consommation du code ;
- le smoke distant crée maintenant deux comptes supplémentaires qui tentent le même code en parallèle ;
- exactement un appel doit réussir, `used_by` doit désigner ce gagnant et un seul nouveau membre doit apparaître dans le foyer ;
- cette propriété P0 est désormais prouvée sur le backend réel au lieu d’être seulement lue dans le SQL.


## Historique V0.84

## V0.84 — invitations idempotentes sous vraie concurrence

- aucune nouvelle fonction métier ;
- `create_household_invitation` verrouille désormais la ligne foyer pendant la création d’un code ;
- deux appels simultanés pour le même foyer se sérialisent et renvoient le même code actif ;
- nouvelle migration additive 006 ;
- le smoke Supabase lance réellement deux RPC en parallèle et exige un seul enregistrement d’invitation actif.


## Historique V0.83

## V0.83 — sauvegarde repas atomique

- aucune nouvelle fonction métier ;
- `set_meal_slot` enregistre désormais dans une seule transaction le repas, le cuisinier, les participants et les invités ;
- les anciennes requêtes client séparées ont été supprimées ;
- une coupure ou une validation refusée ne peut plus laisser un repas partiellement mis à jour ;
- nouvelle migration additive 005 et signature RPC canonique mise à jour dans les preuves distantes ;
- le smoke réel vérifie le résultat complet et qu’un participant extérieur fait échouer la transaction sans modifier l’état précédent.


## Historique V0.82

## V0.82 — assertions Supabase distantes fail-closed

- aucune nouvelle fonction métier ;
- ajout de `supabase/assert_backend.sql`, complément exécutable de `verify_backend.sql` ;
- le script lève une exception si une table/RLS/policy, une publication Realtime, le bucket avatar, une signature/ACL RPC ou une migration attendue manque ;
- il refuse aussi tout overload RPC inattendu ;
- seul un backend conforme termine par `NOTRE_TABLE_BACKEND_ASSERTIONS_PASS` ;
- `backend:audit` exige désormais que chaque migration et chaque signature RPC restent présentes dans cette assertion.


## Historique V0.81

## V0.81 — preuve distante des signatures RPC

- aucune nouvelle fonction métier ;
- `verify_backend.sql` exige désormais les signatures exactes des 9 RPC du client, pas seulement leurs noms ;
- tout overload RPC historique inattendu est listé explicitement et doit produire zéro ligne ;
- l’historique des migrations affiche maintenant chaque version attendue avec un booléen `applied`, ce qui rend les absences visibles sans comparaison manuelle ;
- `backend:audit` verrouille les 9 signatures attendues.


## Historique V0.80

## V0.80 — EAS fail-closed par profil et backend

- aucune nouvelle fonction métier ;
- suppression du profil technique `base`, qui était lui-même lançable comme build EAS ;
- seuls `preview` et `production` restent des profils de build ;
- le hook pré-install refuse tout profil EAS inattendu, tout décalage profil/environnement et toute build Preview/Production sans Supabase public valide ;
- les clés privilégiées Supabase restent interdites côté client ;
- la build Production reste en plus bloquée tant que RevenueCat réel n’est pas intégré ;
- 7 scénarios automatisés verrouillent désormais ce gate.


## Historique V0.79

## V0.79 — CI fail-closed sans lockfile

- aucune nouvelle fonction métier ;
- la CI principale n’exécute plus jamais `npm install` : elle exige un `package-lock.json` commité puis utilise uniquement `npm ci` ;
- un workflow manuel séparé `Bootstrap npm lockfile` génère le premier lockfile sur runner réseau, le réinstalle avec `npm ci`, exécute la validation installée complète et publie le lockfile comme artifact à relire avant commit ;
- une CI verte ne peut donc plus masquer une installation non reproductible.


## Historique V0.78

## V0.78 — compatibilité Expo vérifiée sur runner installé

- aucune nouvelle fonction métier ;
- `validate:installed` exécute désormais `expo install --check` avant le typecheck et les exports ;
- GitHub Actions force `CI=1` afin qu’une incompatibilité de dépendances SDK échoue sans interaction ;
- la validation installée ne pourra donc plus être déclarée verte avec un graphe de dépendances non recommandé par Expo SDK 57.


## Historique V0.77

## V0.77 — historique migrations distant verrouillé

- aucune nouvelle fonction métier ;
- la vérification distante limite correctement les tables au schéma `public` ;
- chaque fichier de migration doit désormais apparaître dans la vérification de l’historique Supabase, automatiquement contrôlée par `backend:audit`.


## V0.76 — vérificateur Supabase distant corrigé

- aucune nouvelle fonction métier ;
- le contrôle des privilèges RPC ne traite plus `PUBLIC` comme un utilisateur ;
- l’ACL PostgreSQL est lue via `aclexplode` / `grantee = 0` ;
- le contrôle distant couvre désormais aussi policies RLS, Storage avatar, Realtime et migrations appliquées.


## V0.75 — CI/EAS sur le même runtime

- aucune nouvelle fonction métier ;
- Node 22.16.0 est fixé côté EAS et GitHub Actions ;
- `npm ci` devient automatique dès qu’un lockfile est présent ;
- le premier runner réseau peut produire le lockfile manquant et le conserver comme artifact ;
- les exports Expo iOS/Android sont également conservés comme preuves de validation installée.


## V0.74 — preuve backend complète avant connexion réelle

- aucune nouvelle fonction métier ;
- le smoke Supabase distant couvre maintenant les 9/9 RPC utilisées par le client ;
- Storage avatar est vérifié : écriture propriétaire, lecture membre du foyer, refus extérieur ;
- nettoyage des objets Storage ajouté ;
- garde destructive : le smoke refuse tout lancement sans cible `development|staging` et confirmation explicite ;
- `backend:audit` verrouille cette couverture.


## V0.73 — intégrité dernier admin / suppression foyer

- aucune nouvelle fonction métier ;
- correction additive du trigger dernier-admin : il protège un foyer actif sans bloquer la suppression complète du foyer et ses cascades ;
- nouvelle migration 004, reflétée dans le snapshot et couverte par `backend:audit` ;
- le nettoyage du smoke Supabase peut désormais supprimer proprement foyers puis comptes de test.


## V0.72 — migrations et snapshot verrouillés

- aucune nouvelle fonction métier ;
- l’audit backend vérifie maintenant automatiquement que chaque objet introduit par une migration ultérieure est bien reflété dans `schema.sql` ;
- une divergence migration/snapshot devient un échec de validation ;
- l’absence de lockfile npm est désormais affichée explicitement comme blocage de reproductibilité du build réel.


## V0.71 — smoke Supabase réel durci

- aucune nouvelle fonction métier ;
- le smoke backend vérifie maintenant les refus RLS inter-foyers en écriture (insert/update/delete), les frontières de rôle et la collaboration légitime ;
- le nettoyage supprime d’abord les foyers de test puis les comptes Auth afin de respecter la contrainte `created_by ... on delete restrict` ;
- une erreur de nettoyage fait désormais échouer le test au lieu d’être masquée ;
- la tentative de génération d’un lockfile npm a encore expiré faute d’accès registre : build installé/EAS toujours non revendiqué.


## V0.70 — P0 reconnexion → replay → état confirmé

- aucune nouvelle fonction métier ;
- retour de connectivité détecté via `expo-network` et replay automatique de la file Courses ;
- le premier état réseau joignable peut aussi vider une file persistée après redémarrage ;
- replay sérialisé pour empêcher qu’une intention locale récente soit effacée par une synchronisation concurrente ;
- les intentions encore en attente restent superposées aux données serveur jusqu’à confirmation ;
- l’interface n’affiche `synchronisé` que lorsque la file locale est réellement vide.

## V0.69 — bêta ouverte, production monétisation bloquée proprement

- aucune nouvelle fonction métier ;
- les builds EAS `preview` donnent automatiquement l'accès Famille aux testeurs : aucun faux paiement ne bloque la bêta ;
- la simulation locale d'essai est interdite en environnement `production` ;
- un hook officiel EAS `eas-build-pre-install` bloque volontairement toute build Production tant que `react-native-purchases` + l'adaptateur RevenueCat réel ne sont pas présents ;
- le parcours Preview reste donc testable immédiatement, tandis qu'une publication Store accidentelle avec une fausse monétisation devient impossible.


## V0.68 — invitations P0 durcies

- aucune nouvelle fonction métier ;
- un double tap sur « Inviter » ne peut plus lancer deux créations concurrentes ;
- tant qu'un code d'invitation valide et inutilisé existe, le RPC renvoie le même code au lieu d'en créer plusieurs ;
- génération des 6 caractères basée sur `pgcrypto/gen_random_bytes` ;
- collision vérifiée contre **tous** les anciens codes, pas seulement les invitations encore actives ;
- le code reste à usage unique et expire après 7 jours ;
- smoke test backend préparé pour idempotence, usage unique et rotation après utilisation.


## V0.67 — mutations Courses sans doublons

- aucune nouvelle fonction métier ;
- un article de courses ne peut plus lancer deux mutations check/uncheck simultanées sous un double tap ;
- l’ajout manuel bloque une seconde soumission tant que la première n’est pas terminée ;
- la file hors-ligne est désormais isolée par **foyer + semaine + utilisateur connecté** ;
- un changement de compte sur le même appareil ne peut donc pas rejouer une intention hors-ligne laissée par l’utilisateur précédent ;
- la compaction conserve toujours une seule intention finale par article ;
- garde-fous d’audit ajoutés pour empêcher le retour des doubles mutations ou d’une file hors-ligne non liée à l’identité.

Validation locale : 71 fichiers TS/TSX, 0 erreur de transpilation, 546 clés i18n, 46/46 régressions, backend/release audits PASS.

## V0.66 — Realtime sans abonnements fantômes

- aucune nouvelle fonction métier ;
- les canaux Planning sont maintenant nommés avec le foyer + la semaine affichée ;
- la présence est nommée avec le foyer + le jour courant ;
- les avis recette sont nommés avec foyer + recette et retirés proprement du client Supabase ;
- Présence, avis recette, activité du foyer et chargement profil ignorent les réponses arrivées après démontage/changement de contexte ;
- garde-fous d’audit ajoutés : tout écran collaboratif utilisant un channel doit le retirer au cleanup ;
- le socle V0.65 reste intact : session multi-appareils, lane EAS, mode démo interdit en production, smoke backend, dernier admin protégé et file offline idempotente.

Validation locale : 71 fichiers TS/TSX, 0 erreur de transpilation, 546 clés i18n, 46/46 régressions, backend/release audits PASS.

## V0.65 — voie de lancement et session sécurisée

- aucune nouvelle fonction métier ;
- les changements de compte invalident les anciennes requêtes foyer ; les refreshs de token du même utilisateur ne relancent pas inutilement le foyer ;
- déconnexion Supabase explicitement locale à l'appareil ;
- le mode démo est désactivé dans un build production et ne peut plus masquer une configuration backend absente ;
- `eas.json` prépare Preview et Production sans inventer d'identifiant de projet Expo ;
- workflow CI prêt pour un runner avec Internet : installation des dépendances, vrai typecheck, audits et exports Expo iOS/Android ;
- smoke test backend multi-comptes prêt pour invitation, collaboration, isolation RLS et dernier administrateur ;
- migration SQL empêchant un foyer actif de perdre son dernier admin ;
- file hors-ligne de courses compactée à une intention finale par article ;
- validation locale : 71 fichiers TS/TSX, 0 erreur de transpilation, 546 clés i18n, 46/46 régressions, backend/release audits PASS.

**Limite honnête :** ce conteneur n'a toujours pas accès au registre npm. Le vrai `tsc`, les exports Expo et le build signé restent donc à exécuter sur CI/EAS avant toute affirmation de build validé.




## V0.58 — réponses asynchrones périmées bloquées

- aucune nouvelle fonction métier ;
- Planning et Courses utilisent des tokens de requête monotones : une ancienne réponse réseau ne peut plus écraser l’état d’une semaine plus récente ;
- idées de repas, présence du jour et responsable de courses utilisent la même protection ;
- les requêtes en vol sont invalidées au démontage des écrans ;
- les callbacks Realtime bénéficient du même mécanisme car ils réutilisent les loaders protégés ;
- validation : 70 fichiers TS/TSX, 0 erreur de transpilation, 544 clés i18n, 38/38 régressions, contrat backend PASS.

## V0.57 — stockage local résilient

- aucune nouvelle fonction métier ;
- nouvelle frontière de stockage locale commune pour planning, courses, placard, présence, préférences, rappels et données démo ;
- JSON local corrompu ou ancien : fallback conservateur et suppression de la seule clé illisible, jamais de purge globale ;
- file hors-ligne des coches de courses validée avant replay ;
- préférences langue/mesure, thème et réactions recette nettoyées à la lecture ;
- audit renforcé : `src/services/**` ne peut plus contourner la couche de stockage ni parser directement le JSON persistant ;
- validation : 69 fichiers TS/TSX, 0 erreur de transpilation, 544 clés i18n, 34/34 régressions, contrat backend PASS.

## V0.55 — backend prêt à brancher proprement

- aucune nouvelle fonction métier ;
- configuration Supabase mobile durcie : valeurs partielles/factices refusées et clés privilégiées interdites côté `EXPO_PUBLIC_*` ;
- schéma courant figé en première migration versionnée pour éviter les modifications SQL improvisées ;
- nouveau `npm run backend:audit` : vérifie le contrat code ↔ tables/RLS/policies/RPC/Reatime/Storage ;
- nouveau `supabase/verify_backend.sql` : contrôle en lecture seule à exécuter après le premier déploiement réel ;
- discipline de migration documentée : toute évolution SQL future = nouvelle migration, jamais réécriture silencieuse d'une migration déjà appliquée ;
- audit backend statique : 17 tables client, 9 RPC et 6 tables Realtime vérifiées ;
- audit produit : 62 fichiers TS/TSX, 0 erreur de transpilation, 536 clés i18n ;
- régressions : 30/30, dont 4 nouvelles protections de configuration backend.


## V0.54 — validation technique avant nouvelles fonctions

- aucune nouvelle fonction métier ;
- matrice Expo SDK 57 recontrôlée sur la documentation officielle et dépendances patch alignées ;
- Expo passe à `~57.0.17` et React Native à `0.86.3`, cohérents avec le correctif SDK 57 actuel ;
- nouveau `npm run preflight` : Node, versions app/package et dépendances SDK critiques ;
- audit renforcé : un import externe non déclaré dans `package.json` fait désormais échouer le contrôle ;
- nouveau `npm run validate:installed` prêt pour le vrai typecheck + bundles Expo iOS/Android dès que les dépendances peuvent être installées ;
- nouvelle tentative réelle d'installation npm effectuée : runtime toujours sans DNS npm, donc aucun build natif/bundle complet n'est prétendu validé ;
- `npm run verify` : PASS, 61 fichiers TS/TSX, 0 erreur de transpilation, 536 clés i18n, 26/26 régressions.


## V0.53 — Foyer plus discret

- aucune nouvelle fonction métier : simplification uniquement ;
- la liste des membres n’affiche plus allergies/régimes/aliments détestés en permanence ; ces informations restent dans le profil et dans les alertes contextuelles de repas ;
- « Mon profil » reste accessible en un geste depuis la carte du foyer ;
- langue, apparence, rappels et confidentialité sont regroupés sous « Réglages », replié par défaut ;
- l’offre/abonnement devient une ligne de compte compacte au lieu d’une carte promotionnelle dominante ;
- l’activité du foyer reste repliée par défaut ;
- audit renforcé pour empêcher le retour d’une interface Foyer trop administrative.

## V0.52 — bibliothèque de recettes allégée

- aucune nouvelle fonction : simplification uniquement ;
- l’écran Recettes n’affiche plus le filtre « Toutes » en permanence : il apparaît comme remise à zéro seulement quand un filtre est actif ;
- les tags quittent les cartes de la liste principale et restent disponibles dans le détail et les filtres ;
- suppression du chevron décoratif sur chaque recette ;
- le menu d’ajout/import devient textuel et calme, sans emoji de plateforme ;
- dans le détail d’une recette, « Cuisiner » devient l’action principale ; favoris et ajout aux courses passent en actions secondaires ;
- la mémoire des goûts du foyer est déplacée après la recette, pour ne pas interrompre le parcours ingrédients → préparation ;
- audit renforcé pour empêcher le retour de ces éléments de surcharge.

Application mobile familiale collaborative de planification des repas.

**V0.67 :** phase pré-lancement. Le périmètre produit reste gelé ; les mutations Courses sont maintenant protégées contre les doubles taps et la file hors-ligne est isolée par utilisateur.

**Positionnement produit :** le foyer est l'unité principale. Chaque membre garde son identité, sa langue et ses préférences, tout en partageant planning, décisions de repas, recettes et courses.

## Cœur fonctionnel déjà construit
- onboarding mémorisé ;
- authentification et structure foyer ;
- création/rejoindre un foyer, rôles et invitations ;
- planning hebdomadaire : petit-déjeuner, déjeuner, dîner, snack ;
- cuisinier responsable, participants et nombre de portions par repas ;
- « Décider ensemble » : propositions de repas + votes familiaux ;
- restes reliés à un repas antérieur du foyer, sans double achat automatique ;
- préférences, allergies, régimes et alertes de conflit ;
- création manuelle de recettes ;
- import URL via données publiques Recipe/Schema.org avec revue humaine ;
- import photo/OCR avec fournisseur découplé et simulation en mode démo ;
- favoris, difficulté, recherche et filtres avancés ;
- Mode Cuisine pas à pas avec écran maintenu actif ;
- mémoire des goûts du foyer par recette : « À refaire / Ça me va / Pas pour moi », avec synthèse dans le planning ;
- liste de courses générée par semaine avec fusion, rayons et quantités ajustées aux portions ;
- cache hors-ligne et file de synchronisation pour les coches au supermarché ;
- présence du jour (« Qui est là aujourd’hui ? ») réglable repas par repas : petit-déjeuner, déjeuner, dîner et snack ;
- placard partagé avec quantité facultative et date limite facultative ; produits proches de leur date signalés « à utiliser bientôt » ;
- tableau « Aujourd’hui à table » pour agir immédiatement sur les repas du jour et la présence, sans transformer l’app en agenda administratif ;
- ajout manuel, partage texte et export PDF ;
- « Qui fait les courses ? » : responsabilité volontaire de la liste hebdomadaire, jamais assignée automatiquement ;
- rappels locaux dîner/week-end ;
- paywall Famille + essai 14 jours préparés, sans achat réel avant RevenueCat ;
- réutilisation de la semaine précédente ;
- mode démo pour tester la logique sans bloquer sur GitHub/Supabase.

## International dès la fondation
V0.26 conserve l’architecture internationale de V0.25 et ajoute une fondation visuelle :
- thème clair/sombre/automatique mémorisé par appareil ;
- palette centralisée avec couleurs adaptatives natives ;
- langues UI actuelles : français, anglais, espagnol, hébreu ;
- RTL/LTR ;
- dates, nombres, devises, 12/24 h, fuseau et premier jour de semaine via la locale membre ;
- métrique/impérial ;
- codes techniques neutres pour repas, difficultés, rayons, unités et préférences ;
- nom produit global invariant : **NOTRE TABLE** dans toutes les langues ;
- `source_language` conserve la langue originale des recettes ;
- `ingredient_key` rapproche le même ingrédient entre langues ;
- petit lexique original pour afficher les ingrédients connus dans la langue du membre ;
- `recipe_translations` prévu comme cache séparé : une traduction ne remplace jamais l'original ;
- notifications locales planifiées dans la langue du membre ;
- prix Store futurs fournis par Apple/Google via RevenueCat, pas par conversion FX artisanale.

Voir `docs/INTERNATIONAL_ARCHITECTURE.md`.

## Protection de la propriété intellectuelle
Le projet applique une règle stricte : **benchmark de problèmes et de patterns fonctionnels, jamais copie de l'expression d'un concurrent**.

Interdits dans le dépôt de production : code concurrent, recettes/catalogues concurrents, textes marketing, captures utilisées comme assets, illustrations, iconographie distinctive ou reproduction écran-par-écran.

- `docs/IP_GUARDRAILS.md` : règles permanentes ;
- `docs/ORIGINALITY_LOG.md` : journal daté problème → pattern générique → solution Notre Table indépendante ;
- `npm run audit` : échec si un nom de concurrent apparaît dans le runtime `src/`.

## Backend prévu
Supabase : PostgreSQL, Auth, Realtime, Storage et RLS. Le snapshot courant est dans `supabase/schema.sql` et la première migration versionnée dans `supabase/migrations/202609140001_initial_schema.sql`.

V0.25 ajoute notamment une table de cache `recipe_translations`, lisible seulement par les membres du foyer concerné. La génération future des traductions est prévue derrière un endpoint/service de confiance et ne modifie jamais les recettes originales.

**Important :** le SQL n'a pas encore été exécuté contre un projet Supabase de développement dans cette session. Il doit être migration-testé avant toute affirmation de validation backend réelle.

## Validation locale actuelle
Commande :

```bash
npm run audit
```

Dernier résultat V0.58 :
- 71 fichiers TypeScript/TSX transpilés ;
- 0 diagnostic de transpilation ;
- 546 clés i18n anglaises avec parité fr/es/he ;
- 0 nom de concurrent dans le runtime ;
- 0 alerte heuristique de texte UI français codé en dur ;
- 45/45 tests de régression réussis ;
- contrat backend statique : 17 tables, 9 RPC, 6 tables Realtime : PASS ;
- préflight environnement Expo SDK 57 : PASS.

Ce contrôle n'est **pas** un build Expo natif complet ni un test Supabase distant. L'installation npm a été retentée et le runtime n'a toujours pas de résolution DNS vers le registre npm. `tsc --showConfig` confirme donc que `expo/tsconfig.base` est indisponible tant que `node_modules` n'est pas installé. Le vrai typecheck et les exports JS Expo iOS/Android sont prêts derrière `npm run validate:installed`, à exécuter dès qu'un environnement avec accès npm est disponible.

## Documents projet
- `docs/PROJECT_STATE.md` — état cumulatif et règle « ne jamais recommencer une étape sans preuve » ;
- `docs/DECISIONS.md` — décisions techniques ;
- `docs/INTERNATIONAL_ARCHITECTURE.md` — architecture internationale ;
- `docs/IP_GUARDRAILS.md` — règles PI ;
- `docs/ORIGINALITY_LOG.md` — preuve de conception indépendante ;
- `docs/AUDIT_V031.md` — checkpoint technique V0.31.

- `docs/AUDIT_V032.md` — checkpoint technique V0.32.
- `docs/AUDIT_V033.md` — checkpoint placard partagé.
- `docs/AUDIT_V034.md` — checkpoint répartition de la charge cuisine.
- `docs/AUDIT_V035.md` — checkpoint historique présence/absences du foyer.
- `docs/AUDIT_V036.md` — correction produit : présence limitée à aujourd’hui.
- `docs/AUDIT_V037.md` — checkpoint « Aujourd’hui à table » et garde-fous de version.

- `docs/AUDIT_V039.md` — présence du jour affinée repas par repas, migration de schéma et régressions associées.

- `docs/AUDIT_V042.md` — mémoire des goûts du foyer, planning et portabilité des réactions.

- `docs/AUDIT_V043.md` — checkpoint de simplification et réduction de la charge visuelle.

- `docs/AUDIT_V044.md` — checkpoint « friction zéro » sur Planning, Recettes et Courses.
- `docs/AUDIT_V047.md` — cohérence visuelle, ordre quotidien des repas et garde-fous associés.
- `docs/AUDIT_V054.md` — validation environnement/dépendances SDK 57 et procédure de validation installée.
- `docs/AUDIT_V055.md` — préparation backend, migrations et contrat de sécurité.
- `docs/AUDIT_V057.md` — stockage local résilient et garde-fous de persistance.
- `docs/AUDIT_V058.md` — protection contre les réponses réseau/asynchrones périmées.
- `docs/BACKEND_READINESS.md` — procédure de branchement et validation Supabase réelle.
- `docs/RELEASE_LANE.md` — ordre P0 jusqu’à la bêta réelle.
- `docs/AUDIT_V065.md` — session, production lane et intégrité backend.


## V0.46 — personnalité visuelle sans nouvelle fonction
- Palette globale plus chaleureuse et plus distinctive, compatible clair/sombre.
- Navigation principale redessinée avec pictogrammes natifs sans dépendance externe, à la place des emoji de barre d’onglets.
- Écran Aujourd’hui plus éditorial : foyer en repère discret, hiérarchie typographique renforcée, carte du prochain repas plus premium.
- Accès Qui est là ? et Courses rendus plus calmes visuellement ; organiser la semaine devient un niveau secondaire encore plus discret.
- Aucun nouveau périmètre fonctionnel : cette version travaille uniquement le ressenti et la simplicité.


## V0.47 — cohérence visuelle et micro-frictions
- Aucun nouveau périmètre fonctionnel.
- Ordre des repas partagé et testable : petit-déjeuner, déjeuner, goûter/snack, dîner.
- Pictogrammes de repas originaux construits en React Native, sans bibliothèque ni asset tiers.
- Métadonnées quotidiennes sans emoji, localisées dans les 4 langues.
- En-tête commun pour Recettes, Courses et Foyer afin de réduire l’effet « écrans assemblés ».
- Présence du jour simplifiée et placeholder recette sans photo redessiné.
- Styles legacy du Planning nettoyés.


## V0.48 — premier contact et onboarding en un geste
- Aucun nouveau périmètre fonctionnel.
- Onboarding réduit de trois écrans/trois validations à un seul écran et un seul CTA.
- Nouveau motif géométrique original `TableMark`, construit uniquement avec des vues React Native ; aucune bibliothèque d’icônes ni asset tiers.
- Promesse produit recentrée sur trois bénéfices : aujourd’hui à table, une liste de courses commune, recettes + décision familiale.
- Écran de connexion et splash alignés sur la même identité visuelle.
- Écran création/rejoindre un foyer allégé : suppression de la carte pédagogique redondante.
- Garde-fou d’audit : l’onboarding ne doit pas redevenir un carrousel multi-étapes ni réintroduire des emoji décoratifs.


## V0.49 — 2026-09-14 — états vides et marque cohérente
- Aucune nouvelle fonction métier.
- Composant `EmptyState` partagé avec motif original `TableMark`, sans illustration ou asset tiers.
- Recettes distingue maintenant une bibliothèque réellement vide d’une recherche sans résultat ; le premier cas propose l’action d’ajout existante, le second invite simplement à ajuster la recherche.
- Courses, Placard et Activité affichent des états vides courts, utiles et non administratifs au lieu d’une phrase isolée.
- Le nom produit **Notre Table** n’est plus traduit en anglais, espagnol ou hébreu dans les textes qui font référence à la marque.
- Audit renforcé pour empêcher le retour d’une traduction du nom de marque et pour conserver les états vides partagés sur les écrans principaux.


## V0.51 — 2026-09-14 — courses centrées sur ce qu’il reste à acheter
- Aucun nouveau périmètre fonctionnel.
- Les articles non cochés deviennent la liste principale ; les articles déjà pris quittent immédiatement le flux actif.
- Les articles cochés restent accessibles dans une section « Déjà pris », repliée par défaut, et peuvent être décochés normalement.
- Quand tout est coché, l’écran confirme simplement que la liste est terminée au lieu de ressembler à une liste vide.
- Les outils secondaires (placard, responsable, partage, PDF, nettoyage) sont désormais placés **après** la liste active.
- Le bouton d’ajout est inactif tant que le champ est vide.
- Alignement RTL des lignes et cases à cocher corrigé.
- Garde-fous d’audit ajoutés pour empêcher le retour des articles cochés dans la liste principale ou des outils avant la liste.

## V0.56 — startup resilience
This checkpoint adds no product feature. It prevents blank screens and indefinite startup waits by adding bounded startup operations, localized recovery states, and a React error boundary. The audit now also transpiles the root application entry files instead of checking only `src/**`.


## V0.116 — CI reproductible et moindre privilège

- Aucun changement produit.
- Toolchain release déclarée : Node 22.16.x / npm 10.9.x, package manager npm 10.9.2.
- Preflight local exige Node 22.16.0 et, lorsqu’il est exécuté via npm, npm 10.9.2.
- GitHub Actions officiels épinglés sur des SHA immuables vérifiés, au lieu de tags mobiles `@v4`.
- Workflows limités à `contents: read` et checkout sans persistance du token GitHub.
- `.validation/` est exclu de Git pour empêcher de commiter les exports de preuve CI.

- CI provenance strengthened: `.validation/release-evidence.json` hashes the release contract, migrations, Edge Functions and lockfile for traceability.