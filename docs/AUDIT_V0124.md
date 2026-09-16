# AUDIT V0.124 — export compliance iOS explicite

Aucun changement produit. Ce checkpoint prépare la soumission iOS sans modifier le runtime utilisateur.

- `ios.config.usesNonExemptEncryption=false`.
- Aucune dépendance crypto applicative propriétaire n’est ajoutée par ce checkpoint.
- La déclaration est contrôlée par la release lane et le release doctor.

## Validation locale
- 134/134 régressions.
- 17/17 gates EAS.
- 82 TS/TSX transpilés sans erreur.
- Audits continuité, hygiène source, backend et release : PASS.
