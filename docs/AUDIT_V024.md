# Audit V0.24 — International + IP foundation

## Fixed
- Expo SDK 57 dependency mismatch: `expo-keep-awake` corrected to recommended `~57.0.1`.
- Week start no longer hard-coded to Monday; follows device calendar first weekday.
- Paywall no longer pretends a converted/local store price: EUR values are explicitly reference prices until RevenueCat returns storefront prices.
- Recipe service/schema mismatch fixed: `source_language` is now present in SQL RPC/schema.
- Canonical `ingredient_key` added to recipe ingredients and shopping items for cross-language merging.
- Canonical preference key columns added to schema to match client code.
- Difficulty and aisle storage moved toward language-neutral codes.
- Core meal-type/week-navigation labels localized.
- IP guardrail document added.

## Verification limits
- TypeScript/TSX syntax/transpilation is checked locally.
- Full native Expo build is still pending an environment where project dependencies can be installed and Expo Doctor/build can run.
- SQL is reviewed structurally but has not yet been executed against a live Supabase instance.
