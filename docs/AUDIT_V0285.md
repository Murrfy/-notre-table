# Audit V0.285

Checkpoint **0.285.0**.

La fermeture vocale du mode cuisine est désormais explicite et bornée. Seules les formulations qui désignent clairement la recette ou le mode cuisine produisent `finish_recipe`; une formulation ambiguë comme « j’ai fini » reste ignorée par cette action. La surface existante est fermée via son callback `onClose`, sans stockage supplémentaire ni nouveau pipeline vocal.
