# AUDIT V0.118 — hygiène du checkpoint source

Aucun changement produit. Ce checkpoint ajoute un garde local contre l’inclusion accidentelle de secrets, credentials ou artefacts générés dans le code source distribué.

- Nouveau `source:hygiene:audit` exécuté par `npm run verify`.
- Refuse les vrais fichiers `.env*` (sauf `.env.example`), `.npmrc`, credentials/service-account, clés privées, certificats/signatures mobiles et archives/logs temporaires dans le checkpoint source.
- Vérifie que `.gitignore` protège toujours les dépendances, caches Expo, builds, `.validation/` et fichiers d’environnement.
- Recherche aussi plusieurs formes de valeurs secrètes à haut risque dans les fichiers texte versionnés, sans scanner les fixtures de tests qui contiennent volontairement de faux marqueurs.
- Aucun accès réseau n’est requis : le garde fonctionne dans l’environnement local actuel.
- Le manifest de provenance couvre désormais aussi `App.tsx`, `index.ts`, tout `src/` et toutes les langues : la preuve SHA-256 distingue donc réellement deux versions différentes du runtime mobile.
- Validation finale locale : **125/125 régressions**, **16/16 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS ; **228 fichiers** couverts par le manifest de provenance.
