# Audit V0.303 — Prénom et prononciation

## Portée
- Usage occasionnel du prénom au démarrage d'un échange.
- Distinction stricte entre nom affiché et nom prononcé.
- Correction de prononciation confirmée stockée comme fait relationnel `name_pronunciation` lié à la personne.

## Garde-fous
- La correction vocale ne modifie jamais `display_name`.
- Une correction ultérieure remplace la préférence précédente au lieu de créer des variantes concurrentes.
- Le prénom n'est pas injecté à chaque tour de conversation.
- Aucune prononciation personnalisée n'est inventée sans correction connue.

## Validation
À valider par le workflow GitHub `Validate Notre Table` sur le SHA exact de la PR avant fusion.
