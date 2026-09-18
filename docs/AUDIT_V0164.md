# Audit V0.164

## Périmètre
- Premier lancement conservé dans l’ordre **langue → LIA → compte → foyer**.
- Présentation vocale locale de LIA après le choix de langue, sans appel TTS cloud obligatoire.
- Présentation automatique unique uniquement si aucun lecteur d’écran n’est actif.
- Contrôle visible Écouter/Arrêter ; la voix est coupée à la sortie ou avant navigation.
- Aucun paywall injecté dans le premier contact.

## Validation locale
- 191/191 tests de régression : PASS.
- 17/17 gates EAS : PASS.
- 95 fichiers TS/TSX transpilés statiquement, 0 erreur.
- 751 clés anglaises avec parité des langues : PASS.
- Continuité, hygiène source, backend et release : PASS.
- Hygiène source : 304 fichiers inspectés.

## Limite non masquée
`node_modules` est absent dans cet environnement. Le vrai typecheck installé, les exports Expo natifs et l’écoute réelle de la voix sur appareil physique ne sont donc pas revendiqués.
