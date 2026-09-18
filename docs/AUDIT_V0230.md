# Audit V0.230

- Conversation de table reliée au LiaOrb existant.
- STT/diarisation et génération de réponse derrière adaptateurs réels : aucune disponibilité simulée.
- Rythme, sujet, appel direct, silence, questions ouvertes et invalidation des réponses obsolètes.
- Bridges vers notifications/rappels et Mémos existants.
- Parole brute et pistes locuteurs : session-only, effacées au stop/background.
- Limite connue : aucune dépendance native STT/diarisation n'est installée dans ce checkpoint ; node_modules absent dans l'environnement de validation.
