# Audit V0.98 — timeouts réseau

## P1 traité
Les imports URL/OCR utilisaient `fetch` sans limite temporelle. Une connexion ouverte mais silencieuse pouvait laisser l'interface en chargement indéfini. L'appel RevenueCat de suppression serveur avait le même risque avant les mutations locales.

## Correctifs
- helper `fetchWithTimeout` côté mobile ;
- URL recette : 15 secondes ;
- OCR : 20 secondes ;
- RevenueCat Edge : AbortController, 10 secondes ;
- garde-fous statiques et régressions.

## Décision
Le client de suppression de compte n'est volontairement pas interrompu par un timeout arbitraire après lancement de la requête, afin de ne pas créer un faux statut d'échec si le serveur termine une suppression irréversible.
