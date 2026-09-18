# Audit V0.248

- Base conservée : V0.247 ; aucune règle validée n’est remplacée.
- Objectif assistant : `family.prepare_message` entraîne désormais la lecture `family.read` et reste marqué `requiresConfirmation:true`.
- Contexte : LIA peut connaître les membres actifs et leur joignabilité, sans inclure les numéros de téléphone dans les faits envoyés au moteur IA.
- Politique : foyer, liste de destinataires et corps du message sont obligatoires ; les doublons sont supprimés et l’absence de confirmation échoue fermée.
- Exécution : les identifiants sont revalidés avec `fetchLightMembers`, les règles `familyMessageCapabilities` et un numéro nettoyé réellement disponible.
- Geste final : `composeLiaDeviceMessage` ouvre seulement le composeur système ; aucun envoi automatique n’est ajouté.
- Cohérence : si un destinataire choisi ne peut plus être résolu exactement, l’action échoue au lieu d’omettre cette personne silencieusement.
- Validation : **539/539 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **180 TS/TSX transpiles sans diagnostic**.
