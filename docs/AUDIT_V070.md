# Audit V0.70 — reconnexion et replay hors-ligne

Aucune nouvelle fonction métier. Durcissement P0 uniquement.

- `expo-network ~57.0.2` observe le retour de connectivité sur iOS/Android.
- Le premier état joignable après un démarrage peut déclencher un replay sûr : une file persistée pendant une session hors-ligne ne reste pas bloquée jusqu’à une action manuelle.
- Les événements réseau répétés en état déjà joignable ne relancent pas la synchronisation en boucle.
- Le replay de la file Courses est sérialisé par foyer/semaine/utilisateur afin qu’une nouvelle intention locale ne soit pas effacée par la fin d’un replay concurrent.
- Après lecture serveur, les intentions encore en attente sont superposées à la réponse distante : l’interface ne revient pas visuellement à un état serveur obsolète.
- L’état affiche `pending` tant qu’une intention reste en file ; `synced` n’est affiché qu’une fois la file vide.
- Régressions ajoutées pour premier online, offline→online, déduplication des événements online, overlay des intentions et reachability indéterminée.

Validation locale attendue : `npm run verify`. La validation installée, le build EAS signé et le backend Supabase distant restent des preuves externes distinctes.

Validation installée tentée le 2026-09-14 : `npm install` a de nouveau expiré dans le runtime après 45 s sans accès exploitable au registre npm. La V0.70 ne revendique donc toujours ni vrai `tsc`, ni export Expo, ni build EAS signé.
