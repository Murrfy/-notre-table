# Audit V0.6

## Changements vérifiés
- Semaine centralisée dans MainScreen : planning et courses restent sur la même semaine.
- Navigation semaine précédente/suivante dans Planning et Courses.
- Liste de courses partageable via la feuille de partage native.
- Suppression des articles cochés.
- Recherche recettes par titre, tag ou ingrédient.
- Détail recette avec ingrédients et étapes.
- Agrégation SQL corrigée : les quantités inconnues restent NULL au lieu de devenir 0.
- Versions package/app alignées sur 0.6.0.
- Contrôle syntaxique TypeScript/TSX effectué sur tous les fichiers : 0 diagnostic de syntaxe.

## Non vérifié à ce stade
- Build Expo complet : dépendances non installées dans l’environnement de travail.
- Connexion réelle Supabase : aucun projet Supabase branché.
- Tests sur appareil réel.
