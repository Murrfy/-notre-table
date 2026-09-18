# Audit V0.236

- Base conservée : V0.235 ; aucune règle validée n’est remplacée.
- Contact incertain : LIA garde le choix uniquement en mémoire de session et accepte « oui » ou le nom complet.
- Plusieurs contacts : LIA prononce les noms réellement trouvés et ne choisit jamais silencieusement.
- Plusieurs numéros : LIA prononce les libellés disponibles et accepte une réponse courte comme « portable », « travail » ou « domicile ».
- Les libellés natifs anglais `mobile`, `work` et `home` reconnaissent leurs équivalents français, pour les appels et les SMS.
- Le composeur téléphone ne s’ouvre qu’après une résolution unique ; toute réponse encore ambiguë reste en clarification.
- Validation locale terminée : TypeScript strict PASS ; audits continuité, hygiène source, contrat backend, release, acceptation fonctionnelle et projet PASS ; 17/17 gates EAS ; 478/478 régressions.
- Exports Metro Android et iOS PASS, 902 modules chacun.
- Aucun build natif signé ni essai sur téléphone physique n’est revendiqué avant exécution réelle.
