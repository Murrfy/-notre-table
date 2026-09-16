# Audit V0.48 — premier contact

- Aucun ajout fonctionnel métier.
- Onboarding : un seul écran, un seul CTA, aucune pagination/étape locale.
- `TableMark` original partagé par onboarding, authentification et splash.
- Suppression de la carte pédagogique redondante sur l’écran de création/rejoindre un foyer.
- Parité i18n FR/EN/ES/HE requise.
- Garde-fous : pas d’emoji décoratif ni retour d’un carrousel onboarding.
- Validation locale : `npm run audit` puis `npm run regression`.
- Le build Expo natif complet reste distinct et n’est pas revendiqué tant que les dépendances ne sont pas installées dans l’environnement.
