# Audit V0.146 — saisie structurée cross-platform

## Constat
Les champs heure de rappel et date d’expiration utilisaient `keyboardType="numbers-and-punctuation"`, valeur disponible uniquement sur iOS.

## Correction
- `number-pad` sur les deux plateformes.
- Formatage automatique de l’heure vers `HH:MM`.
- Formatage automatique de la date vers `YYYY-MM-DD`.
- `maxLength` natif de 5 et 10 caractères.
- Validation métier existante conservée.

## Validation
- 158/158 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 630 clés EN avec parité.
- Audits continuité, hygiène source, backend et release : PASS.
