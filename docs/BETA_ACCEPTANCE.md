# Bêta réelle — protocole d'acceptation sur appareils

Ce protocole ne remplace ni le smoke Supabase ni le build EAS. Il prouve le comportement humain réel sur **au moins deux appareils physiques** avec de vrais comptes de test et le backend de Preview.

## Préconditions

- build Preview EAS réellement terminé ;
- migrations Supabase réellement appliquées ;
- `light-response` réellement déployée ;
- comptes de test dédiés, jamais des comptes personnels ;
- mode démo non utilisé pour l'acceptation ;
- noter le commit/source revision et l'identifiant exact du build.

## Scénarios obligatoires

1. Confirmation d'inscription par deep link : le mail ouvre l'app et établit la session.
2. Mot de passe oublié : `notretable://auth/recovery` ouvre le flux, le nouveau mot de passe fonctionne.
3. Compte A → déconnexion → compte B : aucune donnée A ne reste visible ou rejouée.
4. Compte A → compte B direct : même isolation de session/cache.
5. Invitation foyer : A invite, B rejoint le bon foyer, le code ne peut pas être réutilisé.
6. Planning Realtime : modification sur A visible sur B sans rechargement destructif.
7. Courses Realtime : ajout/cochage sur A visible sur B.
8. Déconnexion réseau puis reconnexion : intentions hors-ligne rejouées une seule fois.
9. Changement de compte avec file hors-ligne : aucune intention de A n'est rejouée sous B.
10. Membre léger : le lien s'ouvre dans le navigateur sans app ni compte.
11. Présence Oui/Non/Peut-être : réponse possible en un clic.
12. Envie facultative : choix + présence en deux clics maximum.
13. « Surprends-moi » : un clic implique Oui sans autre question.
14. « Je prends les choses en main » : un seul gagnant ; aucune précision supplémentaire demandée.
15. Token consommé : un second envoi avec le même lien est refusé.
16. Synthèse organisateur : la réponse web remonte dans l'app via Realtime.

## Preuve

Copier `docs/beta-acceptance.example.json` vers `.validation/beta-acceptance.json`, renseigner uniquement des références non sensibles (ex. « vidéo 03 », « capture B-7 », « build EAS xyz »), puis exécuter :

```bash
npm run beta:acceptance:audit -- .validation/beta-acceptance.json
```

Le seul verdict accepté est `NOTRE_TABLE_BETA_ACCEPTANCE_PASS`. Le fichier `.validation/` reste hors Git afin d'éviter de publier des captures ou métadonnées de test par accident.


## Portée tablette
La bêta de base exige toujours deux appareils physiques mais n’impose pas un iPad. En revanche, tant que `ios.supportsTablet=true`, une validation iPad physique est requise avant soumission App Store Production.
