# Audit V0.294

Checkpoint **0.294.0**.

V0.294 étend LIA sans créer de second assistant ni de second pipeline vocal.

## Message famille
- Cinq choix actifs uniquement : Fait maison, Pizza, Pâtes, Sushi, Chinois.
- Tableau nominatif partagé avec compteurs et coche visible par membre.
- Réponse modifiable jusqu’à expiration du lien.
- « Je m’occupe de tout » reste un état séparé avec un seul responsable à la fois.
- Les vues tokenisées exposent les prénoms et décisions nécessaires au tableau, jamais les numéros de téléphone.

## Guidage LIA
- Première utilisation : explication courte de Message famille.
- Ensuite : silence si la personne avance normalement.
- Blocage prolongé : aide contextuelle, une étape à la fois.
- Fait maison : réaction naturelle et accompagnement du choix.
- Prise en charge du repas : LIA informe l’organisatrice et cesse les relances d’organisation pour ce repas.
- Humour contextuel autorisé, jamais obligatoire.

## Profil familial progressif
- Aucun nouvel élément obligatoire dans le formulaire d’inscription.
- LIA peut compléter progressivement des informations utiles ; V0.294 inaugure les anniversaires.
- Jour et mois suffisent, année facultative.
- Une initiative au maximum tous les deux jours ; même cible reposée au plus tôt après quatorze jours.
- « Plus tard » reporte trente jours ; un refus explicite clôt la demande.
- La réponse vocale passe par la clarification du moteur LIA existant et peut être donnée sans répéter « LIA ».
- L’anniversaire est enregistré seulement après une réponse explicite de l’utilisateur.
