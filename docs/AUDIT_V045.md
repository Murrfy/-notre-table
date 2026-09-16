# Audit V0.45 — 2026-09-13

Objectif : réduire la charge visuelle de l’écran d’ouverture sans supprimer de capacité métier.

## Invariants ajoutés
- planning hebdomadaire replié par défaut ;
- ancien grand bloc « Aujourd’hui à table » non réintroduit en parallèle ;
- carte « Décider ensemble » non permanente ;
- accès direct aux courses depuis Aujourd’hui.

## Validation
`npm run verify` : PASS — 56 fichiers TS/TSX, 0 diagnostic de transpilation, 520 clés i18n alignées, 24/24 régressions, 0 violation de nom concurrent dans le runtime.
