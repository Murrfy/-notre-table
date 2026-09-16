# Audit V0.154 — états busy complets

## Constat
Plusieurs contrôles déjà désactivés pendant une mutation asynchrone n’exposaient pas encore `accessibilityState.busy`.

## Correction
- Réactions recette : `busy:busy`.
- Membres légers : édition, activation, partage, sauvegarde et préparation annoncent `busy`.
- Avatar : choix et suppression annoncent `busy`.
- Coche courses : annonce `busy` pendant la mutation serveur.
- Contrat statique : 21 Pressables avec état `busy`.
- Aucun changement produit, backend, navigation ou rendu visuel.

## Validation
- 164/164 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Hygiène source : 266 fichiers inspectés.
- Audits continuité, hygiène source, backend et release : PASS.
