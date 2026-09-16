# AUDIT V0.126 — zones sûres Android/iOS modernes

Aucun changement produit. Ce checkpoint retire l’usage du `SafeAreaView` legacy de React Native, déprécié et non adapté comme contrat Android edge-to-edge.

- Dépendance Expo SDK 57 : `react-native-safe-area-context ~5.7.0`.
- `SafeAreaProvider` unique à la racine de `App.tsx`.
- Tous les `SafeAreaView` applicatifs proviennent de `react-native-safe-area-context`.
- Preflight, audit projet et régression verrouillent ce contrat.
- L’installation/bundle natifs restent non prouvés tant que npm est inaccessible.
## Validation locale
- Régressions : **136/136**
- Gates EAS : **17/17**
- TS/TSX transpilés : **82**, 0 erreur
- Audits continuité / hygiène / backend / release : **PASS**
- Limite : la résolution/install native de `react-native-safe-area-context` sera prouvée par `npm ci` + `expo install --check` dès que le registre est accessible.

