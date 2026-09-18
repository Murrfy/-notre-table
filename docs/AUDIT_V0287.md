# Audit V0.287

Checkpoint **0.287.0**.

Le mode cuisine répond désormais à une question ciblée sur la quantité d’un ingrédient à partir de la recette réellement ouverte. Le parseur distingue cette demande des questions de minuteur et de progression de recette. La résolution réutilise la clé canonique d’ingrédient déjà présente dans Notre Table.

Aucune quantité n’est inventée : un ingrédient absent, une quantité non renseignée ou plusieurs occurrences potentiellement destinées à des usages différents produisent une réponse explicite au lieu d’une estimation ou d’une somme silencieuse. Aucun nouveau pipeline vocal, écran ou état persistant n’est créé.
