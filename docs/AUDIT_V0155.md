# Audit V0.155 — lockfile npm réel et reproductible

## Constat
Le projet avait volontairement refusé de fabriquer un `package-lock.json` sans registre npm accessible. Le dépôt privé GitHub et un runner réseau sont maintenant disponibles.

## Correction
- `package-lock.json` npm v3 généré sur GitHub avec Node 22.16.0 / npm 10.9.2.
- Génération réelle : `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`.
- Réinstallation propre réelle : `npm ci --no-audit --no-fund` — PASS.
- Le lockfile est désormais versionné dans le checkpoint et sa version racine est synchronisée avec `package.json`.
- Garde permanent : l'audit release et les régressions refusent un lockfile absent, d'une version de format inattendue ou désynchronisé du package.
- Aucun changement produit, backend, navigation ou rendu visuel.

## Preuve externe GitHub
- Dépôt privé : `Murrfy/-notre-table`.
- Bootstrap initial réussi : run `35005422406`, job `104503841531`, commit lockfile `32ab676be6929f43d9000e36f2385aa744e33a8d`, artifact `10411452021`.
- Resynchronisation V0.155 réussie : run `35006195617`, job `104506432590`, artifact `10411088280`.
- Le second runner a exécuté `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` puis `npm ci --no-audit --no-fund` : PASS.
- SHA-256 exact du `package-lock.json` V0.155 validé par GitHub : `1031e4d59be74bb0228b8812e2a73bf0de17ac026070e0c7b9f5f5852161b029`.
- La copie locale et l'artifact GitHub sont octet pour octet identiques.

## Limite restante
Cette preuve valide la résolution des dépendances et `npm ci`. Elle ne vaut pas encore preuve d'un vrai `tsc`, d'exports Expo iOS/Android ou d'un build EAS de l'application complète ; ces étapes restent à exécuter après import du runtime complet dans le dépôt.
