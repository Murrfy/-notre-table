# Release lane — Notre Table

The product scope is frozen for the first real beta. New product features do not enter this lane unless they fix a launch blocker.

## P0 order

Before executing a release stage, run `npm run release:doctor`. It writes `.validation/release-doctor.json` and reports blockers without printing secret values. `npm run release:doctor:strict` may be used on a trusted runner when blockers must fail the job.

1. **Installed validation on a networked runner**
   - use Node 22.16.0 + npm 10.9.2, matching the versioned release toolchain;
   - GitHub official actions must stay pinned to reviewed immutable commit SHAs; checkout credentials are not persisted;
   - `package-lock.json` is now committed from a successful network bootstrap; do not regenerate it casually;
   - normal validation requires that committed lockfile and installs only with `npm ci`;
   - if dependency manifests change, regenerate/update the lockfile on a trusted networked runner and prove the result again with `npm ci`;
   - `expo install --check` on the installed dependency graph;
   - `npm run typecheck`;
   - `npm run verify`;
   - Expo JS export for iOS and Android, preserved as CI evidence;
   - generate `.validation/release-evidence.json` containing SHA-256 hashes for release configuration, backend schema/migrations/functions and validation scripts, plus the committed lockfile hash.
2. **Real Supabase development project**
   - apply versioned migrations only;
   - deploy `light-response` from `supabase/functions/light-response` with `verify_jwt=false` exactly as versioned in `supabase/config.toml`;
   - deploy the authenticated `delete-account` Edge Function from `supabase/functions/delete-account`;
   - run `supabase/verify_backend.sql` for detailed diagnostics;
   - run `supabase/assert_backend.sql` and require `NOTRE_TABLE_BACKEND_ASSERTIONS_PASS`;
   - run `npm run backend:live-smoke` from a trusted environment with server-only credentials;
   - once RevenueCat Production billing is connected, deploy both `delete-account` and `sync-household-access`, set server-only Edge secrets `REVENUECAT_CUSTOMER_DELETION_ENABLED=true`, `REVENUECAT_SECRET_API_KEY` and `REVENUECAT_ENTITLEMENT_ID`, then rerun the smoke with `EXPECT_REVENUECAT_DELETION=true`;
   - require 15/15 client RPCs, the real `light-response` Edge path (HTML security headers → context → submit → anti-replay → take-charge race), Storage avatar RLS, cross-household read/write denial, invitation create/use concurrency, transactional meal mutation, privilege-boundary checks, shared/solo permanent account deletion and successful cleanup of all smoke data.
3. **Two-device family test**
   - two different accounts in one household;
   - planning and shopping collaboration;
   - disconnect / reconnect;
   - account switch and sign-out;
   - invitation deep link;
   - email signup confirmation deep link opens the app and establishes the session;
   - forgotten-password email opens `notretable://auth/recovery`, accepts a new password, then the new password signs in successfully.
   - record all required scenarios in `.validation/beta-acceptance.json` following `docs/BETA_ACCEPTANCE.md`;
   - require `npm run beta:acceptance:audit -- .validation/beta-acceptance.json` to print `NOTRE_TABLE_BETA_ACCEPTANCE_PASS`.
4. **Preview build**
   - EAS `preview` profile;
   - internal distribution only;
   - real Preview Supabase variables must be present; the EAS pre-install gate refuses an unconfigured backend;
   - beta acceptance tests must use the real-account path, not demo data.
   - Supabase Auth redirect allow-list must include the native `notretable://**` scheme before testing confirmation/recovery emails;
   - Production email delivery must not rely on Supabase's best-effort trial sender; configure a production SMTP provider before public launch.
5. **Production candidate**
   - EAS `production` profile;
   - demo mode disabled by runtime configuration;
   - real backend variables present in the EAS production environment;
   - RevenueCat App User ID must equal the authenticated Supabase user id of the payer; the effective entitlement must then be mirrored server-side in `household_access` so every member of that household receives the same access, and account deletion must erase the RevenueCat customer record;
   - switching authenticated accounts on the same device must call RevenueCat `logIn(newSupabaseUserId)` and prove CustomerInfo/entitlements switch with no carry-over;
   - the real-device test must cover A -> sign out -> B and A -> B direct account switching, with the RevenueCat App User ID and entitlement matching only the active Supabase user;
   - permanent account deletion must clear the RevenueCat SDK identity after server-side customer erasure so the deleted customer is not recreated;
   - Production purchase UI must be driven by RevenueCat CustomerInfo/Store Offerings, while effective access is synchronized into Supabase `household_access` for the whole household; local preview/trial cache is never subscription proof;
   - account deletion UI must warn that Store subscriptions continue until the user cancels them in Apple/Google;
   - store metadata/privacy/review.

