# Audit V0.91 — EAS dependency reproducibility fail-closed

Date: 2026-09-14

No product feature was added.

- Every actual EAS build now requires a committed `package-lock.json` before the build may proceed.
- `EAS_NO_FROZEN_LOCKFILE=1/true` is explicitly rejected, so EAS cannot silently switch away from immutable dependency installation.
- Gate tests cover the missing-lockfile and bypass-variable cases.
- This matches Expo's documented default immutable-lockfile behavior (`npm ci` for npm projects).

The current environment still cannot reach npm, so the real lockfile remains an external blocker rather than being fabricated.
