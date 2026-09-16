# Audit V0.90 — Production billing configuration fail-closed

Date: 2026-09-14

No product feature was added. This is release hardening only.

## What changed
- Production billing now requires both platform-specific RevenueCat public SDK keys plus an entitlement identifier.
- Apple public SDK key must be `appl_*`; Google public SDK key must be `goog_*`.
- RevenueCat secret `sk_*` keys are rejected from public mobile configuration.
- Runtime config exposes the same canonical validation for the future RevenueCat adapter.
- `.env.example` documents only public mobile RevenueCat values.
- EAS gate regression coverage includes missing billing config, secret-key rejection, and the still-missing real adapter/SDK dependency.

## Still blocked
- No RevenueCat project/account/product/offering is connected in this environment.
- `react-native-purchases` is intentionally not added until an installed validation can resolve and typecheck it on a networked runner.
- Production therefore remains fail-closed.
