# V0.253 — protocole de test iPhone LIA / ShazamKit / appels

## Préconditions
- Build iOS natif signé de V0.253 installé sur un iPhone physique.
- App ID `com.notretable.app` avec le service ShazamKit activé dans Apple Developer.
- Permission micro accordée à Notre Table.
- LIA activée et écoute démarrée volontairement.

## 1. Démarrage
Ouvrir LIA puis démarrer l’écoute. Attendu : micro `granted`, moteur actif, Shazam prêt, aucun appel actif.

## 2. Musique
Faire jouer un morceau audible. Attendu : titre/artiste apparaissent dans « Morceau reconnu ». LIA reste silencieuse pendant le morceau sauf si l’utilisateur l’interpelle.

## 3. Appel pendant l’écoute
Recevoir ou lancer un appel. Attendu : LIA coupe parole, STT et analyse sonore pendant toute la durée de l’appel. Elle ne reprend qu’après la fin réelle de l’appel.

## 4. Retour après appel
Raccrocher. Attendu : `Appel téléphonique` redevient inactif puis `Reprise` indique le réarmement du moteur demandé.

## 5. Export du rapport
Dans la carte « Test audio iPhone », toucher « Partager le rapport de test ». Le fichier JSON doit contenir `latest` et une `trace` chronologique bornée. Il ne doit contenir ni contact, ni numéro de téléphone, ni donnée de foyer.

## 6. Analyse
Conserver le rapport du test réussi ou du premier échec. Les champs importants sont : `systemCallActive`, `systemCallState`, `lastInterruption`, `lastResumeResult`, `audioEngineRunning`, `shazamSessionReady`, `lastShazamError`, `lastMusicTitle`, `lastMusicArtist`, `appState`.
