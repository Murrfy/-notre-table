# Audit V0.311 — Sécurité de continuité du locuteur

Une identité restaurée n'est réutilisée que lorsque le nouveau tour vocal est non superposé et présente une confiance d'au moins 0,9. Sinon la liaison de piste est supprimée avant restauration, afin d'éviter une attribution personnelle erronée.
