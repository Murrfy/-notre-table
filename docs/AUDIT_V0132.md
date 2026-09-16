# AUDIT V0.132 — libellés accessibles des champs de saisie

## Portée
- Aucun changement produit ni visuel.
- 24/24 `TextInput` exposent un `accessibilityLabel` stable.
- Le libellé e-mail de l’écran d’authentification est traduit en FR/EN/ES/HE via `auth.email`.
- Un garde permanent audite le nombre de champs et interdit un nouveau `TextInput` non labellisé.

## Validation locale
- 142/142 régressions.
- 17/17 gates EAS.
- 82 TS/TSX.
- 623 clés EN avec parité FR/ES/HE.
- Audits continuité/hygiène/backend/release PASS.
- Hygiène source : 243 fichiers contrôlés.
