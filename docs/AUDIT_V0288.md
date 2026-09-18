# Audit V0.288

Checkpoint **0.288.0**.

Le mode cuisine peut maintenant adapter une quantité d’ingrédient à un nombre de personnes explicitement demandé. Le calcul reste déterministe et local : quantité enregistrée × portions demandées / portions de base de la recette.

La cible est bornée de 1 à 50. Si l’ingrédient n’a pas de quantité précise, si la recette n’a pas de nombre de portions exploitable ou si l’ingrédient est ambigu, LIA refuse de produire une valeur au lieu d’inventer. Aucun état de recette, écran ou pipeline vocal supplémentaire n’est créé.
