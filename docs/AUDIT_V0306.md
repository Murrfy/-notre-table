# Audit V0.306 — Résolution du locuteur

## Portée
- Résoudre un prénom annoncé contre les identités stables du foyer.
- Conserver la piste vocale exacte en attente d'identification.
- Refuser l'attribution automatique lorsqu'un prénom correspond à plusieurs personnes.

## Garde-fous
- Correspondance unique requise avant rattachement.
- Doublons de prénom = clarification.
- Aucun fait personnel n'est attribué à une correspondance ambiguë ou inconnue.
- Aucune reconnaissance biométrique n'est simulée.

## Validation
À valider par le workflow GitHub Validate Notre Table sur le SHA exact de la PR avant fusion.
