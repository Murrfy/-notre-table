# Audit V0.252

- Base conservée : V0.251 ; aucune reconstruction de l’application.
- Objectif : rendre le premier test iPhone de LIA/ShazamKit mesurable et sécuriser les interruptions téléphoniques.
- Diagnostic : `liaNativeAudioDiagnostics` expose l’état natif à LIA ; la carte iPhone indique permission micro, moteur d’écoute, ShazamKit, interruption, résultat de reprise, morceau reconnu et état d’appel.
- CallKit : `CXCallObserver` observe l’état réel des appels système. Un appel entrant, sortant, connecté ou en attente met LIA en suspension.
- Suspension appel : arrêt de SoundAnalysis/Shazam buffer, arrêt de la reconnaissance vocale et arrêt immédiat de la synthèse LIA.
- Garde de reprise : `startAnalysis`, `startRecognition` et `speak` refusent de repartir pendant un appel actif. La fin d’interruption AVAudioSession ne contourne pas l’état CallKit.
- Fin d’appel : reprise seulement lorsque `CXCallObserver.calls` ne contient plus d’appel non terminé ; la reconnaissance vocale interrompue est restaurée en priorité, sinon l’écoute/identification demandée est réarmée.
- Musique : règles V0.251 inchangées ; LIA reste silencieuse pendant un morceau sauf adresse directe.
- Apple : ShazamKit doit être activé comme App Service pour l’App ID `com.notretable.app` avant le build physique.
- Validation native : non revendiquée tant qu’un build iPhone réel n’a pas confirmé micro, Shazam, arrière-plan, interruption d’appel et reprise.

- Validation locale finale : **563/563 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et matrice d’acceptation PASS ; **190 TS/TSX transpilés, 0 diagnostic**.
- Release doctor : le code local est cohérent ; le build appareil reste bloqué ici par l’absence d’EAS CLI/projetId/EXPO_TOKEN et de configuration backend preview.
