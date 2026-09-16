# Audit V0.58 — protection contre les réponses asynchrones périmées

Scope : consolidation uniquement ; aucune nouvelle fonction produit.

## Changements
- Ajout d'un petit `requestGate` indépendant du réseau et testable.
- Le Planning marque chaque chargement de semaine avec un token monotone ; une réponse d'une ancienne semaine est ignorée si une requête plus récente a démarré.
- Les idées de repas et la présence du jour suivent la même protection contre les réponses périmées.
- Les Courses protègent le chargement de la liste et du responsable de courses contre les retours hors ordre.
- Les requêtes en vol sont invalidées au démontage des écrans, afin d'éviter les mises à jour tardives après navigation.
- Les flux Realtime continuent d'appeler les mêmes loaders, donc ils bénéficient automatiquement de cette protection.

## Validation
- 70 fichiers TypeScript/TSX transpilés avec 0 diagnostic.
- 544 clés de traduction alignées FR/EN/ES/HE.
- 38/38 tests de régression réussis, dont 4 tests dédiés aux tokens de requête.
- Audit backend : 17 tables, 9 RPC, 6 tables Realtime — PASS.
- Préflight Expo SDK 57 / Node / versions — PASS.
- 0 référence concurrente dans le runtime.

## Limite inchangée
Le vrai `tsc` et les exports Expo iOS/Android restent à exécuter dès qu'un environnement disposant de `node_modules` et d'un accès npm est disponible.
