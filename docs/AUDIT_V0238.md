# Audit V0.238

- Base conservée : V0.237 ; aucune règle validée n’est remplacée.
- Une nouvelle commande explicite d’appel efface une clarification antérieure avant de résoudre le nouveau contact.
- Une nouvelle commande explicite de SMS efface l’ancien brouillon avant de préparer le nouveau.
- Une demande directe de rappel, recherche ou autre action abandonne également l’ancienne clarification.
- Les réponses courtes sans nouvelle commande restent attachées à la clarification en cours.
- Le remplacement ne contourne aucune protection : contacts réels, ambiguïtés fail-closed, composeurs système et geste final humain restent obligatoires.
- Validation locale terminée : TypeScript strict PASS ; audits continuité, hygiène source, contrat backend, release, acceptation fonctionnelle et projet PASS ; 17/17 gates EAS ; 484/484 régressions.
- Exports Metro Android et iOS PASS, 902 modules chacun.
- Aucun build natif signé ni essai sur téléphone physique n’est revendiqué avant exécution réelle.
