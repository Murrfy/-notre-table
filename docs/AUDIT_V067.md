# Audit V0.67 — mutation safety

Date: 2026-09-14

No product feature was added.

## Shopping mutation safety
- each shopping item has an in-flight mutation lock;
- a second tap on the same item is ignored until the first mutation completes;
- manual item creation is locked while one submission is in flight;
- UI gives a loading state instead of accepting a duplicate add.

## Offline identity isolation
- pending shopping writes are keyed by household + week + authenticated user;
- account A's offline intent cannot be replayed automatically while account B is active on the same device;
- repeated offline check/uncheck gestures still collapse to one final desired state per item.

## Validation
- static product/release/backend audits: PASS;
- 71 TS/TSX runtime files transpiled;
- 0 transpilation diagnostics;
- 546 i18n keys with FR/EN/ES/HE parity;
- 46/46 regression tests passed.

Native build/typecheck is still pending on a runner that can install npm dependencies.
