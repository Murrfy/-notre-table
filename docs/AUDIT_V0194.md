# Audit V0.194

## Objet
Fermer la boucle entre notification générique LIA et message privé propriétaire.

## Invariants
- aucun texte sensible dans le payload système ;
- routage uniquement pour `screen=lia-private` ;
- `messageId` non vide obligatoire ;
- lecture propriétaire par `ownerId + messageId` ;
- réponse notification consommée/effacée après routage ;
- aucun contournement de l’onboarding/foyer.

## Validation
- 263/263 régressions PASS.
- 17/17 gates EAS PASS.
- 122 fichiers TS/TSX transpilés sans erreur.
- 925 clés EN avec parité.
- audits continuité/hygiène/backend/release/feature PASS.
- hygiène source : 375 fichiers.
- backend : 22 tables client / 17 RPC / 7 Realtime, migrations 001 → 021.
