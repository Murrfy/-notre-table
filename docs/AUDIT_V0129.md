# AUDIT V0.129 — sémantique native des Pressable

## Portée
- Aucun changement produit ni visuel.
- Tous les `Pressable` interactifs exposent désormais un rôle d’accessibilité natif.
- Le backdrop invisible du menu d’actions reste volontairement hors arbre d’accessibilité (`accessible={false}`).
- Garde permanent : aucun `Pressable` ne peut rester tactile et sémantiquement anonyme.

## Validation locale
- 139/139 régressions.
- 17/17 gates EAS.
- 82 TS/TSX sans diagnostic de transpilation.
- Audits continuité/hygiène/backend/release PASS.
- Hygiène source : 240 fichiers contrôlés.
- Manifest de provenance : 239 fichiers couverts avant génération du ZIP.
