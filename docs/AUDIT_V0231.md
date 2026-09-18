# Audit V0.231

- Base : archive V0.230 récupérée et authentifiée par SHA-256 `1f0b5760133645bab663d8b856058087f70a7e1b235fc9fb70028af65f3d6055`.
- Couche assistant vocal ajoutée devant le moteur de conversation normal.
- Une commande téléphonique n’est reconnue que lorsque LIA est explicitement adressée ; la parole ambiante ne peut pas déclencher un appel.
- Contacts du téléphone = source unique d’identité/numéro pour les appels ; `light_members` n’est jamais utilisé comme annuaire téléphonique.
- Résolution accent-insensible, doublons/nombres multiples/fuzzy matches => clarification, jamais de choix silencieux.
- Permission Contacts demandée uniquement dans le flux d’appel explicite.
- Handoff téléphonique par URL `tel:` nettoyée vers le composeur système.
- Messages fail-closed tant qu’aucun provider réel n’est connecté ; suppression de l’ancien double pipeline message.
- Mode Table conversationnel exige à la fois un vrai STT et un vrai moteur de réponse.
- Validation de récupération : **461/461 tests de régression PASS**.
- Cette validation ne revendique pas un build natif/appareil réel si celui-ci n’a pas été exécuté dans l’environnement courant.