## Hard rules

- Do not claim a native build passed until EAS/CI actually finishes successfully.
- Do not put a Supabase service-role or `sb_secret_*` key in `EXPO_PUBLIC_*`.
- Do not invent an Expo project ID. Connect a real Expo project first.
- Do not rewrite an already-applied SQL migration; add a new migration.
- Do not add product features to solve a release-engineering problem.

## Native privacy + brand assets (V0.119)
- Android must explicitly block `android.permission.RECORD_AUDIO`; Notre Table has no audio feature.
- Production must not ship with generic/default branding: `expo.icon` and `android.adaptiveIcon.foregroundImage` must be local versioned files and the adaptive icon must have a valid six-digit background color.
- Preview builds remain allowed before final brand assets are supplied so beta work can continue without inventing visual identity.


## Rappels locaux Android (V0.121)
- Android 13+ doit disposer d’un canal de notification avant la demande d’autorisation ; `notre-table-reminders-v1` est créé avant le flux de permission.
- Les rappels DAILY/WEEKLY utilisent explicitement ce canal sur Android.
- Le canal reste silencieux et sans vibration ; son nom suit la langue active de l’app.
- Cette configuration concerne uniquement les rappels locaux déjà disponibles ; elle n’active aucun push collaboratif distant.
- `SCHEDULE_EXACT_ALARM` et `USE_EXACT_ALARM` restent explicitement bloquées : les rappels tolèrent le fallback inexact d’Expo SDK 57 au lieu de demander un accès spécial Android.


## Permissions notifications iOS (V0.122)
- Les rappels locaux utilisent `ios.status` sur iOS et acceptent AUTHORIZED, PROVISIONAL et EPHEMERAL.
- Le booléen générique reste utilisé sur Android uniquement.


## Minimisation permission notifications iOS (V0.123)
- Notre Table ne demande que les alertes pour ses rappels locaux.
- Son et badge restent explicitement non demandés, cohérents avec le comportement runtime.


## Export compliance iOS (V0.124)
- `ios.config.usesNonExemptEncryption` doit rester explicitement `false` tant que le runtime n’introduit pas de cryptographie applicative non exemptée.
- Toute introduction future d’un tel mécanisme impose de réévaluer cette déclaration avant Production.


## Portée iPad (V0.125)
- `ios.supportsTablet=true` est une promesse de support, pas une preuve de QA.
- Avant App Store Production, exécuter au moins un parcours critique sur iPad physique si cette option reste vraie.
- Ne pas désactiver l’iPad silencieusement : toute réduction de portée reste une décision produit distincte.

## Zones sûres / edge-to-edge (V0.126)
- Expo SDK 57 est verrouillé sur `react-native-safe-area-context ~5.7.0`.
- Le runtime ne doit plus importer `SafeAreaView` depuis le cœur React Native.
- `App.tsx` fournit un `SafeAreaProvider` unique avant les providers applicatifs.
- `expo install --check` et les exports réels restent obligatoires dès que les dépendances peuvent être installées.

## Locale système au retour foreground (V0.127)
- Le runtime réévalue `expo-localization` au retour `AppState=active`.
- Ce garde couvre les changements de langue/région/calendrier effectués pendant que l’app est en arrière-plan.

## Accessibilité minimale des commandes texte (V0.128)
- Tout `Text` interactif (`onPress`) doit annoncer `accessibilityRole="button"`.
- Le contrôle est statique et fait partie de l’audit projet.



## Accessibilité des surfaces tactiles (V0.129)
- Tout `Pressable` interactif doit exposer une sémantique native (`accessibilityRole`) ; une surface purement décorative/de backdrop doit être explicitement exclue via `accessible={false}`.
- Le rendu visuel ne doit pas être modifié par ce garde.


## États accessibles des commandes (V0.130)
- Tout `Pressable` utilisant `disabled={...}` doit exposer le même état dans `accessibilityState.disabled`.


## États selected des choix persistants (V0.131)
- Les options qui représentent un choix actif doivent annoncer `accessibilityState.selected`; les cartes de navigation ne doivent pas être faussement marquées sélectionnées.


## Libellés accessibles des champs de saisie (V0.132)
- Tout `TextInput` doit exposer un `accessibilityLabel` stable, distinct d’un simple exemple de placeholder lorsque nécessaire.
- Les libellés doivent suivre la langue active lorsque la traduction existe.


## États expanded des disclosures (V0.133)
- Tout contrôle qui déplie/replie du contenu dans la même surface doit annoncer `accessibilityState.expanded`.
- Les boutons qui naviguent ou ouvrent une modale ne doivent pas recevoir cet état par défaut.
