# AUDIT V0.115 — release doctor

## Portée
Aucun changement produit. Ce checkpoint automatise la détection des blocages externes sans exposer de secrets.

## Ajouts
- `scripts/release-doctor.cjs` ;
- `npm run release:doctor` (informatif, écrit `.validation/release-doctor.json`) ;
- `npm run release:doctor:strict` (fail-closed si un blocage subsiste) ;
- diagnostic séparé : installed validation/CI, Supabase dev, EAS preview, Production billing/Stores ;
- aucune valeur de clé ou secret n'est imprimée.

## Règle
Le doctor ne transforme jamais un état « configuré » en preuve de déploiement ou de build. Les validations distantes restent obligatoires.
