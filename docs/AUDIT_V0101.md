# Audit V0.101 — confirmation email et récupération de mot de passe

## Risque traité
Supabase Auth exige par défaut une vérification email et les emails de récupération redirigent vers l'application. Avec `detectSessionInUrl:false`, normal en React Native, Notre Table ne traitait pas encore ces retours. Un compte pouvait donc être créé sans parcours mobile complet de confirmation/récupération.

## Correction
- redirect signup vers `Linking.createURL('auth/callback')`;
- reset via `resetPasswordForEmail(..., { redirectTo })`;
- parse des fragments/query et des routes de schéma natif ;
- support `setSession`, `exchangeCodeForSession` et `verifyOtp`;
- écran de changement de mot de passe via `updateUser({password})`;
- tests de parser et invariants release.

## Preuve externe restante
Le projet Supabase réel doit autoriser `notretable://**`, envoyer réellement les emails et être testé sur appareil. Pour le lancement public, un SMTP de production doit remplacer l'expéditeur d'essai/best-effort.
