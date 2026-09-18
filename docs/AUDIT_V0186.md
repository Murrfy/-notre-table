# Audit V0.186

## Changement
Le release doctor modélise désormais explicitement les preuves bêta physiques.

## Fail-closed
- `.validation/beta-acceptance.json` doit passer le gate 16 scénarios.
- `.validation/feature-beta-acceptance.json` doit passer le gate 53 scénarios.
- Une absence ou un échec reste BLOCK.
- Aucun contenu sensible du fichier de preuve n’est imprimé.
