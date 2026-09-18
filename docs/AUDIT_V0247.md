# Audit V0.247

- Base conservée : V0.246 ; aucune règle validée n’est remplacée.
- Première présentation : wording existant inchangé et couche vocale existante conservée.
- Seconde présentation : `LiaSecondIntroScreen` prononce exactement `lia.secondIntro` avec `getPreferredLiaVoice` + `speakLia`.
- Continuité de voix : le même identifiant de voix préféré est réutilisé ; aucun profil vocal concurrent n’est créé.
- Accessibilité : aucune auto-lecture si VoiceOver/TalkBack est actif ; contrôle manuel Écouter/Arrêter accessible.
- Sortie d’écran : la synthèse est arrêtée avant `onDone` et au démontage.
- Nouveau contrôle classifié : budgets d’accessibilité passent à 188 Pressable, 54 désactivables et 37 avec état busy.
- Validation : **535/535 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **180 TS/TSX transpiles sans diagnostic**.
- Limite de preuve : la qualité réelle de la voix doit toujours être validée sur appareil natif ; aucun rendu audio final n’est revendiqué dans cet environnement.
