# Audit V0.284

Checkpoint **0.284.0**.

Le mode cuisine comprend maintenant une fin d’étape explicite sans réinterpréter la commande « étape suivante ». « J’ai fini cette étape » avance d’un seul cran dans les étapes réelles de la recette et la réponse vocale reprend l’instruction réellement ciblée. À la dernière étape, la commande reste bornée et n’invente aucune étape supplémentaire. Le flux continue d’utiliser la session LIA globale, sans deuxième micro ni état persistant.
