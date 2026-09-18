# Audit V0.242

- Base conservée : V0.241 ; aucune règle validée de LIA n’est remplacée.
- Délais bornés : conversation simple 8 s, raisonnement complexe 15 s, recherche avec outils 20 s.
- Annulation : le signal d’arrêt est transmis au fournisseur dès l’expiration du délai.
- Panne contenue : expiration et erreur fournisseur deviennent des états typés et ne cassent pas la conversation de table.
- Coût : un tour utilisateur déclenche au maximum un appel fournisseur ; aucune relance payante automatique n’est ajoutée.
- Local d’abord : une action déterministe locale sort avant la vérification d’un fournisseur IA.
- Validation locale : TypeScript strict, audits continuité/hygiène/backend/release/acceptation et **17/17 gates EAS** PASS ; **508/508 régressions** PASS.
- Exports Metro : Android et iOS PASS avec **907 modules** chacun.
- Aucun fournisseur IA absent, résultat Web, build signé ou test physique n’est revendiqué.
