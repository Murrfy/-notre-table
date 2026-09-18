# Audit V0.286

Checkpoint **0.286.0**.

Le mode cuisine peut cibler directement une étape numérotée sans modifier les commandes séquentielles existantes. Le parseur extrait uniquement un numéro explicitement associé à « étape / step / paso / שלב ». L’application n’exécute le déplacement que si ce numéro appartient aux étapes réelles de la recette ; une cible hors limites laisse l’index inchangé et déclenche une réponse fondée sur le nombre réel d’étapes.
