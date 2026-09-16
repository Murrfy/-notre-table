# Audit V0.57 — stockage local résilient

Scope : consolidation uniquement ; aucune nouvelle fonction produit.

## Changements
- Ajout d'une frontière unique `src/lib/storage.ts` pour les lectures/écritures locales JSON.
- Ajout de `src/lib/storageCodec.ts` afin de tester le décodage sans dépendre du runtime React Native.
- Planning, courses, file hors-ligne des coches, placard, présence, goûts, abonnement local, rappels, préférences et responsable des courses ne parsèment plus directement le JSON persisté.
- Une valeur JSON corrompue ou d'une forme incompatible retourne désormais un fallback conservateur et supprime uniquement la clé illisible ; aucun `AsyncStorage.clear()` global n'est autorisé.
- La file hors-ligne des courses valide explicitement `{id, checked}` avant tout replay réseau.
- Les préférences langue/mesure, thème et réactions recette sont nettoyées à la lecture pour éviter qu'un ancien format invalide ne se propage dans l'UI.
- L'audit interdit désormais l'accès direct à AsyncStorage et `JSON.parse` depuis `src/services/**`.

## Validation dans l'environnement courant
- 69 fichiers TypeScript/TSX transpilés avec 0 diagnostic.
- 544 clés de traduction alignées FR/EN/ES/HE.
- 34/34 tests de régression réussis, dont 4 nouveaux tests sur le codec de stockage.
- Audit backend : 17 tables, 9 RPC, 6 tables Realtime — PASS.
- Préflight Expo SDK 57 / Node / versions — PASS.
- 0 référence concurrente dans le runtime.

## Limite inchangée
`node_modules` n'est toujours pas installé dans cet environnement : le vrai `tsc` et les exports Expo iOS/Android restent à exécuter dans un environnement ayant accès au registre npm.
