# Audit V0.291

Checkpoint **0.291.0**.

Le mode cuisine peut maintenant conserver la cible de portions d’une demande récente afin qu’un suivi comme « et le lait ? » réutilise ce nombre sans faire répéter toute la phrase.

Le suivi reste borné à la même fenêtre de deux minutes que V0.290. Le candidat doit correspondre à un ingrédient réel de la recette ouverte avant d’être transformé en demande de quantité ; sinon il n’est pas traité comme ingrédient. « Et pour 8 ? » reste réservé au suivi de portions. Aucun état persistant, écran ou pipeline vocal supplémentaire n’est créé.
