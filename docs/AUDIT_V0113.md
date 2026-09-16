# Notre Table — Audit V0.113

Date: 2026-09-15

## Scope

Release-engineering hardening only. No new product feature and no change to the V0.112 organizer UX.

## Delta

- `backend:live-smoke` now requires the deployed public `light-response` Edge Function.
- It verifies the HTML shell and security headers (`no-store`, `no-referrer`, frame denial/CSP).
- Lightweight-member context and submit are exercised through the real HTTP Edge path rather than by bypassing it with service-role RPC calls.
- One-use replay must return HTTP 410.
- Concurrent `take_charge` submissions run through the Edge Function and must produce exactly one HTTP 200 winner and one HTTP 409 refusal; the remaining valid link must see the winner name.
- Release documentation now requires **15/15 client RPCs** and explicit `light-response` deployment before the destructive smoke.

## External truth preserved

This checkpoint still does not claim that a remote Supabase project, Edge Function deployment, npm install, strict TypeScript run, Expo export or EAS build has passed. Those proofs require external infrastructure.

## Local proof

- `npm run verify`: PASS.
- Regression suite: **104/104**.
- EAS release-gate tests: **16/16**.
- Backend contract: **20 client tables / 15 client RPCs / 7 Realtime tables**.
- Project audit: **82 TS/TSX** transpiled with **0** transpile errors.
- Backend and release audits: **PASS**.

