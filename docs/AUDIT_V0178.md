# Audit V0.178

## Périmètre
- Routeur de canal LIA : voix / écran privé / notification privée / silence.
- Inbox privée locale bornée et séparée par propriétaire.
- Notification privée à aperçu générique ; le détail sensible n’entre jamais dans le payload de notification.
- Le mode social/table ne peut jamais rendre une confidence audible.
- Une pause proactive reste prioritaire.

## Garde-fous
- Texte sensible : jamais voix.
- Notification verrouillée FR : « J’ai trouvé quelque chose pour toi 👀 ».
- Aucune demande surprise de permission notification lors d’un message privé.
- Aucun contenu privé ajouté aux signaux publicitaires Commander.

## Validation
- **232/232 régressions**.
- **17/17 gates EAS**.
- **115 TS/TSX** transpilés sans erreur.
- **907 clés EN** avec parité.
- Audits continuité / hygiène / backend / release : **PASS**.
- Hygiène source : **345 fichiers**.
- Backend : **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.
- Aucun build installé, Supabase distant ou appareil physique n’est revendiqué.
