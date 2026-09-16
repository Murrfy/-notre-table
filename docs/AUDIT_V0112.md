# Notre Table — Audit V0.112

Date: 2026-09-15

## Scope

Native organizer wiring for the already validated **lightweight members without installation** product direction. V0.112 is additive on V0.111: it does not redesign the historical household onboarding and does not replace any previously secured family-planning flow.

## Organizer flow added

From a meal in Planning, the household administrator can open **Ask the family** and:

- view lightweight members already attached to the household;
- add a member with display name + phone number;
- edit a member;
- deactivate/reactivate a member without deleting response history;
- choose exactly which optional “Craving?” choices are offered for that meal;
- create/update the meal question;
- manually share a personal response link through the phone share sheet;
- see the server-computed response summary;
- receive Realtime refreshes when lightweight responses change.

No paid or automated SMS/WhatsApp transport is introduced. The beta path remains manual sharing, as previously decided.

## Data / backend delta

Migration `202609150013_light_member_management.sql` adds the authenticated organizer RPC:

- `update_light_member(uuid,text,text,boolean)`.

The RPC:

- requires authentication;
- requires household admin permission;
- remains behind the Family-plan server entitlement;
- validates name/phone lengths;
- updates name, phone and active state while preserving historical rows.

The existing V0.111 token/public-response security model is unchanged.

## Native client delta

New service `src/services/lightParticipation.ts` encapsulates:

- lightweight member reads/create/update;
- question read/upsert;
- one-time response-token issuance;
- response-link construction;
- admin summary reads;
- Realtime subscription to lightweight responses.

New screen `src/screens/LightParticipationScreen.tsx` provides the organizer UI.

`PlanningScreen` exposes the entry point from the selected meal rather than inventing a mandatory onboarding step before that UX has been finalized.

## Product behavior preserved

- Optional desire list is built by the organizer, not fixed.
- A lightweight responder still needs no account or app installation.
- Presence alone remains one click.
- A regular desire + presence remains two clicks.
- “Surprise me” remains one-click Yes.
- “I’ll take care of it” remains one click with no follow-up detail.
- If desire choices are changed after responses exist, the organizer sees an explicit reset warning before reissuing the question; stale responses are not silently retained.
- Deactivated members remain in history but cannot receive a fresh share action from the native screen.

## Local proof

`npm run verify` on V0.112:

- environment preflight: PASS;
- backend contract audit: PASS;
- release audit: PASS;
- EAS pre-install gate: **16/16**;
- project audit: **82 TS/TSX** transpiled, **0** transpile errors;
- localization: **621** English keys with parity checks;
- regression suite: **101/101**.

Backend contract reported by the audit:

- 20 client tables;
- 15 client RPCs;
- 7 Realtime tables;
- migrations 001 → 013 present.

## Still external / not claimed

- Migrations 012/013 have not been applied to a real Supabase project in this environment.
- The `light-response` Edge Function has not been deployed against a real Supabase project.
- No real end-to-end phone-share → browser-answer → organizer-Realtime test has run on physical devices.
- npm lockfile / `npm ci`, installed strict `tsc`, Expo exports, EAS build, RevenueCat/Stores and multi-device validation remain external blockers.
- The precise first-run onboarding treatment that makes household-member entry difficult to skip is still intentionally not invented here; it remains a separate UX decision.
