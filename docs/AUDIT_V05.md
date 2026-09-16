# Audit V0.5 — 2026-09-13

Contrôles effectués sans demander d’action utilisateur :

- 21 fichiers TypeScript/TSX passés au transpileur TypeScript local : **0 erreur de syntaxe**.
- Le test de dépendances complet n’a pas pu être exécuté dans l’environnement de travail car `npm install` n’a pas terminé dans la fenêtre d’exécution. Ce point reste à valider lors du premier build connecté ; il n’est pas présenté comme vérifié.
- Correction d’un défaut fonctionnel : la liste de courses n’était pas filtrée par `week_start` et pouvait mélanger plusieurs semaines.
- Correction du cache hors-ligne : cache et file d’attente sont maintenant séparés par foyer **et par semaine**.
- Correction du statut de synchronisation : un échec réseau ne s’affiche plus comme « Synchronisé ».
- Ajout de la navigation semaine précédente / aujourd’hui / semaine suivante au planning.
- Ajout du créneau `snack` / goûter prévu par le cahier des charges.
- Dates du planning converties en date locale `YYYY-MM-DD` au lieu de `toISOString()`, pour éviter un décalage de jour lié au fuseau horaire.
