# Audit V0.12 — Cohérence du planning démo

## Bug corrigé
Le planning démo conservait l'état du composant lorsqu'on changeait de semaine, ce qui pouvait faire apparaître des repas d'une semaine sur une autre.

## Correction
- Cache local du planning indexé par foyer + lundi de la semaine.
- Sauvegarde locale après ajout, modification et suppression d'un repas.
- Navigation entre semaines recharge la bonne semaine.
- « Réutiliser la semaine précédente » lit réellement la semaine précédente en mode démo et copie les repas à +7 jours.

Cette correction rend le parcours démo cohérent avec la logique future Supabase.
