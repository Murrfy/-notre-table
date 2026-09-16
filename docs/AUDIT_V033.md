# Audit V0.33

- Ajout du placard partagé (`PantryScreen`, service local/Supabase, type `PantryItem`).
- RLS prévue pour `pantry_items`.
- RPC `upsert_pantry_item` et génération de courses tenant compte du stock.
- Quantités déduites seulement à unité compatible ; article sans quantité = marqueur explicite « en stock ».
- Les articles manuels restent intacts.
- Audit runtime après intégration : 48 fichiers TS/TSX, 0 diagnostic de transpilation, parité i18n fr/en/es/he, 0 nom de concurrent dans `src/`.
- SQL non exécuté sur un projet Supabase réel : migration à tester avant release.
