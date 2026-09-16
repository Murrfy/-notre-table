# Audit V0.50 — planifier un repas sans surcharge

- Aucun ajout fonctionnel métier.
- Éditeur de repas réorganisé autour d’une décision rapide : texte libre ou recette.
- Détails secondaires repliés par défaut : cuisinier, convives, invités, portions et note.
- Alertes alimentaires conservées hors du panneau replié pour rester visibles avant sauvegarde.
- Suppression du choix redondant « repas libre ».
- Action de suppression visible uniquement pour un repas existant.
- Garde-fous d’audit ajoutés pour maintenir cette simplicité.
- Validation : `npm run audit` + `npm run regression`.
- Le build Expo natif complet reste distinct et non revendiqué tant que toutes les dépendances ne peuvent pas être installées dans l’environnement.
