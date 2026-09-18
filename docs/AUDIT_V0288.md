# Audit V0.288

Checkpoint **0.288.0**.

Le mode cuisine peut maintenant adapter une quantité d’ingrédient à un nombre de personnes explicitement demandé. Le calcul reste déterministe et local : quantité enregistrée × portions demandées / portions de base de la recette.

La cible est bornée de 1 à 50. Si l’ingrédient n’a pas de quantité précise ou si la recette n’a pas de nombre de portions exploitable, LIA expose le manque et demande explicitement l’autorisation avant toute approximation. Un « oui » clair est nécessaire ; l’estimation produite ensuite reste signalée comme approximative et distincte des données de la recette. Un ingrédient ambigu reste non calculé. Aucun état persistant de recette, écran ou pipeline vocal supplémentaire n’est créé.
