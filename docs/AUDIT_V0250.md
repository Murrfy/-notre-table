# Audit V0.250

- Base conservée : V0.249 ; aucune reconstruction de l’application.
- Nouveau parseur déterministe : `liaAssistantDirectAction` reconnaît les commandes internes explicites courses, planning et Mémos sans demander au modèle de deviner une écriture.
- Exécution : `liaAssistantDirectActionExecution` réutilise `liaAssistantActionExecutor`, donc les écritures passent toujours par la frontière structurée existante.
- Accord : une instruction explicite adressée à LIA est l’acte utilisateur et entre avec `confirmed:true`; une proposition conversationnelle du modèle ne reçoit pas ce statut.
- Confirmation : LIA prononce le succès uniquement après le retour `completed` de l’exécuteur.
- Clarification : date, type de repas, titre du repas, article de courses ou contenu de Mémo manquant sont demandés séparément sans faire répéter le reste.
- Continuité : les clarifications restent directes sans répéter « LIA », sont annulables, remplacées par une nouvelle commande explicite et nettoyées à la fin de session.
- Non-régression : appels, SMS, rappels, surnoms, voix et règles conversationnelles antérieures restent en place.
- Validation : **553/553 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **184 TS/TSX transpilés sans diagnostic**.
