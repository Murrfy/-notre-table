# AUDIT V0.125 — portée iPad explicitement suivie

Aucun changement produit. Le support tablette déclaré n’est ni retiré ni considéré comme implicitement prouvé.

- `supportsTablet: true` reste inchangé.
- Le release doctor expose une étape manuelle `ios-tablet-qa`.
- La bêta téléphone peut continuer ; la soumission Store doit inclure un vrai contrôle iPad si le support tablette est conservé.
## Validation locale
- Régressions : **135/135**
- Gates EAS : **17/17**
- TS/TSX transpilés : **82**, 0 erreur
- Audits continuité / hygiène / backend / release : **PASS**
- Limite volontaire : aucun iPad physique n’est encore présenté comme testé.

