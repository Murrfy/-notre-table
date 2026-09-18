# Audit V0.163 — identité vocale de LIA

- 3 candidates vocales A/B/C maximum, issues des voix natives disponibles dans la langue courante.
- Phrase d’audition identique pour éviter une comparaison biaisée.
- Prototypes de sourire / petit rire / rire bref audibles avant approbation.
- Changement de voix => approbation rire révoquée.
- Rire social => fail-closed sans approbation explicite.
- Aucun TTS cloud ajouté.
- Validation réelle de timbre/rendu : appareil physique obligatoire.

Résultats : **189/189 régressions**, **17/17 gates EAS**, **95 TS/TSX**, **745 clés EN**, audits continuité/hygiène/backend/release PASS ; hygiène source **303 fichiers**. Le vrai build natif installé et l’écoute sur appareil restent à prouver.
