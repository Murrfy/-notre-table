# AUDIT V0.127 — rafraîchissement de la langue système Android

Aucun changement produit. Le contexte de localisation ne doit pas conserver indéfiniment une ancienne valeur native après un changement dans les réglages système.

- `LocaleContext` observe `AppState`.
- Au retour `active`, un compteur de révision force une nouvelle résolution `getLocales()` / `getCalendars()`.
- Le listener est supprimé au démontage.
- Le choix manuel de langue/mesure continue de fonctionner comme avant.
## Validation locale
- Régressions : **137/137**
- Gates EAS : **17/17**
- TS/TSX transpilés : **82**, 0 erreur
- Audits continuité / hygiène / backend / release : **PASS**

