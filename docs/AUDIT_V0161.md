# Audit V0.161 — voix native et oreille locale de LIA

## Changement
- Module Expo local `modules/lia-sound-analysis` ajouté.
- iOS : voix `AVSpeechSynthesizer`, permission micro explicite, classification locale `Sound Analysis` sur flux mémoire.
- Android : voix `TextToSpeech`; écoute sociale volontairement indisponible tant qu'un classificateur local Android n'est pas intégré.
- `LiaOrb` expose test/changement de voix et bouton d'écoute explicite uniquement dans Cuisine/À table.
- Reprise de parole humaine => annulation de la réaction en attente et arrêt immédiat de la voix de LIA.
- Aucun endpoint cloud ni `fetch` dans le chemin de classification ambiante.
- `NSMicrophoneUsageDescription` explique que l'accès n'arrive que lorsque l'utilisateur active explicitement l'écoute de LIA.
- Android conserve `RECORD_AUDIO` dans `blockedPermissions`.

## Validation
- `npm run verify` : PASS.
- Régressions : **186/186**.
- Gates EAS : **17/17**.
- Audit TypeScript/TSX statique : **95 fichiers**, **0 erreur de transpilation**.
- Traductions : **728 clés EN** avec parité FR/ES/HE.
- Hygiène source : **296 fichiers** inspectés.
- Audits continuité / hygiène / backend / release : PASS.
- La preuve de release inclut désormais `modules/lia-sound-analysis`, donc les sources Swift/Kotlin sont liées au contrat SHA-256.

Limite : `node_modules` est absent dans cet environnement. Le vrai `tsc`, le prebuild/build natif Swift/Kotlin, EAS et les tests sur appareils physiques restent obligatoires avant toute affirmation de fonctionnement matériel.
