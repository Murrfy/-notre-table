# Audit V0.26 — 2026-09-13

## Objet
Finaliser la fondation clair/sombre avant le redesign visuel futur.

## Vérifications
- réglage Automatique / Clair / Sombre persistant ;
- `Appearance.setColorScheme()` utilisé au niveau application ;
- palette centralisée dans `src/theme.ts` ;
- parité i18n fr/en/es/he ;
- aucun nom de concurrent dans le runtime ;
- aucune nouvelle couleur UI codée directement dans les écrans (les couleurs HTML du PDF restent volontairement fixes pour un document imprimable lisible).

## Limite
Le contrôle local est un audit de transpilation TypeScript et de règles statiques. Le build natif Expo complet reste à exécuter dans un environnement avec dépendances installées.
