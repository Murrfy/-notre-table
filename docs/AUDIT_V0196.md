# Audit V0.196

## Objet
Donner à LIA une continuité quotidienne réelle : elle peut garder un sujet ouvert, attendre le bon moment, revenir avec une aide concrète et ne pas dépendre d’une nouvelle question de l’organisateur.

## Invariants
- un fil ouvert est structuré (`reminder`, `follow_up`, `offer_help`) et ne stocke jamais un transcript complet ;
- les fils appartiennent au compte authentifié via RLS ;
- pause LIA, parole humaine et contexte social priment toujours sur une relance ;
- au moins quatre heures entre deux relances du même fil ; maximum trois surfaces ignorées ;
- un sujet personnel ou sensible n’apparaît jamais dans une surface partagée ;
- une notification de fil ouvert n’ouvre jamais une demande surprise de permission système ;
- une notification personnelle/sensible doit passer par la voie privée ;
- la sélection favorise d’abord les rappels dus, puis les suivis, puis les propositions d’aide ;
- à l’ouverture de l’app, une relance ordinaire peut être affichée puis immédiatement comptée comme surface.

## Backend
- migration `202609170024_lia_open_loops.sql` ;
- table privée `lia_open_loops` avec RLS propriétaire ;
- index utilisateur/échéance et foyer/échéance ;
- trigger `updated_at` ;
- schéma snapshot et listes de migrations synchronisés.

## Validation locale
- **273/273 régressions PASS**
- **17/17 gates EAS PASS**
- **131 fichiers TypeScript/TSX transpilés, 0 erreur**
- **958 clés de traduction EN**, parité langues validée
- **389 fichiers source** inspectés par l’audit d’hygiène
- backend : **24 tables client / 17 RPC / 7 Realtime**
- migrations : **001 → 024**
- audits continuité / hygiène / backend / release / feature / accessibilité : **PASS**

## Limite
Le moteur stocke et sélectionne les fils ouverts. La création automatique depuis une conversation libre dépendra de l’orchestrateur conversationnel LIA ; V0.196 ne prétend pas qu’un LLM tourne en arrière-plan en continu.
