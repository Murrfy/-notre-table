# Audit V0.282

Checkpoint **0.282.0**.

Le mode cuisine existant devient plus réellement mains libres : LIA peut afficher, masquer et lire les ingrédients de la recette ouverte. Ces commandes réutilisent le panneau d’ingrédients, le moteur de commandes cuisine et le handler de session déjà branché au micro global de LIA. La lecture est strictement dérivée des données de la recette ; aucune donnée manquante n’est inventée et aucun nouvel état persistant n’est créé.
