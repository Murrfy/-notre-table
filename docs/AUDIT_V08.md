# Audit V0.8 — Import de recettes par URL

## Benchmark produit vérifié
- AnyList : import web, partage familial et calendrier repas avec synchronisation.
- Paprika : import de recettes depuis le web, puis synchronisation recettes/listes/planning.
- Mealime : flux principal planifier → générer la liste → cuisiner ; partage familial moins natif.

## Décision Notre Table
Importer un lien doit rester très court :
1. coller l’URL ;
2. extraire les données structurées `Recipe` (Schema.org/JSON-LD) ;
3. afficher un aperçu entièrement modifiable ;
4. enregistrer uniquement après validation humaine.

Aucune recette n’est sauvegardée automatiquement après le simple collage d’un lien.

## Implémenté
- lecture des blocs JSON-LD `application/ld+json` ;
- recherche récursive d’un objet `Recipe` ;
- titre, photo, temps, portions, tags, ingrédients et étapes ;
- conversion des durées ISO 8601 ;
- parsing prudent quantité/unité ;
- classement simple par rayon ;
- conservation de l’URL source ;
- aperçu/correction avant sauvegarde ;
- fonctionnement possible en mode démo sans Supabase.

## Limites assumées
- certains sites bloquent les requêtes ou n’exposent pas de données Recipe structurées ; dans ce cas l’import échoue proprement et rien n’est enregistré ;
- aucun contournement de paywall ou de restriction d’accès ;
- le parsing d’ingrédients reste heuristique et doit être vérifié par l’utilisateur.

## Étape suivante
Photo/OCR avec le même principe : extraction → aperçu/correction → validation.
