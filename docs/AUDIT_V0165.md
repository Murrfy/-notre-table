# Audit V0.165

## Périmètre
- Setup LIA du nouveau foyer en deux questions : prénom organisateur + taille habituelle de la table.
- Aucun paywall dans cette étape et aucun contournement de la logique Famille pour les membres légers.
- Anciens foyers protégés : la nouvelle colonne `setup_completed` vaut `true` par défaut ; seuls les nouveaux foyers sont créés à `false`.
- `default_party_size` est réutilisé comme base de portions dans le planning.
- Migration additive `202609160015_household_lia_setup.sql` + RPC admin transactionnelle `complete_household_setup`.

## Validation locale
- 193/193 tests de régression : PASS.
- 17/17 gates EAS : PASS.
- 96 fichiers TS/TSX transpilés statiquement, 0 erreur.
- 767 clés anglaises avec parité des langues : PASS.
- Continuité, hygiène source, backend et release : PASS.
- Hygiène source : 307 fichiers inspectés.
- Contrat backend : 20 tables client / 16 RPC / 7 Realtime ; migrations 001 → 015.

## Limite non masquée
`node_modules` est absent dans cet environnement. Le vrai typecheck installé, les exports Expo natifs, Supabase distant et les tests multi-appareils ne sont donc pas revendiqués.
