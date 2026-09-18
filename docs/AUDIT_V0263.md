# Audit V0.263

Checkpoint **0.263.0**.

- Base V0.262 conservée : contexte trajet vivant, ETA/distance/manœuvres réelles et silence social en conduite.
- Commande directe d’arrêt du guidage branchée sur la session route active.
- Search Along Route exécuté côté serveur uniquement avec clé Google non exposée au mobile.
- Polyline Routes API + Places Text Search Search Along Route + routing summaries ; aucun résultat géographique approximatif présenté comme « sur la route ».
- Ajout d’arrêt soumis à confirmation utilisateur, jamais silencieux.
- Vue native multi-waypoint : arrêt intermédiaire puis reprise explicite vers la destination finale.
- Aucun historique GPS persistant ajouté.
