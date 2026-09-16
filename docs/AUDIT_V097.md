# Audit V0.97 — endpoint OCR validé avant tout envoi photo

## P0 traité
Le projet possédait une validation centralisée des URLs publiques, mais `photoRecipeImport.ts` relisait directement la variable d'environnement OCR. Une mauvaise configuration pouvait donc contourner la règle HTTPS avant l'envoi d'une image utilisateur.

## Correctifs
- utilisation exclusive de `runtimeConfig.recipeOcrEndpoint` ;
- endpoint HTTP/invalide => OCR considéré non configuré, aucun envoi ;
- invariant global interdisant les lectures `process.env.EXPO_PUBLIC_*` hors de `runtimeConfig` ;
- régressions sur URL HTTPS, URL non sécurisée et absence de bypass.

## Limite
Le service OCR réel reste optionnel et aucun endpoint externe n'est configuré dans cet environnement.
