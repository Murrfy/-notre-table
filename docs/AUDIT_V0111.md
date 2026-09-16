# Notre Table — Audit V0.111

Date: 2026-09-15

## Scope

First technical implementation of the product decision **“lightweight members without app installation”**, built additively on top of trusted checkpoint V0.110.

This checkpoint deliberately does **not** redesign the native household-onboarding flow yet: the product notes explicitly leave the exact mandatory/optional onboarding treatment to be finalized. V0.111 secures the backend and public response path first so the existing native product remains intact.

## Product contract preserved

- One organizer keeps the full native app.
- A lightweight member is identified by first/display name + phone number.
- The member needs no account, password or app installation.
- Presence choices: Yes / No / Maybe / **I’ll take care of it**.
- The organizer chooses which optional “Craving?” items are offered for that question; the list is not fixed.
- Supported beta options: home-cooked, pizza, pasta, sushi, Chinese, surprise me.
- Presence alone = one click.
- A regular craving + presence = two clicks.
- **Surprise me** implies presence Yes and is one click.
- **I’ll take care of it** is one click and never asks what the member will cook/order/do.
- After somebody takes charge, the public response page shows only that person’s name + the take-charge message; no implementation detail is exposed.

## Migration 012

`202609150012_light_members_response_foundation.sql` adds:

- `light_members` — household-scoped lightweight members;
- `light_meal_questions` — one question per household/date/meal with organizer-selected desire options;
- `light_response_tokens` — one token per question/member, **hash only** at rest;
- `light_meal_responses` — presence + optional desire response;
- `light_meal_responses` in Supabase Realtime;
- organizer RPCs:
  - `create_light_member(uuid,text,text)`;
  - `upsert_light_meal_question(uuid,date,text,text[],timestamptz)`;
  - `issue_light_response_token(uuid,uuid)`;
  - `get_light_meal_summary(uuid)`;
- server-only public-link RPCs:
  - `get_light_response_context(text)`;
  - `submit_light_response(text,text,text)`.

## Security properties

- 256-bit random response tokens (`gen_random_bytes(32)`).
- Only SHA-256 token hashes are stored in PostgreSQL.
- Tokens are bound to one lightweight member + one meal question.
- Tokens expire with the question and are one-use (`consumed_at`).
- Submission locks the token and question row before mutation.
- The first concurrent take-charge response wins; later responses are rejected with `QUESTION_TAKEN_OVER` until the organizer resets/reopens the question.
- Reconfiguring a question invalidates previous tokens **and responses**, preventing stale desires from surviving after an option is removed.
- Token hashes have no `anon`/`authenticated` table read privilege.
- Phone numbers are only selectable under the household-admin RLS policy.
- Public response context contains no phone number, household UUID or lightweight-member UUID.
- Public helper RPCs are executable by `service_role` only and reached through the Edge Function.

## Public Edge Function

`supabase/functions/light-response/index.ts` + `supabase/config.toml` provide the no-account response page.

- JWT verification is intentionally disabled **only for this function** because the responder has no Supabase account.
- The Edge Function itself uses the trusted server key to invoke the two service-only RPCs.
- Link format keeps the bearer token in the URL fragment (`#<token>`), so it is not sent in the initial HTTP URL and is not available to link-preview requests.
- The page immediately removes the fragment from browser history while retaining the token only in page memory.
- `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, CSP, no external scripts/assets.
- UI localized in French, English, Spanish and Hebrew; Hebrew uses RTL.
- No tutorial, account creation or installation prompt is inserted into the response path.

## Organizer aggregation

`get_light_meal_summary(uuid)` returns server-computed totals for:

- Yes / No / Maybe / Take charge;
- each allowed desire option;
- the name of the take-charge member, if any.

The endpoint is admin-only. Native organizer UI wiring is intentionally the next additive step rather than being guessed inside onboarding in this checkpoint.

## Local proof

- 101/101 regression tests.
- 16/16 EAS pre-install gate tests.
- Backend contract audit: PASS.
- Release audit: PASS.
- Project audit: 80 TS/TSX files transpiled, 0 transpile errors.
- Existing native client contract remains 18 client tables / 10 client RPCs / 6 native Realtime subscriptions; V0.111 adds a separate lightweight-response backend surface of 4 tables / 6 RPCs / 1 Realtime publication.

## Still external / not claimed

- Migration 012 has not yet been applied to a real Supabase project in this environment.
- The `light-response` Edge Function has not yet been deployed against a real Supabase project.
- No real WhatsApp/SMS automation is claimed; beta can begin with a manually shared link once native organizer wiring is added.
- npm lockfile / `npm ci`, strict installed `tsc`, Expo exports, EAS build, RevenueCat/Stores and multi-device testing remain external blockers exactly as before.
