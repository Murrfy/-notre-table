# Audit V0.281

Checkpoint **0.281.0**.

Le mode cuisine mains libres reste branché au micro global de LIA et gagne trois commandes locales sans créer de moteur parallèle : « étape précédente », « il reste combien ? » et l’annulation explicite du minuteur de recette. L’annulation du minuteur est prioritaire sur l’ordre générique de silence afin d’éviter de couper simplement la voix quand l’utilisateur voulait arrêter le chrono. La navigation reste bornée aux étapes réelles de la recette et aucun minuteur global n’est modifié par erreur.
