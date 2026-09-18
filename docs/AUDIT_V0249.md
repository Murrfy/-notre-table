# Audit V0.249

- Base conservée : V0.248 ; aucune reconstruction de l’application.
- Rappel direct : une instruction explicite adressée à LIA passe vers `liaAssistantReminderExecution` au lieu d’être renvoyée vers le moteur conversationnel.
- Exécution : le rappel réutilise `scheduleLiaAssistantAlarm`; l’instruction explicite matérialise l’accord avec `confirmed:true`.
- Clarification : seul l’élément manquant est demandé et conservé en mémoire de session jusqu’à réponse, annulation ou nouvelle commande explicite.
- Confirmation : LIA ne dit « C’est fait » qu’après le retour `scheduled`; permission refusée et entrée invalide ont leurs réponses propres.
- Appel : `dialer_opened` produit désormais une confirmation courte « J’appelle … ».
- Validation : **546/546 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **182 TS/TSX transpiles sans diagnostic**.
