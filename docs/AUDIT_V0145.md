# Audit V0.145 — cible tactile du favori

## But
Le cœur favori était le seul bouton symbolique confirmé avec une taille visuelle 34×34, inférieure à la cible mobile de 44×44 utilisée ailleurs dans Notre Table.

## Correction
- Taille visuelle conservée : 34×34.
- `hitSlop={5}` ajouté au `Pressable`, soit 44×44 de cible effective.
- Libellé accessible localisé et état `selected` conservés.
- Garde de régression + audit statique ajoutés.

## Validation
- 155/155 régressions.
- 17/17 gates EAS.
- 82 TS/TSX, 0 erreur de transpilation.
- 630 clés EN avec parité.
- Audits continuité, hygiène source, backend et release : PASS.
