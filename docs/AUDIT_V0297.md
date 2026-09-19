# Audit V0.297

Checkpoint **0.297.0**.

Après un choix réel « Plat fait maison », la question conversationnelle de LIA « facile ou épater la galerie ? » devient une clarification bornée du repas courant. Un choix explicite `easy` ou `impress` est enregistré sur la question Message famille ; « plus tard / attends les autres » ferme simplement la clarification sans écrire de préférence.

Le choix n’est jamais inféré depuis un « oui » vague. Il est remis à zéro si la question famille est reconfigurée et la clarification est abandonnée si quelqu’un prend le repas entièrement en charge. La direction du repas est ensuite exposée comme fait confirmé au contexte de planification de LIA afin d’orienter ses suggestions suivantes sans reposer la même question. Aucun second micro, assistant ou stockage parallèle n’est créé.
