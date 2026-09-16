# Audit V0.103 — household-scoped subscription access

## Scope

Release-hardening only. No new end-user feature was added. This checkpoint aligns the already chosen Family subscription model with backend authorization.

## Changes

- Added migration `202609140009_household_subscription_access.sql`.
- Added RLS-protected `public.household_access` with authenticated read-only access for members of the same household.
- Added trusted `sync-household-access` Supabase Edge Function using server-side RevenueCat credentials.
- Production `loadAccessState` now synchronizes/reads household access from Supabase and never uses local preview storage as entitlement proof.
- RevenueCat outage behavior preserves the last server-verified state rather than writing a false downgrade.
- Account deletion detaches a deleting payer and preserves only a known, unexpired paid period for remaining household members.
- EAS/release/backend audits and live-smoke source invariants were extended accordingly.

## Local evidence

- Backend contract: 18 client tables, 9 client RPCs, 6 Realtime tables.
- Regression suite: 80/80.
- EAS gate suite: 16/16.
- Static TS/TSX transpilation audit: 77 files, 0 errors.
- Release/backend audits: PASS.

## Still external / not claimed

- No real Supabase migration or Edge Function deployment has run from this environment.
- No real RevenueCat project/Store products or native SDK are connected.
- `node_modules` and `package-lock.json` are still absent because the npm registry remains unreachable here.
- No real Expo export, EAS build, or two-device test is claimed.
