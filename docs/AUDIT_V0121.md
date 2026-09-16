# AUDIT V0.121 — canal Android des rappels locaux

Aucun changement produit. Ce checkpoint corrige l’ordre natif Android des rappels locaux.

- `expo-notifications` exige qu’un canal existe avant que le prompt Android 13+ puisse apparaître.
- `syncLocalReminderNotifications` crée désormais `notre-table-reminders-v1` avant `getPermissionsAsync` / `requestPermissionsAsync`.
- Le canal est silencieux (`sound: null`, vibration désactivée) et son nom est localisé via l’i18n existante.
- Les triggers DAILY et WEEKLY utilisent explicitement ce `channelId` sur Android.
- Aucun push distant n’est activé par ce changement.


## Exact alarms Android

- Aucune permission `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` n’est demandée : elles sont explicitement bloquées dans `android.blockedPermissions`.
- Expo SDK 57 retombe sur une alarme inexacte `setAndAllowWhileIdle` lorsque l’accès exact n’est pas disponible.
- Ce choix évite un accès spécial Android inutile et la permission Play très restreinte `USE_EXACT_ALARM` pour une fonction secondaire de rappel.


## Résultat local
- 131/131 tests de régression PASS.
- 17/17 gates EAS PASS.
- 82 fichiers TS/TSX transpilés statiquement, 0 erreur.
- Audits continuité, hygiène source, backend et release PASS.
- Hygiène source : 232 fichiers contrôlés.
