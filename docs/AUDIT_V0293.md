# Audit V0.293

Checkpoint **0.293.0**.

LIA peut maintenant conserver brièvement un ingrédient déclaré manquant afin qu’un second ordre explicite comme « ajoute-le aux courses » puisse réutiliser ce contexte sans faire répéter l’ingrédient.

La première phrase de manque ne déclenche aucune écriture. Le contexte reste exclusivement en mémoire de session, expire après deux minutes et peut être annulé. Si la référence d’ajout arrive sans contexte valide, LIA demande l’ingrédient au lieu de deviner. Toute écriture finale reste confiée à l’action existante `shopping.add_item` via `executeLiaAssistantApprovedAction`. Aucun moteur shopping ou pipeline vocal parallèle n’est créé.
