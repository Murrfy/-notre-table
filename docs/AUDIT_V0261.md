# Audit V0.261

Checkpoint **0.261.0**.

- Base V0.260 conservée : destination Google serveur, ambiguïté explicite, quota 30 trajets/foyer/mois et guidage natif fail-closed.
- `GMSNavigationNavInfo` expose instruction formatée, distance à la prochaine manœuvre, route courante, ETA, distance finale, état de navigation et reroutage.
- L’écran **En route avec LIA** affiche la prochaine indication sans laisser une consigne obsolète pendant un reroutage.
- Guidage vocal natif Google activé avec alertes + indications, sortie Bluetooth autorisée et volume normal.
- Aucune revendication de voix LIA personnalisée pour les indications tant que son timing n’est pas validé sur appareil.
