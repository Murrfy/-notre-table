# Audit V0.34

- Ajout de la répartition hebdomadaire de la charge cuisine.
- Calcul purement dérivé du planning courant : aucune nouvelle donnée sensible stockée.
- Affichage des cuisiniers actifs, nombre de repas attribués et repas sans responsable.
- Alerte douce seulement si une personne porte >=75 % d’au moins 3 repas attribués.
- Audit runtime : 48 fichiers TS/TSX, 0 diagnostic de transpilation, 447 clés i18n anglaises avec parité fr/es/he, 0 nom de concurrent dans `src/`, 0 alerte heuristique de texte UI français codé en dur.
- Build natif Expo et SQL Supabase réel toujours non validés dans ce runtime.
