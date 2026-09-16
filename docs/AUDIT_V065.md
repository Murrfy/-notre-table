# Audit V0.65 — session, production lane and backend integrity

Date: 2026-09-14

No new product feature was added. This checkpoint only reduces launch risk.

## Session safety

- initial `getSession()` cannot overwrite a newer auth event;
- switching from one authenticated user to another invalidates any in-flight household load;
- token refresh for the same user no longer forces an unnecessary household reload;
- sign-out explicitly uses Supabase `scope: 'local'`, so signing out on one phone does not intentionally sign out every other device;
- household data is cleared immediately when identity changes.

## Production safety

- runtime lane: `development | preview | production`;
- demo mode is allowed in development/preview and disabled in production;
- a production build with missing Supabase configuration shows a blocking configuration error instead of silently falling back to demo;
- EAS preview/production profiles are defined without inventing an Expo project ID.

## Release validation

- `npm run release:audit` validates versions, bundle IDs, EAS lanes and production/demo guardrails;
- `.github/workflows/validate.yml` is ready for a networked runner to install dependencies and execute the full installed validation;
- no claim is made that the native build passed in this container.

## Backend integrity

- migration `202609140002_guard_last_admin.sql` prevents deletion/demotion of the last administrator of an active household;
- `npm run backend:live-smoke` is ready for a trusted environment and tests invitation, two-member collaboration, cross-household RLS isolation and the last-admin guard;
- privileged service-role credentials are required only by the smoke-test process and must never be exposed through `EXPO_PUBLIC_*`.

## Offline queue

- the shopping check/uncheck queue uses a pure compaction helper;
- repeated gestures on one article keep only the final intended state before reconnect;
- this behavior is covered by regression tests.

## Validation result

`npm run verify`:

- preflight: PASS;
- backend contract audit: PASS;
- release audit: PASS;
- 71 TS/TSX runtime files transpiled;
- 0 transpilation diagnostics;
- 546 translation keys with FR/EN/ES/HE parity;
- 0 competitor-name violation in runtime;
- 45/45 regression tests passed.

## Remaining hard blocker

`node_modules` is still absent because this runtime cannot resolve the npm registry. Therefore a true `tsc` pass and Expo iOS/Android exports are still pending on a networked CI/EAS runner.
