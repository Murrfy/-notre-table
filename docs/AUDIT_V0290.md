# Audit V0.290

Checkpoint **0.290.0**.

Le mode cuisine conserve brièvement le contexte d’une demande de portions afin qu’un suivi comme « et pour 8 ? » puisse réutiliser l’ingrédient ciblé ou l’adaptation de liste précédente sans faire répéter toute la commande.

Ce contexte est exclusivement en mémoire de session, borné à deux minutes et remis à zéro dès qu’un tour non pertinent est traité. Un nombre isolé n’est jamais interprété comme une commande de portions. Le suivi sans nouvelle adresse « LIA » passe par le même pipeline vocal global déjà actif ; aucun second micro, état persistant ou moteur parallèle n’est créé.
