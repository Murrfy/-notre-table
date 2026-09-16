# Audit V0.151 — authentification et profil single-flight

## Constat
Les états React de chargement empêchaient les taps suivants après rerender, mais plusieurs actions de compte/profil conservaient une courte fenêtre de double soumission avant ce rerender.

## Correction
- Connexion, inscription et e-mail de récupération : verrou partagé `authInFlight`.
- Nouveau mot de passe : verrou `submitInFlight`.
- Déconnexion : verrou `exitInFlightRef`.
- Photo de profil : verrou partagé `avatarInFlight`, acquis avant l’ouverture du sélecteur natif.
- Préférences du profil : verrou `prefsInFlight` + état `prefsSaving`, bouton désactivé et annoncé `busy`.
- Aucun changement produit, backend, navigation ou rendu visuel.

## Validation
- 163/163 régressions.
- 17/17 gates EAS.
- 83 TS/TSX, 0 erreur de transpilation.
- 631 clés EN avec parité.
- Hygiène source : 263 fichiers inspectés.
- Audits continuité, hygiène source, backend et release : PASS.
