# Audit V0.304 — Voix, limites conversationnelles et identité

## Portée
- Application de la prononciation préférée au rendu vocal sans modifier le nom affiché.
- Préparation des préférences de prononciation par identité stable des membres du foyer.
- Réactions graduées et variées aux répétitions, cris probables et insultes.
- Politique prudente d'identification multi-locuteurs à table et en cuisine.

## Garde-fous
- Aucun prénom si l'identité du locuteur n'est pas fiable.
- Aucun fait personnel attribué à un locuteur inconnu ou incertain.
- Seuil d'identité forte : confiance >= 0,90 et absence de chevauchement de voix.
- En cuisine/table, LIA cherche à identifier le locuteur ; une demande pratique urgente peut être traitée avant la question d'identité.
- Une phrase frustrée isolée ne déclenche pas le retrait fort ; l'agressivité répétée peut déclencher une pause temporaire.
- Les formulations de limite sont variées et le vocal n'utilise pas d'emoji comme substitut d'intonation.

## Validation
À valider par le workflow GitHub Validate Notre Table sur le SHA exact de la PR avant fusion.
