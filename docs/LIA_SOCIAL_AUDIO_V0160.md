# LIA — présence sociale et rire — V0.160

## Intention
LIA peut participer à l'ambiance familiale quand un mode vocal social est **explicitement activé**. Un rire détecté ne déclenche jamais automatiquement un rire : LIA attend la fin du rire, un vrai silence et vérifie qu'aucun humain ne reprend la parole.

## Politique comportementale
- quelqu'un parle → LIA se tait immédiatement ;
- un humain reprend la parole pendant une réaction en attente → réaction annulée ;
- un rire isolé n'oblige jamais LIA à répondre ;
- niveau `Présente` : au plus 2 réactions de rire sur 10 minutes ;
- niveau `Animatrice` : au plus 3 réactions sur 10 minutes ;
- niveau `Discrète` : aucune réaction vocale au rire ;
- délai minimal de 45 secondes entre deux réactions ;
- pas de rire dans un contexte marqué sensible ;
- LIA peut avoir un petit sourire vocal, un petit rire ou un rire bref selon le contexte, mais jamais de « laugh track » mécanique.

## Confidentialité
La détection du rire doit être **locale sur l'appareil**. Aucun audio ambiant de la famille ne doit être envoyé au cloud simplement pour décider si LIA doit rire. Le cloud peut recevoir une intention explicite ou un extrait vocal uniquement dans un flux séparé, consenti et nécessaire à une fonction demandée.

Le micro n'est actif que si :
1. l'utilisateur a activé une session LIA Cuisine / À table ;
2. la permission micro a été accordée ;
3. l'indicateur d'écoute est visible ;
4. le traitement local est disponible.

Si le classificateur local n'est pas disponible, LIA ne remplace pas silencieusement cette fonction par une écoute cloud.

## Chemin natif retenu
- **iOS** : Apple **Sound Analysis** / `SNClassifySoundRequest` + flux micro local pour reconnaître notamment le rire.
- **Android** : **MediaPipe Audio Classifier** avec modèle local et flux micro local.
- Le runtime React Native reçoit uniquement un événement sémantique minimal (`laughter`, confiance, intensité), pas la conversation brute.

## État V0.160
Le moteur décisionnel est implémenté dans `src/lib/liaSocialPresence.ts` et testé. Il définit consentement, seuil de confiance, délai post-rire, cooldown, budget de réactions, priorité à la parole humaine et suppression en contexte sensible.

Le module natif de classification sonore **n'est pas encore branché** dans V0.160. Par conséquent, Android `RECORD_AUDIO` reste volontairement bloqué dans `app.json` : aucune permission micro ne doit être demandée tant que le vrai détecteur local n'est pas intégré et testé sur appareil.
