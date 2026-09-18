# Audit V0.158 — langue d'abord, LIA dès le premier contact

## Objectif
Faire du choix de langue la toute première décision explicite de Notre Table, puis laisser LIA se présenter avant l'authentification et la création du foyer.

## Parcours
- Le premier lancement charge d'abord les préférences locales puis affiche `LanguageFirstScreen` tant qu'aucune langue n'a été explicitement choisie.
- La langue de l'appareil sert uniquement de présélection lorsqu'elle fait partie des langues réellement supportées ; elle n'est pas considérée comme un consentement implicite au choix.
- Le choix est persisté séparément via `@notre-table/language-chosen-v1` afin de distinguer une vraie sélection utilisateur du fallback système.
- Après validation, `LocaleProvider.setLanguage` bascule immédiatement l'interface puis LIA se présente sur l'écran suivant.
- LIA explique dès le départ son contrat : comprendre l'objectif, proposer une aide utile, mémoriser le contexte utile et accompagner jusqu'à la cuisine/la table, tout en laissant la décision à l'utilisateur.

## Langues
- V0.158 n'affiche au premier écran que les quatre langues déjà intégralement localisées dans le runtime : français, anglais, espagnol, hébreu.
- Italien, portugais brésilien et arabe restent une extension internationalisation validée au niveau produit, mais ne seront pas affichés avant que l'ensemble de l'interface et des parcours critiques soit réellement traduit et testé.
- Le support RTL existant reste utilisé pour l'hébreu ; l'arabe héritera de la même architecture lorsqu'il sera activé.

## Garde-fous
- Langue avant onboarding LIA, authentification ou création du foyer.
- Une seule étape de présentation LIA : pas de carrousel tutoriel.
- Choix de langue accessible sous forme de radios, avec état sélectionné exposé aux lecteurs d'écran.
- La langue reste modifiable ensuite dans Réglages.
- Aucun microphone ni synthèse vocale n'est activé automatiquement par ce nouveau parcours.

## Validation
- Audit projet : PASS.
- Régressions après ajout du parcours : 177/177 PASS.
- La validation complète de release doit encore être exécutée après alignement de la documentation et du checkpoint V0.158.
