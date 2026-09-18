# Bêta fonctionnelle Commander + LIA — V0.185

Ce protocole transforme la matrice V0.184 en **preuve réelle**. Il ne remplace pas `BETA_ACCEPTANCE.md`; les deux sont complémentaires.

## Générer le fichier de preuve

```bash
npm run feature:beta:template
```

Le fichier est créé dans `.validation/feature-beta-acceptance.json` avec les **53 scénarios en `pending`**.

## Pour obtenir un PASS

- utiliser un build réel identifié ;
- renseigner la révision source ;
- tester sur au moins deux appareils physiques ;
- passer les 53 scénarios `required` ;
- joindre pour chacun une courte référence de preuve non sensible ;
- ne jamais mettre de confidence, capture privée, donnée santé ou secret dans le JSON.

Puis :

```bash
npm run feature:beta:audit -- .validation/feature-beta-acceptance.json
```

Le seul verdict accepté est `NOTRE_TABLE_FEATURE_BETA_ACCEPTANCE_PASS`.

**Important :** ce gate n'est pas dans `npm run verify`, car une validation locale ne doit jamais pouvoir se faire passer pour une bêta physique.
