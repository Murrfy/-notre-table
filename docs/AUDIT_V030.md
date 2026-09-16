# Audit V0.30 — 2026-09-13

## Objet
Renforcer la collaboration familiale sans ajouter un chat.

## Contrôles
- table `household_activity` sous RLS ;
- écriture uniquement par triggers serveur ;
- lecture limitée au foyer ;
- événements sans nom personnel recopié dans `details`, l’acteur restant une référence supprimable/anonymisable ;
- export de portabilité inclut uniquement les activités dont l’utilisateur est l’acteur.

## Audit
0 diagnostic de transpilation et parité i18n conservée.
