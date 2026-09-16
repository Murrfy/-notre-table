# Audit V0.134

V0.134 durcit uniquement les métadonnées d’autofill des champs d’authentification.

- E-mail : `autoComplete="email"`.
- Connexion : `current-password`.
- Inscription / récupération / confirmation : `new-password`.
- Pas de `textContentType` redondant.
- Validation locale : **144/144 régressions**, **17/17 gates EAS**, **82 TS/TSX**, **623 clés EN** avec parité ; audits continuité/hygiène/backend/release PASS.
- Limite externe inchangée : pas de `npm ci`/vrai `tsc`/exports Expo sans registre npm accessible.
