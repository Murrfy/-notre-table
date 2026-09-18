# V0.252 — protocole de test iPhone LIA / ShazamKit / appels

## Préconditions
- Build iOS natif signé de V0.252 installé sur un iPhone physique.
- App ID `com.notretable.app` avec le service ShazamKit activé dans Apple Developer.
- Permission micro accordée à Notre Table.
- LIA activée et écoute démarrée volontairement.

## 1. Démarrage de l’écoute
Attendu dans le diagnostic LIA : micro `granted`, moteur d’écoute `active`, Shazam `ready`, aucun appel actif.

## 2. Reconnaissance musicale
Faire jouer un morceau audible par le micro. Attendu : titre/artiste apparaissent dans « Morceau reconnu ». Pendant le morceau, LIA ne parle pas spontanément. Si l’utilisateur l’interpelle, elle peut répondre.

## 3. Appel entrant pendant l’écoute
Pendant que LIA écoute, recevoir un appel. Attendu dès la sonnerie : état appel actif, LIA silencieuse, moteur audio/reconnaissance suspendus. LIA ne reprend pas pendant l’appel. Après raccrochage : état appel inactif puis reprise du moteur demandé.

## 4. Appel sortant demandé à LIA
Demander à LIA d’appeler un contact. Attendu : ouverture de l’appel, puis suspension totale pendant la communication. Après raccrochage, Notre Table conserve la session et LIA reprend son écoute précédente.

## 5. Appel rejeté / non décroché
Recevoir un appel puis le refuser, ou lancer un appel qui n’aboutit pas. Attendu : LIA reste suspendue tant que CallKit signale l’appel ; elle reprend uniquement lorsque le dernier appel est terminé.

## 6. Contrôle de vérité
En cas d’échec, relever dans la carte diagnostic : `App`, `Interruption`, `Reprise`, `Appel téléphonique`, `Shazam`, éventuelle erreur native et dernier morceau reconnu. Aucun succès ne doit être déduit visuellement si ces états ne le confirment pas.
