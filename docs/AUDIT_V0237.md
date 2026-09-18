# Audit V0.237

- Base conservée : V0.236 ; aucune règle validée n’est remplacée.
- « Annule », « laisse tomber », « oublie ça » et leurs équivalents anglais interrompent uniquement une action vocale en attente.
- L’annulation efface simultanément les clarifications d’appel, de numéro et de SMS.
- LIA confirme brièvement l’annulation et ne réinterprète pas la phrase comme un contact ou un texte de message.
- Les états temporaires sont effacés à l’arrêt de l’écoute, au passage en arrière-plan et au démontage de la surface LIA.
- Validation locale terminée : TypeScript strict PASS ; audits continuité, hygiène source, contrat backend, release, acceptation fonctionnelle et projet PASS ; 17/17 gates EAS ; 481/481 régressions.
- Exports Metro Android et iOS PASS, 902 modules chacun.
- Aucun build natif signé ni essai sur téléphone physique n’est revendiqué avant exécution réelle.
