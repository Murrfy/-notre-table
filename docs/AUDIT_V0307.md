# Audit V0.307 — Rattachement runtime du locuteur

## Portée
- Injecter une identité explicitement confirmée dans la session vocale active.
- Synchroniser le track de session et la carte d'identité du runtime.

## Garde-fous
- Le rattachement cible uniquement la piste vocale confirmée.
- Aucune autre piste ne reçoit l'identité par propagation implicite.
- La confirmation reste explicite ; aucune biométrie n'est simulée.

## Validation
À valider par le workflow GitHub Validate Notre Table sur le SHA exact de la PR avant fusion.
