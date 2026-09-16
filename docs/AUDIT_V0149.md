# Audit V0.149 — soumissions foyer single-flight

## Constat
Plusieurs actions déjà protégées visuellement par `loading`/`busy` pouvaient encore être déclenchées deux fois dans la fenêtre avant rerender React.

## Correction
- Création/jonction de foyer : verrou `submitInFlight`.
- Création d’invitation : verrou `inviteInFlight`.
- Export de données : verrou `exportInFlight`.
- Membres légers : verrou partagé `actionInFlight` pour création/modification, activation, question et partage.
- Les états visuels et contrats d’accessibilité existants restent inchangés.

## Validation
- 161/161 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Hygiène source : 261 fichiers inspectés.
- Audits continuité, hygiène source, backend et release : PASS.
- Aucun changement produit, backend ou navigation.
