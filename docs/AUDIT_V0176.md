# Audit V0.176

## Périmètre
- Providers organiques multiples.
- Dédoublonnage exact des restaurants multi-sources.
- Providers de livraison multiples en cascade.
- Conservation de plusieurs chemins de commande vérifiés.

## Garde-fous
- Sponsorisé toujours séparé du naturel.
- Rayon commun toujours plafonné à 10 km.
- Une source secondaire ne remplace pas silencieusement la vérité de livraison canonique.
- Seules les lignes `delivery=unknown` atteignent un provider de livraison suivant.
- Aucune source réelle supplémentaire n'est activée par défaut.

## Validation
- Validation locale : **225/225 régressions**, **17/17 gates EAS**, **111 TS/TSX** sans erreur de transpilation, **905 clés EN** avec parité, audits continuité/hygiène/backend/release PASS ; hygiène source **339 fichiers** ; backend **22 tables client / 17 RPC / 7 Realtime**, migrations **001 → 020**.
- Aucun provider réel supplémentaire, déploiement distant, build installé ou appareil physique n’est revendiqué.
