# Audit V0.157 — abonnement durable et budget LIA

## Objectif
Transformer la discussion tarifaire en contrat testable : une seule LIA, trois durées d’abonnement, et un contrôle explicite du coût IA par foyer.

## Tarification
- Références business : 6,99 USD / mois, 34,99 USD / 6 mois, 59,99 USD / an.
- Les trois durées débloquent le même niveau de LIA.
- Le paywall supporte `monthly`, `semiannual` et `annual`.
- En Production, aucun prix de référence n’est utilisé comme fallback : un package Store localisé doit exister.

## Économie LIA
- `src/lib/liaEconomics.ts` calcule un coût à partir de compteurs d’usage et de tarifs fournis au runtime.
- Les tarifs fournisseurs ne sont pas codés en dur dans l’application.
- Cible interne de conception : 1 USD / foyer actif / mois en moyenne.
- Palier économie à 0,75 USD ; protection de marge à 1 USD.
- Une aide essentielle reste autorisée même après le palier de protection ; les routes coûteuses non essentielles sont les premières réduites.
- La projection flotte est testée explicitement : 10 000 foyers × 1 USD = 10 000 USD/mois.

## Garde-fous
- Pas de différence cachée de qualité entre mensuel, six mois et annuel.
- Pas de conversion FX artisanale en Production.
- Pas de quota utilisateur visible dérivé du budget interne.
- Les coûts doivent être recalibrés avec les tarifs réels des fournisseurs et les données bêta avant lancement commercial définitif.

## Validation
- Régressions ajoutées pour la grille à trois durées et l’économie LIA.
- Vérification complète : audits continuité/hygiène/backend/release PASS ; 17/17 gates EAS ; 89 fichiers TS/TSX transpilés sans erreur ; 711 clés EN avec parité ; 176/176 régressions PASS.
- Limite maintenue : `node_modules` absent ; aucun vrai `tsc` installé ni export Expo iOS/Android n’est revendiqué dans cet environnement.
