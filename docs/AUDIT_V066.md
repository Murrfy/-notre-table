# Audit V0.66 — Realtime lifecycle

Date: 2026-09-14

No product feature was added.

## Goal
Prevent collaborative subscriptions from surviving a context change and prevent late async responses from repainting stale data.

## Changes
- Planning channel topic includes household + week.
- Planning presence channel includes household + current day.
- Presence screen channel includes household + day.
- Recipe taste channel includes household + recipe.
- Recipe taste now removes the Supabase channel from the client on cleanup.
- Presence screen uses the shared request gate; an old load cannot update an unmounted/replaced screen.
- Household dashboard profile/activity loads are guarded against late responses.
- Existing Shopping channels remain week-scoped and cleaned with `removeChannel`.

## Guardrails
The static audit fails if:
- Planning/Presence/RecipeTaste channel scoping regresses;
- a collaborative screen creates a Supabase channel without `removeChannel(channel)`;
- RecipeTaste falls back to socket-only `unsubscribe()`.

## Validation
Local `npm run verify` must pass before this checkpoint is packaged. Native build remains pending on a networked runner because `node_modules` cannot be installed in this container.
