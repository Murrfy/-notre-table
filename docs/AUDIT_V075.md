# Audit V0.75 — runtime build aligné et preuves CI conservées

Aucune nouvelle fonction métier. Durcissement P1 de la lane de build.

- EAS `preview` et `production` héritent d’un profil `base` qui fixe Node **22.16.0** ;
- GitHub Actions utilise exactement la même version Node ;
- si `package-lock.json` existe, le runner utilise `npm ci` ;
- tant que le lockfile n’est pas encore commité, le premier runner réseau peut le générer avec `npm install` et l’exporter comme artifact ;
- les exports Expo iOS/Android de `validate:installed` sont conservés comme artifacts pendant 14 jours ;
- `release:audit` bloque toute divergence de runtime ou disparition de ces preuves.

Cela ne remplace pas un vrai build EAS signé. Le `projectId` Expo reste volontairement absent jusqu’à connexion d’un vrai projet.
