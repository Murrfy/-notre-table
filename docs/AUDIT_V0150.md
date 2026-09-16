# Audit V0.150 — mutations planning/courses/garde-manger single-flight

## Constat
Plusieurs écritures et exports pouvaient encore être déclenchés deux fois dans la fenêtre précédant le rerender React.

## Correction
- Planning : verrous distincts pour sauvegarde/suppression de repas, copie/reconstruction de semaine et idées/votes.
- Garde-manger : verrou partagé pour ajout/suppression.
- Courses : verrou d’ajout et verrou partagé pour suppression des cochés, exports et responsabilité.
- Aucun changement produit, backend, navigation ou rendu visuel.

## Validation
- 162/162 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Hygiène source : 262 fichiers inspectés.
- Audits continuité, hygiène source, backend et release : PASS.
