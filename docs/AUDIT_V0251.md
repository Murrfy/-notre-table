# Audit V0.251

- Base conservée : V0.250 ; aucune reconstruction de l’application.
- Musique : nouveau parseur déterministe `liaMusicCommand` et adaptateur `liaMusicActionAdapter`; une demande explicite est exécutée via ouverture réelle du service musical puis confirmée.
- Préférence : Spotify, Apple Music ou YouTube Music peut être retenu localement après choix explicite ; une préférence absente déclenche une clarification minimale.
- Continuité : `liaAssistantContinuity` marque les handoffs externes initiés par LIA. `LiaOrb` ne coupe plus la session lors de ce passage temporaire, mais garde la coupure historique pour un arrière-plan ordinaire.
- Téléphone : l’ouverture du dialer marque aussi ce handoff, sans modifier la résolution des contacts existante.
- iOS : le module natif `lia-sound-analysis` intègre ShazamKit et envoie `onMusicRecognition` avec le titre et l’artiste réellement reconnus. Le flux Shazam réutilise le buffer micro de SoundAnalysis et reprend après une reconnaissance vocale si l’écoute musicale reste active.
- Silence : `liaMusicPresence` interdit les interventions spontanées tant qu’un morceau est actif ; une adresse directe de l’utilisateur peut toujours recevoir une réponse.
- Après morceau : le dernier titre/artiste reconnu reste un fait confirmé de session pour permettre une discussion. Les demandes d’anecdotes musicales sont classées `verified_research`, donc un résultat non vérifié est refusé par le garde-fou existant.
- Cuisine : le coordinateur vocal accepte les demandes directes en mode cuisine, avec `contributionUseful:false` pour les tours ambiants afin d’éviter un bavardage spontané.
- iOS arrière-plan : `UIBackgroundModes = audio` ajouté. Le service ShazamKit de l’App ID doit encore être activé et testé sur appareil réel.
- Android : aucun faux support déclaré ; la continuité micro arrière-plan nécessitera un foreground service microphone et les permissions Android correspondantes dans un checkpoint ultérieur.
- Validation finale locale : **560/560 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release/projet et matrice d’acceptation PASS ; hygiène source **510 fichiers** ; audit projet **189 fichiers TS/TSX transpilés, 0 erreur**.
- Préflight : Node **22.16.0** / npm **10.9.2** PASS ; `node_modules` absent, donc aucun build Expo/Xcode/Android installé n’est revendiqué.
- Release doctor : rapport V0.251 régénéré ; il reste bloqué sur les dépendances/réseau, Supabase distant, EAS, preuves appareils et production billing, ce qui ne doit pas être confondu avec une validation native.
- Correction audit : la préférence du service musical passe par la frontière commune `src/lib/storage.ts` au lieu d’accéder directement à AsyncStorage.
