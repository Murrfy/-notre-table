# Audit V0.287

Checkpoint **0.287.0**.

Le mode cuisine répond désormais à une question ciblée sur la quantité d’un ingrédient uniquement à partir de la recette ouverte. La requête est reconnue localement et la correspondance passe par les clés canoniques d’ingrédients déjà utilisées dans Notre Table. Aucun ingrédient ni aucune quantité n’est inventé.

Si l’ingrédient demandé est absent, si sa quantité n’est pas renseignée ou si plusieurs occurrences du même ingrédient existent, LIA l’annonce explicitement au lieu de fabriquer une réponse ou d’additionner silencieusement des quantités qui pourraient correspondre à des usages différents.
