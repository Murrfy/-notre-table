# Audit V0.160 — présence sociale et rire de LIA

## Objectif
Ajouter le moteur comportemental qui permet à LIA de partager ponctuellement un rire avec la famille sans transformer Notre Table en écoute permanente ni en « laugh track ».

## Ce qui est implémenté
- `src/lib/liaSocialPresence.ts` décide entre `none`, `smile`, `chuckle` et `laugh`.
- Session LIA explicitement active obligatoire.
- Consentement micro obligatoire dans le contrat comportemental.
- Classificateur sonore local obligatoire ; aucun fallback d'écoute ambiante cloud.
- Seuil de confiance rire : 0,78.
- Silence minimal après le rire : 350 ms.
- Cooldown minimal entre réactions : 45 s.
- Budget social : Discrète 0, Présente 2/10 min, Animatrice 3/10 min.
- Parole humaine / interruption / contexte sensible annulent toute réaction.

## Confidentialité et état natif
- Détection prévue sur appareil uniquement.
- iOS : Apple Sound Analysis / `SNClassifySoundRequest`.
- Android : MediaPipe Audio Classifier avec modèle local.
- Le module natif n'est pas encore branché dans V0.160.
- `android.permission.RECORD_AUDIO` reste donc bloqué et aucune permission micro n'est demandée par ce checkpoint.

## Limites
Ce checkpoint valide le **cerveau social** et son contrat de sécurité, pas encore la captation/classification native sur appareil ni la restitution d'un rire audio final. Ces éléments exigeront un build natif et des tests réels sur iOS/Android.

## Validation
- 183/183 régressions PASS.
- 17/17 gates EAS PASS.
- 92 fichiers TypeScript/TSX transpilés sans diagnostic.
- 716 clés EN avec parité des langues actives.
- Audits continuité/hygiène/backend/release PASS.
- Hygiène source : 285 fichiers inspectés.
- Limite maintenue : `node_modules` absent ; aucun vrai `tsc` installé, export Expo, permission micro native ni test appareil n’est revendiqué.
