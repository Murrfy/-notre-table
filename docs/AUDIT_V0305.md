# Audit V0.305 — Identification explicite du locuteur

## Portée
- Transformer une réponse explicite à la question d'identité en identité stable de session.
- Conserver l'identifiant de personne et le type de membre, pas uniquement le prénom.
- Rattacher une piste vocale de table à cette identité confirmée.

## Garde-fous
- Aucune identité biométrique n'est inventée depuis une simple transcription.
- Une piste non confirmée reste non nominative et ne peut recevoir de mémoire personnelle.
- La confirmation explicite permet le prénom et l'attribution seulement pour la piste concernée.
- Les chevauchements et incertitudes restent soumis au seuil de sécurité V0.304.

## Validation
À valider par le workflow GitHub Validate Notre Table sur le SHA exact de la PR avant fusion.
