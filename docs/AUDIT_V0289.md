# Audit V0.289

Checkpoint **0.289.0**.

Le mode cuisine peut adapter toute la liste d’ingrédients à un nombre de personnes explicitement demandé. Les quantités connues sont recalculées localement avec la formule quantité enregistrée × portions demandées / portions de base ; aucune donnée persistante de recette n’est modifiée.

Si certaines quantités ou les portions de base manquent, LIA expose d’abord les données exactes disponibles, identifie ce qui manque puis demande explicitement l’autorisation avant toute approximation. L’approximation reste limitée aux données manquantes, clairement annoncée comme telle et ne devient jamais une quantité enregistrée dans la recette. Aucun écran, micro ou moteur parallèle n’est créé.
