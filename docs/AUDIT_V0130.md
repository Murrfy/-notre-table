# AUDIT V0.130 — état disabled annoncé aux lecteurs d’écran

## Portée
- Aucun changement produit, visuel ou comportemental.
- Les 30 `Pressable` utilisant `disabled={...}` exposent le même booléen via `accessibilityState={{disabled: ...}}`.
- VoiceOver/TalkBack peuvent ainsi annoncer qu’une commande est momentanément indisponible.
- Garde permanent : un `Pressable` désactivable ne peut plus omettre son état d’accessibilité.

## Validation locale
- 140/140 régressions.
- 17/17 gates EAS.
- 82 TS/TSX.
- Audits continuité/hygiène/backend/release PASS.
- Hygiène source : 241 fichiers contrôlés.
- Manifest de provenance : 240 fichiers couverts avant ZIP.
