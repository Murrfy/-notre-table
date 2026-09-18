# Supabase — Notre Table

Backend contract prepared in V0.55.

## Source of truth

- `migrations/202609140001_initial_schema.sql`: versioned initial migration for a new empty project.
- `schema.sql`: current schema snapshot used for review/audits.
- `verify_backend.sql`: read-only post-deployment checks.
- `assert_backend.sql`: fail-closed backend assertions.
- `functions/delete-account/index.ts`: authenticated permanent account-deletion endpoint; privileged credentials stay server-side.
- `functions/sync-household-access/index.ts`: authenticated RevenueCat-to-household entitlement synchronizer; only the server writes billing state.
- `migrations/202609150012_light_members_response_foundation.sql`: lightweight-member response model, one-use token contract and organizer aggregation.
- `migrations/202609160017_lia_memos_child_age_optional.sql`: private LIA Mémos plus optional child age in the family-sheet RPC.
- `functions/light-response/index.ts`: public no-account response page; it delegates data access to service-role-only RPCs.
- `config.toml`: explicitly sets `verify_jwt = false` only for `light-response`, because lightweight responders have no Supabase account.

Future SQL changes must be added as a new migration rather than rewriting an already-applied migration.

## Mobile configuration

The mobile app accepts only:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never put `service_role`, `sb_secret_*`, database passwords, JWT secrets, or other privileged credentials in `EXPO_PUBLIC_*` variables or in the repository.

## Real deployment sequence (when an authorized project exists)

1. Apply versioned migrations to a fresh/staging Supabase project.
2. Deploy `delete-account`, `sync-household-access` and `light-response`; never expose their privileged keys to the app. `light-response` must remain the only no-account function and uses the checked-in `verify_jwt = false` function config.
   - before Production billing, set Edge secrets `REVENUECAT_CUSTOMER_DELETION_ENABLED=true`, `REVENUECAT_SECRET_API_KEY=<server secret>` and `REVENUECAT_ENTITLEMENT_ID=family`;
   - `sync-household-access` verifies the RevenueCat customer server-side and mirrors access into `public.household_access`; clients have read-only RLS access to their own household row;
   - the RevenueCat App User ID contract is the Supabase Auth user id of the payer; the entitlement itself belongs to the household;
   - deleting the RevenueCat customer erases RevenueCat customer data but does not cancel App Store / Google Play subscriptions.
3. Configure the publishable URL/key and the deployed deletion endpoint URL in the app environment.
4. Run `verify_backend.sql`, then `assert_backend.sql`.
5. Run the live smoke: it must exercise the 10 existing native client RPCs, RLS/Storage, concurrency and the deployed account-deletion endpoint. Separately test migration 012 + `light-response` with an organizer-issued link, one normal response, replay rejection, expiry, and a concurrent take-charge race. Once RevenueCat deletion is enabled, run with `EXPECT_REVENUECAT_DELETION=true` and require RevenueCat erasure proof.
6. Test with at least two real authenticated accounts in the same household and one account outside that household.
7. Only after those checks, use the backend for a beta build.

No real Supabase deployment is claimed yet.

- `migrations/202609160018_household_delivery_address.sql`: optional household delivery address used as Commander’s default destination without blocking existing households.

- `migrations/202609160019_commander_favorites.sql`: private per-user Commander restaurant favorites, stored independently from LIA Mémos.

## Commander sponsored provider boundary (V0.172)
- V0.172 n'ajoute aucune migration ni Edge Function publicitaire.
- Le contrat sponsorisé est côté application et reste désactivé tant qu'une intégration commerciale vérifiée n'est pas explicitement configurée.
- Les données sponsorisées ne doivent jamais être injectées dans le classement naturel.
