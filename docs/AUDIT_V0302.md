# Audit V0.302 — Continuité de recherche

## Portée
- Recherche explicitement demandée puis interrompue.
- Réutilisation des open loops LIA existants avec `action: search`.
- Reprise bornée : 30 minutes avant éligibilité, expiration après 14 jours.
- Piste prometteuse : suggestion de Mémo avec lien, jamais persistance silencieuse.
- Confidentialité : aperçu contextuel uniquement pour une sensibilité ordinaire ; personnel/sensible conserve le mécanisme privé existant.

## Garde-fous
- Aucun enregistrement automatique d'une conversation intime ou arbitraire dans Mémos.
- Aucun second moteur de notifications ou de rappels.
- Les écritures Mémos restent volontaires.
- Régressions V0.302 ajoutées pour continuité bornée, Mémos volontaires et confidentialité lock-screen.

## Validation
À valider par le workflow GitHub `Validate Notre Table` sur le SHA exact de la PR avant fusion.
