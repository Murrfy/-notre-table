# Audit V0.172

## Périmètre
- Provider Google Places API (New) côté serveur via Edge Function `commander-search`.
- Activation mobile opt-in ; aucune clé Google dans le bundle.
- Séparation technique stricte entre résultats organiques et inventaire sponsorisé.
- Attribution Google Maps près des résultats.
- Favoris Google limités durablement à provider/Place ID.

## Garde-fous
- `GOOGLE_MAPS_API_KEY` lu uniquement via `Deno.env` dans l’Edge Function.
- Fonction authentifiée (`verify_jwt = true`) + contrôle utilisateur côté fonction.
- Rayon serveur reclampé à 10 km.
- `delivery='unknown'` et `orderUrl=null` pour toute découverte Google.
- Photos/reviews Google non demandées ; réponse Edge `no-store`.
- Provider live désactivé par défaut.
- Provider naturel filtre toute ligne sponsorisée ; provider sponsorisé séparé et désactivé par défaut.
- Migration 020 rend `display_name` nullable et un trigger serveur efface nom/catégories pour `google-places`.

## Validation locale
- `npm run verify` : PASS attendu après alignement final du checkpoint.
- **212/212 régressions**, **17/17 gates EAS**, **110 TS/TSX** sans erreur de transpilation, **897 clés EN** avec parité.
- Hygiène source : **334 fichiers**.
- Backend : **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.
- Aucun appel Google réel, déploiement Edge, billing Google, secret distant, build Expo installé ou appareil physique n’est revendiqué.
