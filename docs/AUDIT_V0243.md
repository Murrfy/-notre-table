# Audit V0.243

- Base conservée : V0.242 ; aucune règle validée de LIA n’est remplacée.
- Demande directe : une panne, un délai dépassé, une réponse vide ou une recherche non vérifiée reçoit une phrase brève et honnête.
- Pas de jargon : LIA ne parle ni de fournisseur, ni de timeout, ni d’erreur technique à la famille.
- Recherche : sans source assez sûre, LIA le dit explicitement au lieu d’improviser.
- Discrétion : une panne pendant une conversation ambiante reste silencieuse ; LIA n’interrompt pas la famille pour annoncer son propre problème.
- Confidentialité : une demande sensible défaillante reste silencieuse à table.
- Multilingue : les réponses de repli existent en français, anglais, espagnol et hébreu.
- Validation locale : TypeScript strict, audits continuité/hygiène/backend/release/acceptation et **17/17 gates EAS** PASS ; **514/514 régressions** PASS.
- Exports Metro : Android et iOS PASS avec **908 modules** chacun.
- Aucun fournisseur IA absent, résultat Web, build signé ou test physique n’est revendiqué.
