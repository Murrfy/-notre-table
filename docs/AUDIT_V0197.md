# Audit V0.197

## Objet
Transformer la continuité V0.196 en aide concrète : LIA propose spontanément l’action utile puis ne l’exécute qu’après l’accord de l’organisateur.

## Invariants
- demander une heure manquante ne modifie rien et ne nécessite pas de confirmation ;
- alarme unique ou récurrente : confirmation obligatoire avant programmation ;
- rendez-vous sensible : préparation, alarme et suivi restent privés ;
- rappels hebdomadaires acceptent seulement des jours 1..7 et une heure valide ;
- reprogrammer un même `alarmId` annule l’ancien ensemble avant d’écrire le nouveau ;
- aucune permission Android d’alarme exacte restreinte ;
- le canal historique des rappels reste silencieux ; seul le canal LIA assistant explicitement accepté peut demander le son ;
- texte personnel/sensible sur notification = aperçu générique.

## Validation locale
- **276/276 régressions PASS**
- **17/17 gates EAS PASS**
- **132 fichiers TypeScript/TSX transpilés, 0 erreur**
- **958 clés de traduction EN**, parité validée
- **391 fichiers source** inspectés
- backend : **24 tables client / 17 RPC / 7 Realtime**
- migrations : **001 → 024**
- audits continuité / hygiène / backend / release / feature / accessibilité : **PASS**
