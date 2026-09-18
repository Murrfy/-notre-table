# Audit V0.193

## Objet
Relier la politique de confidentialité LIA, l’inbox privée et la notification générique.

## Invariants
- texte sensible uniquement dans l’inbox propriétaire ;
- notification = id + copie générique ;
- aucun texte sensible dans le payload notification ;
- écran privé si l’app est ouverte ;
- aucune demande de permission surprise ;
- silence/pause prioritaire.

## Validation
- 261/261 régressions PASS.
- 17/17 gates EAS PASS.
- 120 fichiers TS/TSX transpilés sans erreur.
- 922 clés EN avec parité.
- audits continuité/hygiène/backend/release/feature PASS.
- hygiène source : 372 fichiers.
- backend : 22 tables client / 17 RPC / 7 Realtime, migrations 001 → 021.
