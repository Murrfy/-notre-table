# Audit V0.253

- Base conservée : V0.252 ; aucune reconstruction de l’application.
- Objectif : rendre le premier test physique iPhone exploitable avec une preuve exportable des transitions audio.
- Diagnostic : `liaNativeAudioDiagnostics` conserve une trace locale bornée à 80 snapshots et génère un rapport JSON à la demande.
- Données : aucun contact, numéro de téléphone, identifiant de foyer ou contenu relationnel n’est ajouté au rapport.
- Effet : le rapport est strictement observationnel ; aucun démarrage/arrêt audio, appel, synthèse vocale ou URL n’est déclenché par l’export.
- UI : la carte « Test audio iPhone » expose un bouton volontaire de partage et un état d’erreur localisé.
- Apple : ShazamKit reste un App Service à activer sur l’App ID `com.notretable.app`; aucun entitlement ShazamKit iOS n’est ajouté.
- Validation native : non revendiquée tant que le build iPhone physique n’a pas été installé et le protocole V0.252/V0.253 exécuté.

- Validation locale finale : **566/566 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et matrice d’acceptation PASS ; **190 TS/TSX transpilés, 0 diagnostic**.
