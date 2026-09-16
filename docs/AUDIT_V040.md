# Audit V0.40 — placard anti-gaspillage

Date : 2026-09-13

## Décision produit
Le placard partagé ne sert plus seulement à éviter les achats en double : une date limite facultative permet aussi de faire remonter les produits à utiliser bientôt, sans transformer l’application en gestionnaire d’inventaire lourd.

## Vérifications exécutées
- `npm run verify` : PASS.
- 52 fichiers TypeScript/TSX transpilés, 0 diagnostic de transpilation.
- 488 clés anglaises avec parité FR/ES/HE.
- 21/21 tests de régression passés.
- 0 nom de concurrent dans le runtime.
- 0 alerte heuristique de texte UI français codé en dur.
- `app.json` et `package.json` synchronisés en 0.40.0.

## Régressions ajoutées
- calcul du nombre de jours avant date sans dérive de fuseau ;
- classification expiré / à utiliser bientôt / plus tard ;
- validation stricte `YYYY-MM-DD` ;
- conservation de la date connue la plus proche lors d’une fusion de stock.

## Backend prévu
- `pantry_items.expires_on date` + index foyer/date ;
- migration idempotente avec `add column if not exists` ;
- RPC panier V0.40 avec paramètre `p_expires_on` ;
- droit d’exécution révoqué à `public` puis accordé à `authenticated`.

## Toujours non revendiqué
- pas de `tsc --noEmit` avec les types Expo/React Native réellement installés ;
- pas de bundle Expo complet ni compilation iOS/Android ;
- pas d’exécution du SQL contre un projet Supabase réel.
