# Audit V0.86 — concurrence placard et courses

## Périmètre
Aucune fonction produit ajoutée. Durcissement P1 de transactions déjà existantes.

## Risques corrigés
- Deux `upsert_pantry_item` simultanés pouvaient tous deux lire « absent » ; la contrainte unique évitait le doublon mais l’un des appels pouvait échouer au lieu de fusionner.
- Deux `add_recipe_to_shopping_list` simultanés pouvaient chacun rater la ligne avant insertion et créer deux lignes équivalentes.
- Une reconstruction hebdomadaire pouvait s’entrelacer avec ces mutations.

## Correction
Les trois RPC verrouillent la ligne `households` correspondante `FOR UPDATE` avant la mutation. Le verrou est transactionnel et limité au foyer concerné.

## Preuve prévue sur Supabase réel
Le smoke lance les RPC en parallèle depuis deux sessions membres et exige : quantité placard 5 sur une seule ligne après ajouts 2+3, une seule ligne générée après deux rebuilds, une seule ligne tomate quantité 4 après deux ajouts recette.
