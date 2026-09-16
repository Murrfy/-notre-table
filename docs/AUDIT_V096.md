# Audit V0.96 — notifications de bêta honnêtes

## P1 traité
Les réglages exposaient deux switches de notifications collaboratives (planning et courses) alors que l'application ne possède actuellement ni enregistrement de push token, ni serveur d'envoi push. Activer ces switches n'avait donc aucun effet réel.

## Correctifs
- valeurs collaboratives forcées à `false` dans les préférences de première bêta ;
- anciens réglages locaux normalisés ;
- switches affichés désactivés avec texte explicite « indisponible dans la première bêta » ;
- rappels locaux dîner/week-end conservés sans modification ;
- garde-fous statiques et tests ajoutés.

## Décision
Aucun système push distant n'est ajouté pendant le gel fonctionnel. Il pourra être conçu après la bêta si les retours utilisateurs justifient cette fonction.
