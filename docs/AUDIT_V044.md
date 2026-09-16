# Audit V0.44 — friction zéro

Date : 2026-09-13

## Objectif
Réduire encore la charge visuelle sans supprimer de capacité fonctionnelle et sans ajouter de nouvelle fonction métier.

## Recettes
- le bouton `+` devient l’unique entrée pour créer/importer une recette ;
- création manuelle, import URL et import photo restent disponibles dans un sélecteur contextuel ;
- seuls les filtres essentiels sont visibles par défaut ;
- durée, difficulté et tags restent dans un panneau de filtres avancés replié.

## Courses
- l’ajout manuel et la liste remontent dans le flux principal ;
- placard, « qui fait les courses ? », partage texte, PDF et nettoyage des coches sont regroupés sous **Outils de courses** ;
- la carte pédagogique sur le fonctionnement hors-ligne est retirée de l’écran principal ; l’état de synchronisation reste présent dans l’en-tête.

## Planning
- suppression de la carte récapitulative explicative ;
- absence de bannière permanente quand tout le monde est présent ;
- la répartition de cuisine ne remonte que lorsqu’il existe un déséquilibre ou un repas sans responsable.

## Garde-fous
`npm run audit` vérifie désormais que :
- les choix de création/import de recette restent derrière une action unique ;
- les filtres avancés restent repliés ;
- les cartes d’import ne réoccupent pas la bibliothèque ;
- les outils de courses restent repliés ;
- la carte pédagogique hors-ligne ne revient pas devant la liste ;
- le résumé explicatif du planning reste supprimé ;
- la charge cuisine n’est affichée que lorsqu’elle est actionnable.

## Validation exécutée
- 56 fichiers TypeScript/TSX transpilés ;
- 0 erreur de transpilation ;
- 509 clés anglaises avec parité FR/ES/HE ;
- 24/24 tests de régression réussis ;
- 0 nom de concurrent dans le runtime ;
- 0 alerte heuristique de texte UI français codé en dur.

Cette validation ne remplace pas un build Expo natif complet ni l’exécution du schéma sur un Supabase de développement.
