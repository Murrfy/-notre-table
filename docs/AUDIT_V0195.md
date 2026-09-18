# Audit V0.195

## Objet
Faire de LIA un premier vrai socle relationnel et opérationnel sans supposition : fiche personnelle protégée, dictée confirmée, messagerie familiale adaptée à l’âge et accompagnement concret pendant la cuisson.

## Invariants relationnels
- aucune référence couple/divorce/partenaire sans situation enregistrée dans la fiche ;
- aucune modification de fiche depuis une dictée sans confirmation explicite ;
- âge et téléphones manquants non bloquants, valeurs invalides toujours rejetées ;
- sujets sensibles jamais transformés en blague de table ;
- Android reste sans dictée micro tant que le gate natif existant n’est pas levé ;
- iOS exige les permissions micro + reconnaissance vocale au moment d’une action utilisateur explicite.

## Messagerie famille par âge
- aucun téléphone enregistré = aucun lien externe envoyé ;
- enfant <16 ans : petit mot libre seulement ; aucun choix repas, aucune question de présence, aucun « Je m’en charge » ;
- enfant de 16 ans : choix repas + petit mot ; aucune question de présence et aucun « Je m’en charge » ;
- enfant de 17 ans et plus : présence + choix repas + « Je m’en charge » + petit mot ;
- pour les moins de 17 ans, la présence à la maison est implicite côté réponse et n’est jamais demandée dans l’interface ;
- le petit mot est borné à 500 caractères et remonte à l’organisateur avec le nom du membre ;
- « Surprends-moi » conserve son comportement historique en un clic.

## Cuisine avec LIA
- LIA reste visible dans le mode cuisson et accompagne l’étape courante ;
- un chrono n’est proposé que si une durée explicite existe dans la recette ; aucune durée n’est inventée ;
- le chrono est lancé uniquement par une action explicite de l’utilisateur ;
- les étapes contenant du sel déclenchent uniquement un conseil prudent (« progressivement »), sans modifier la recette ;
- une future question relationnelle pendant un temps mort reste interdite si quelqu’un parle, si le moment est sensible ou si LIA vient déjà de questionner la personne.

## Validation locale
- **269/269 régressions PASS**
- **17/17 gates EAS PASS**
- **129 fichiers TypeScript/TSX transpiles, 0 erreur**
- **958 clés de traduction EN, parité langues validée par l’audit**
- **385 fichiers source inspectés par l’audit d’hygiène**
- backend : **23 tables client / 17 RPC / 7 Realtime**
- migrations : **001 → 023**
- audits continuité / hygiène / backend / release / feature / accessibilité : PASS

## Limite de validation
`node_modules` n’est pas installé dans cet environnement. Le vrai `tsc --noEmit` installé et les exports Expo iOS/Android restent donc hors de ce checkpoint ; le preflight le signale explicitement et ne les présente pas comme validés.
