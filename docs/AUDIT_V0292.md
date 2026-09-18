# Audit V0.292

Checkpoint **0.292.0**.

LIA reconnaît désormais des formulations naturelles où l’utilisateur exprime un manque puis demande explicitement l’ajout correspondant aux courses, par exemple « il me manque du lait, ajoute-le aux courses ».

Le parseur n’interprète jamais une simple constatation de manque comme une autorisation d’écriture. L’action produite reste le type existant `shopping.add_item` et passe par `executeLiaAssistantApprovedAction`. Aucun état cuisine, moteur shopping ou pipeline vocal parallèle n’est ajouté.
