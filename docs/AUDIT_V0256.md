# Audit V0.256

## Portée
Checkpoint dérivé directement de V0.255. Aucune reconstruction de l’application.

## Ajouts audités
- routage vocal navigation et clarification de destination ;
- surface interne « En route avec LIA » ;
- module iOS Core Location fail-closed ;
- adaptateur de moteur de navigation sans faux succès ;
- personnalité locale pour petits échanges et limites physiques ;
- politique provider anti-interrogatoire pour les échanges ordinaires.

## Résultats locaux
- régressions : 583/583 PASS ;
- gates EAS : 17/17 PASS ;
- audits continuité, hygiène source, backend, release, acceptation et projet : PASS ;
- transpilation : 198 TS/TSX dans l’audit projet, 0 diagnostic ; balayage élargi incluant les modules : 201, 0 diagnostic ;
- aucun itinéraire inventé lorsque le moteur natif n’est pas connecté ;
- `tsc --noEmit` complet non disponible dans cet environnement faute de dépendances Expo/React installées.

## Validation appareil restante
- permission/localisation réelle sur iPhone ;
- branchement et test du moteur de navigation intégré ;
- guidage virage-par-virage réel et continuité LIA pendant le trajet.
