# AUDIT V0.128 — sémantique d’accessibilité des textes cliquables

Aucun changement visuel ni produit. Les contrôles existants qui utilisent `Text.onPress` doivent être annoncés comme boutons par VoiceOver/TalkBack.

- Tous les `<Text onPress>` existants portent `accessibilityRole="button"`.
- Aucun wrapping/reflow n’est introduit : le rendu reste identique.
- Audit projet et régression parcourent `App.tsx` et tous les TSX de `src/`.
## Validation locale
- Contrôles `Text.onPress` audités : **18**
- Régressions : **138/138**
- Gates EAS : **17/17**
- TS/TSX transpilés : **82**, 0 erreur
- Audits continuité / hygiène / backend / release : **PASS**

