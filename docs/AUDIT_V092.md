# Audit V0.92 — Store privacy/account-deletion compliance gate

Date: 2026-09-14

No product feature was added; this closes store-review blockers.

- Production now requires an HTTPS authenticated account-deletion API endpoint.
- Production also requires an HTTPS external account-deletion web resource for Google Play disclosure.
- Production requires an HTTPS privacy-policy URL.
- The in-app privacy screen exposes the configured privacy policy and external deletion resource.
- The account-deletion service now consumes the canonical validated runtime endpoint instead of reading raw environment input directly.
- Placeholder and non-HTTPS values fail closed.

Apple requires apps supporting account creation to offer account deletion in-app. Google Play requires an in-app deletion path plus an external web resource, and a privacy policy accessible from the app/store listing.
