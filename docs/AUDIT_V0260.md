# Audit V0.260

Checkpoint **0.260.0**.

- Résolution de destination côté serveur via Google Places Text Search (New).
- Authentification Supabase requise ; `GOOGLE_MAPS_API_KEY` n’entre jamais dans le bundle mobile.
- Maximum 3 candidats et clarification sur ambiguïté.
- Vue native Google reçoit Place ID + coordonnées et appelle `setDestinations`.
- Guidage actif uniquement après route `.OK`; suivi ETA/distance et arrivée exposés à Notre Table.
- Quota navigation réservé après préflight et résolution, avant la requête de route facturable.
- Aucun guidage simulé lorsque le SDK/clé/backend ne sont pas réels.
