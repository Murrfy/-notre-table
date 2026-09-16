# Audit V0.102 — RevenueCat test-fixture cleanup

Scope: P0/P1 release validation only; no product feature change.

## Defect corrected

A failing EAS gate fixture called `process.exit(1)` inside a helper guarded by `try/finally`. Because process termination bypassed normal JavaScript unwinding, the helper did not restore its temporary `react-native-purchases` dependency and fake `src/services/revenuecat.ts`.

V0.102 removes both artifacts, changes failed gate assertions to throw, verifies fixture restoration byte-for-byte after the suite, and adds audit invariants forbidding adapter/dependency orphan states.

## Baseline rule

V0.102 supersedes V0.99–V0.101 as the clean checkpoint. Production billing remains intentionally blocked until the real RevenueCat SDK and end-to-end wiring are installed and proven.
