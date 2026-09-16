# Audit V0.9 — Réutilisation et lien recettes → courses

## Implémenté
- Bouton « Réutiliser la semaine précédente » dans le planning.
- Copie réelle côté PostgreSQL : recettes, repas libres, notes, cuisinier et participants.
- Les créneaux déjà présents dans la semaine cible sont remplacés proprement par la copie.
- Bouton « Ajouter les ingrédients aux courses » depuis le détail d'une recette.
- Fusion prudente des lignes identiques (nom + unité + rayon) lorsqu'elles ne sont pas encore cochées.
- Nouvelle source `recipe` dans la liste de courses afin de ne pas confondre ces ajouts avec la génération automatique du planning.

## Raison produit
Le scénario du cahier des charges prévoit la réutilisation d'un planning précédent. Le benchmark AnyList confirme également la valeur du passage direct recette → liste de courses.

## Sécurité / intégrité
- Vérification d'appartenance au foyer avant copie ou ajout aux courses.
- Une recette d'un autre foyer ne peut pas être ajoutée à la liste.
- Les participants et le cuisinier restent soumis aux contrôles V0.7.
