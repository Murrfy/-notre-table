# Audit V0.245

- Base conservée : V0.244 ; aucune règle de LIA ou de Notre Table n’est supprimée.
- Objectif : une demande multi-étapes est conservée comme un seul objectif assistant.
- Contexte applicatif : LIA peut lire automatiquement les placards, recettes, planning, courses et Mémos pertinents.
- Cuisine avec stock : les recettes enregistrées peuvent être classées selon la couverture réelle du stock et les ingrédients manquants/insuffisants.
- Résilience : les sources de données sont lues avec `Promise.allSettled`; une source en échec est omise et n’est jamais remplacée par une supposition.
- Écritures : modifier le planning, ajouter les ingrédients manquants, créer un Mémo ou préparer un message famille reste une proposition avec confirmation.
- Contexte foyer : `MainScreen` transmet à LIA le foyer actif, la semaine affichée et le mode démo afin d’éviter un assistant détaché de l’état réel de l’application.
- Garde-fous V0.239–V0.244 conservés : identité LIA, surnoms consentis, confidentialité, preuves, limites de coût et absence de faux succès d’outil.
- Validation : **528/528 régressions PASS**, **17/17 gates EAS PASS**, audits continuité/hygiène/backend/release et matrice d’acceptation PASS, **178 fichiers TypeScript/TSX transpiles sans erreur**.
- Limite de preuve : le build Metro natif complet n’est pas revendiqué sans dépendances installées dans l’archive.
