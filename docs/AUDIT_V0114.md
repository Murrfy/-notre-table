# Notre Table — Audit V0.114

Date: 2026-09-15

## Scope

Release-engineering hardening only. No product change.

## Delta

- Package toolchain is versioned as Node 22.16.x / npm 10.9.x with `packageManager: npm@10.9.2`.
- Environment preflight now fails if the Node release runtime drifts from 22.16.0 and, when invoked through npm, if npm drifts from 10.9.2.
- GitHub official actions are pinned to immutable reviewed commits rather than mutable major tags.
- Workflows declare least-privilege `contents: read` and checkout does not persist GitHub credentials.
- `.validation/` is gitignored so Expo export evidence remains an artifact, not source.

## External truth preserved

No npm install, strict typecheck, Expo export, EAS build, Supabase deployment, RevenueCat connection or real-device test is claimed by this checkpoint.

## Provenance evidence

- `npm run release:evidence` writes `.validation/release-evidence.json`.
- The manifest hashes release configuration, workflows, Supabase schema/assertions, every migration, every Edge Function and validation scripts.
- On a real CI runner it also records `GITHUB_SHA`, `GITHUB_RUN_ID` and the committed `package-lock.json` SHA-256.
- Both normal validation and first-lockfile bootstrap generate the manifest before preserving artifacts.

## Local proof

- `npm run verify`: PASS.
- Regression suite: **110/110**.
- EAS release-gate tests: **16/16**.
- Backend contract: **20 client tables / 15 client RPCs / 7 Realtime tables**.
- Project audit: **82 TS/TSX** transpiled with **0** transpile errors.
- Backend and release audits: **PASS**.
- Local release evidence hashed **35** critical files; local manifest correctly reports the lockfile as absent rather than fabricating one.
