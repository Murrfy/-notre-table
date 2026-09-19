# Audit V0.299

Checkpoint **0.299.0**.

V0.299 étend le moteur contextuel LIA existant à plusieurs grandes surfaces de Notre Table sans créer de second assistant, de second micro ou de tutoriel parallèle.

## Première utilisation
- Planning, Courses, Recettes, Famille, Commander et Mémos peuvent chacun recevoir une seule présentation courte.
- La présentation est mémorisée localement par fonction.
- Hors démo, LIA attend le prénom réel de la cliente avant la première intervention afin d’éviter une personnalisation inventée.

## Aide sur blocage réel
- Planning : uniquement quand un repas est ouvert mais qu’aucune recette ni aucun plat n’est choisi.
- Courses : distingue une liste vide sans saisie d’un produit déjà saisi mais pas validé.
- Mémos : distingue titre manquant et contenu manquant.
- Commander : distingue choix de zone et adresse manquante.
- Le hook commun observe un identifiant de progression ; toute progression réinitialise le délai.
- Une même étape déjà aidée n’est pas répétée pendant la session du composant.
- Recettes et Famille restent limitées à la première explication tant qu’un signal de blocage fiable n’existe pas.

## Continuité
- Le suivi V0.298 de fin des réponses famille reste inchangé.
- Aucun champ supplémentaire n’est ajouté au formulaire d’inscription.
- Les questions progressives déjà validées (anniversaires puis plats préférés) restent espacées et facultatives.
