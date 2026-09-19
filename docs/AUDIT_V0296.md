# Audit V0.296

Checkpoint **0.296.0**.

Le guidage contextuel déjà utilisé par Message famille est généralisé aux parcours Planning, Courses et Recettes. Chaque fonction peut déclencher une explication courte lors de sa première utilisation, puis LIA reste silencieuse tant que l’utilisateur progresse normalement.

Les aides ultérieures reposent sur des signaux d’interface concrets et bornés : éditeur de repas encore vide après 18 secondes, article de courses saisi mais non ajouté après 12 secondes, recherche de recette sans résultat après 15 secondes. Le timer est annulé dès que l’état change, et un même type d’aide est soumis à un cooldown de dix minutes.

Le prénom de la personne n’est utilisé que s’il est réellement disponible dans son profil. La mémorisation de première utilisation est indépendante d’un changement de prénom. Tous les événements passent par le service existant `liaContextualGuidance`, le même `LiaOrb`, le même moteur de réponse et la même voix. Aucun second assistant, moteur de tutoriel ou pipeline d’écoute n’est créé.
