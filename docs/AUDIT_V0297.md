# Audit V0.297

Checkpoint **0.297.0**.

Le moteur de guidage contextuel déjà utilisé par Message famille est étendu à Planning, Courses et Recettes. Chaque fonction peut expliquer brièvement son usage lors de la première visite, puis LIA reste silencieuse tant que la personne progresse normalement.

Les aides ultérieures reposent uniquement sur des signaux d’interface bornés : éditeur de repas encore vide après 18 secondes, article de courses saisi mais non ajouté après 12 secondes, ou recherche de recette non vide sans résultat après 15 secondes. Chaque timer est annulé dès que l’état change. Un même type d’aide est soumis à un cooldown de dix minutes.

Le prénom utilisé dans l’intervention provient du profil courant lorsqu’il est disponible, mais il n’entre pas dans la clé de première utilisation afin qu’un changement de prénom ne fasse pas répéter les explications. Les enrichissements progressifs validés auparavant — anniversaires et plats préférés — restent inchangés.

Tous les événements utilisent le service existant `liaContextualGuidance`, le même `LiaOrb`, le même moteur de réponse et la même voix. Aucun second assistant, tutoriel autonome ou pipeline vocal n’est créé.
