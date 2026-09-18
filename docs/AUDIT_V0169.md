# Audit V0.169

## Périmètre
- Adresse de livraison facultative lors de la création du foyer.
- Persistance `households.delivery_address` via migration 018.
- Transmission de l’adresse à Commander et contrat de provider limité à 10 km.

## Garde-fous
- Adresse vide autorisée ; aucun onboarding existant n’est bloqué.
- Anciens foyers compatibles avec `NULL`.
- Aucun provider fictif ni restaurant inventé.
- Aucune règle famille/LIA/Mémos modifiée.

## Validation
- `npm run verify` : PASS.
- Régressions : 202/202 PASS.
- Gates EAS : 17/17 PASS.
- Audit TypeScript/TSX : 107 fichiers, 0 erreur de transpilation.
- i18n : 883 clés anglaises avec parité FR/ES/HE.
- Hygiène source : 325 fichiers inspectés.
- Backend statique : 21 tables client / 17 RPC / 7 Realtime ; migrations 001 → 018.
- Audits continuité, hygiène, backend et release : PASS.
- Build installé, provider réel, Supabase distant et appareils physiques : non revendiqués.
