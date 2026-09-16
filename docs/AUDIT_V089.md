# Audit V0.89 — Supabase public key fail-closed

Supabase distingue désormais les clés publiques modernes `sb_publishable_*` des secrets `sb_secret_*`; les anciennes clés `anon` et `service_role` étaient toutes deux des JWT. Notre Table refuse donc volontairement tout JWT dans `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et exige le format moderne non ambigu.

Cette règle est appliquée au runtime mobile, au hook EAS pré-install et au smoke backend.
