# Audit V0.255

- Base conservée : V0.254 ; aucune reconstruction.
- App active : démarrage automatique du micro LIA principal après permissions système.
- Reconnaissance directe : commandes « LIA, … » et alias accepté envoyées au moteur d’actions déjà existant.
- Non-intrusion : paroles ambiantes non adressées ignorées hors session sociale ; clarifications actives restent continuables.
- iOS : un même AVAudioEngine alimente Sound Analysis, ShazamKit et la reconnaissance directe afin d’éviter les conflits de micro.
- Anti-écho : reconnaissance directe suspendue pendant la synthèse vocale de LIA puis réarmée.
- Appels : suspension stricte et reprise après fin réelle conservées.
- Handoffs : continuité externe V0.251 conservée.
- Android : fonction globale de reconnaissance vocale laissée fail-closed jusqu’à validation native RECORD_AUDIO/speech.
- Validation finale : **579/579 régressions PASS**, **17/17 gates EAS PASS**, continuité/hygiène/backend/release/projet/acceptation PASS, **193 TS/TSX sans diagnostic**.
- Limite : aucun build/appareil iPhone réel n’est revendiqué dans cet environnement ; la nouvelle reconnaissance directe native doit être testée physiquement.
