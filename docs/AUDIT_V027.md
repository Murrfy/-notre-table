# Audit V0.27 — 2026-09-13

## Objet
Compléter « qui mange ? » avec des invités temporaires sans compte.

## Invariants vérifiés statiquement
- table `meal_guests` liée à `meal_plans` avec suppression en cascade ;
- RLS limité aux membres du foyer du repas ;
- lecture/écriture intégrée au service planning ;
- sauvegarde des invités avant l’événement final `meal_plans` afin que les collaborateurs relisent un état cohérent ;
- copie de semaine précédente incluant les invités ;
- parité i18n fr/en/es/he.

## Limite
Le schéma Supabase n’est toujours pas exécuté sur une base de développement dans cette session : migration réelle à tester avant publication.
