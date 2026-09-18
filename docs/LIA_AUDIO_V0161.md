# LIA — voix native et oreille locale — V0.161

## But
Donner à LIA une vraie présence vocale sans transformer Notre Table en micro ouvert permanent ni en facture audio cloud.

## Voix
- iOS : `AVSpeechSynthesizer` et voix installées sur l'appareil.
- Android : `TextToSpeech` et voix installées sur l'appareil.
- L'utilisateur peut écouter un exemple et faire défiler les voix disponibles dans sa langue.
- Le choix reste local à l'appareil.
- Une reprise de parole humaine détectée interrompt immédiatement la parole de LIA.
- Cette synthèse native n'appelle aucun fournisseur TTS cloud par phrase.

## Oreille sociale
- L'écoute n'est jamais lancée au démarrage ni à l'ouverture du panneau LIA.
- Elle nécessite : mode Cuisine/À table + bouton explicite + permission micro système.
- iOS : le module natif utilise `SNAudioStreamAnalyzer` + `SNClassifySoundRequest` de Sound Analysis.
- Le flux est analysé en mémoire. Aucun fichier audio ambiant n'est créé pour le détecteur de rire.
- Aucun audio ambiant n'est envoyé au cloud pour classifier rire/parole.
- Une classification de parole annule toute réaction sociale en attente et coupe LIA si elle parle.
- Un rire isolé ne suffit pas : le runtime attend une petite rafale cohérente et une pause avant une réaction.

## Android
La voix native Android est branchée via `TextToSpeech`. En revanche, la classification locale du rire n'est pas encore intégrée : `android.permission.RECORD_AUDIO` reste explicitement bloqué et aucun bouton ne doit déclencher de permission micro Android.

## État de preuve
Le code TypeScript et le contrat natif sont versionnés et audités. Le module Swift/Kotlin exige maintenant un **vrai prebuild/build natif** puis des tests sur appareils physiques. Tant que ce build n'a pas été exécuté, V0.161 ne prétend pas que la captation Sound Analysis ou la restitution vocale native ont été validées sur matériel réel.
