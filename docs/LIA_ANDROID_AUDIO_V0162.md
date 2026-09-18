# LIA — oreille Android YAMNet — V0.162

## Objectif
Donner à Android le même principe que l'iPhone : détecter localement les événements sociaux utiles à LIA sans envoyer la conversation familiale à un service cloud.

## Pipeline
- Dépendance Android : `org.tensorflow:tensorflow-lite-task-audio:0.4.4`.
- Modèle : Google YAMNet LiteRT/TFLite `classification-tflite`, version 1.
- Le modèle attend ~0,975 s d'audio mono 16 kHz et classe 521 événements sonores.
- `AudioClassifier` crée son propre `AudioRecord` et son `TensorAudio` au format requis par le modèle.
- Une classification est lancée sur un exécuteur dédié environ toutes les 480 ms.
- Le module ne transmet au JavaScript que le meilleur `label`, son `score` et un timestamp.
- Le runtime existant décide ensuite s'il s'agit de rire/parole et applique les règles sociales : silence réel, priorité humaine, cooldown et quota.

## Confidentialité
- Aucun fichier audio familial n'est créé par ce pipeline.
- Aucun `fetch`, `URLSession`, OkHttp ou endpoint IA n'est utilisé pour classifier rire/parole.
- La permission micro n'est demandée qu'après une action explicite dans Cuisine / À table.
- Si le modèle local manque, le système refuse de démarrer au lieu de basculer vers une analyse cloud.

## Provenance modèle
Le build Android doit inclure `modules/lia-sound-analysis/android/src/main/assets/yamnet.tflite` avec :
- taille : 4 126 810 octets ;
- SHA-256 : `10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de` ;
- licence : Apache-2.0.

Le script `scripts/vendor-yamnet-model.cjs` vérifie ces deux propriétés avant d'écrire l'asset.

## Pourquoi le micro Android reste bloqué dans ce checkpoint
L'environnement de travail actuel ne peut pas récupérer le binaire du modèle depuis son hébergement externe. Le code du classificateur est donc prêt, mais l'asset n'est pas présent. Pour rester honnête et sûr, `android.permission.RECORD_AUDIO` demeure dans `blockedPermissions`. Le module teste également la présence réelle du modèle et de la permission finale avant d'annoncer la fonction disponible.

## Validation restante avant production
1. Télécharger le modèle officiel, exécuter `npm run vendor:yamnet -- /chemin/vers/1.tflite` et vérifier le SHA.
2. Retirer le blocage Android `RECORD_AUDIO` uniquement dans le checkpoint qui contient l'asset validé.
3. Exécuter le vrai prebuild/Gradle/EAS.
4. Tester sur plusieurs téléphones Android physiques : permission, rire, conversation, faux positifs, interruption de LIA, consommation batterie.
5. Calibrer les seuils de score avec des scènes familiales réelles avant activation générale.
