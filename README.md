# Notre Table — V0.155


















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
