# Audit V0.156 — « Avec ce que j’ai » et photos cumulatives

## Objectif
Ajouter la lecture du frigo/placard sans créer un nouvel onglet ni transformer Notre Table en inventaire complexe.

## Implémentation
- Entrée depuis Recettes/Cuisiner.
- Choix entre photo et stock du foyer déjà enregistré.
- Plusieurs photos successives peuvent être analysées dans une même session.
- Chaque photo enrichit le lot courant ; aucune photo suivante ne remplace les produits déjà détectés.
- Les doublons sont fusionnés par clé d’ingrédient afin d’éviter le bruit quand un même produit apparaît sur plusieurs vues.
- Tous les produits uniques restent dans le moteur de matching ; l’interface n’affiche qu’un résumé compact au-delà de 24 produits.
- Les résultats restent limités à trois idées maximum.
- Compteur de photos analysées visible pour rendre le comportement cumulatif explicite.

## Sécurité UX
Le produit ne prétend pas qu’une photo constitue un inventaire parfait. L’utilisateur peut ajouter autant de vues que nécessaire (porte, étagères, bacs, placard).

## Validation actuelle
- `source-hygiene-audit` : PASS avant formalisation du checkpoint.
- Contrôle statique ciblé : accumulation sans `slice` dans l’état interne, reset uniquement par action explicite « Changer ».
- Le vrai typecheck/exports Expo ne sont pas revendiqués localement tant que `node_modules` n’est pas installé dans cet environnement.

## Internationalisation de la reconnaissance photo
- Le client n’essaie pas d’embarquer un catalogue mondial figé dans l’application.
- Chaque analyse transmet seulement la langue d’affichage et la région comme contexte ; ce ne sont pas des limites de reconnaissance.
- Le contrat de vision accepte plusieurs couches complémentaires : vision, OCR, code-barres/GTIN, catalogue produit externe et mémoire de reconnaissance.
- Le résultat est ramené vers une clé d’ingrédient neutre vis-à-vis de la langue, avec quatre niveaux : produit exact, ingrédient, catégorie, inconnu.
- Un produit non connu n’est pas rejeté : son libellé original reste disponible et une clé stable peut être créée.
- Les résultats incertains portent `needsConfirmation`; l’interface n’affiche pas de score technique et ne demande une confirmation que lorsqu’elle est utile.
- Les photos d’une même session partagent un identifiant et un index ; le client fusionne aussi localement les résultats, donc une nouvelle photo ne peut pas effacer les précédentes.

## Parcours interactif — complément V0.156
- Écran d’entrée limité à trois chemins compréhensibles : photo, stock déjà mémorisé, saisie manuelle.
- Après une photo, Notre Table demande si l’organisateur veut compléter ; les ajouts manuels et photos suivantes enrichissent la même session.
- Un aliment incertain est affiché comme question courte Oui/Non et reste exclu des suggestions tant qu’il n’est pas confirmé.
- Le champ manuel est un panneau contextuel accessible (`expanded`) et non un formulaire permanent.
- Le flux ne montre plus les idées de recettes tant que le nombre de convives n’est pas connu.
- Le nombre est récupéré du dîner planifié lorsqu’il existe ; sinon l’organisateur choisit entre demander à la famille et indiquer le nombre lui-même.
- Le résumé familial reste un indice conversationnel tant qu’il ne prouve pas un total définitif ; Notre Table n’ajoute pas silencieusement l’organisateur ni les « peut-être ».
- Le contrat vision peut renvoyer `quantity`, `unit` et `quantityConfidence`; aucune quantité manquante n’est fabriquée côté client.
- Le moteur met les quantités de recette à l’échelle avec le nombre de convives et classe chaque besoin en absent / insuffisant / quantité à confirmer / suffisant.
- Contrôles d’accessibilité reclassifiés après ajout : 135 Pressable, 38 désactivables, 25 busy, 9 disclosures, 26 TextInput, 15 progress indicators.
- Vérification : audit projet PASS, hygiène source PASS, 167/167 régressions PASS, 86 TS/TSX transpillés sans erreur, 690 clés EN avec parité.

## LIA — la Confidente (complément V0.156)
- LIA est ajoutée comme surface globale au niveau `MainScreen`, au-dessus des quatre onglets ; elle n’est pas enfermée dans une page dédiée.
- Le premier panneau expose trois contextes (`cooking`, `table`, `idle`) et trois niveaux sociaux (`discreet`, `present`, `host`) avec pause immédiate.
- Le moteur pur `src/lib/lia.ts` formalise la proactivité : une question n’est posée que si la réponse manque réellement et peut changer une décision.
- La politesse conversationnelle est codée comme invariant : une voix humaine active bloque la parole de LIA ; le mode table exige un silence plus long qu’un appel direct ou que le mode cuisine.
- La mémoire LIA est structurée, confirmée, datable et limitée par visibilité (`organizer`, `member_private`, `household`).
- Un objectif nutritionnel privé ne peut donc pas être annoncé automatiquement à toute la table.
- Le moteur sait déjà représenter un cas proactif simple de restes : une portion disponible + une personne seule + faible confort en cuisine => suggestion de réchauffer le reste plutôt que créer un nouveau repas.
- Le contrat produit complet est figé dans `docs/LIA_CONFIDANTE_V0156.md` : nutrition, invités, prise en charge du repas, mode cuisine, chronos, mode table, interruptions, humour, anecdotes, notifications et services extérieurs.
- Contrôles d’accessibilité reclassifiés après ajout LIA : 139 Pressable, 38 désactivables, 25 busy, 27 sélections persistantes, 10 disclosures, 26 TextInput, 15 progress indicators.
- Vérification après ce lot : audit projet PASS, continuité PASS, hygiène source PASS, backend PASS, release PASS, 17/17 gates EAS, **170/170 régressions PASS**, 88 TS/TSX transpillés sans erreur et 709 clés EN avec parité.
- Limite maintenue : `node_modules` n’est pas installé dans cet environnement ; aucun vrai `tsc` ni export Expo installé n’est revendiqué.
