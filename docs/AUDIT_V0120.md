# AUDIT V0.120 — thème système Android correctement câblé

Aucun changement produit. Ce checkpoint corrige une dépendance native manquante dans la configuration Expo.

- `app.json` utilise `userInterfaceStyle: "automatic"`.
- Expo SDK 57 exige `expo-system-ui` sur Android pour appliquer ce réglage ; la dépendance recommandée `~57.0.4` est maintenant déclarée.
- Le plugin CNG `expo-system-ui` est ajouté à `app.json`.
- `environment-preflight` et l’audit projet verrouillent désormais cette dépendance/plugin afin qu’ils ne puissent pas disparaître silencieusement.
- L’installation réelle reste à prouver via `npm ci` + `expo install --check` dès que le runner réseau est disponible.

## Résultat local

- 128/128 tests de régression PASS.
- 17/17 gates EAS PASS.
- 82 fichiers TS/TSX transpilés statiquement, 0 erreur.
- Audits continuité, hygiène source, backend et release PASS.
- Hygiène source : 231 fichiers contrôlés.
- Manifest de provenance : 230 fichiers couverts avant hash final.
