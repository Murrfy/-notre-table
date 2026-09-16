# Audit V0.29 — 2026-09-13

## Objet
Ajouter la photo de profil sans rendre les images publiques.

## Vérification externe
Supabase Storage vérifié : en React Native, l’upload doit utiliser un ArrayBuffer issu du base64 ; les buckets privés sont soumis aux politiques RLS et les URL signées nécessitent SELECT.

## Choix de sécurité
- bucket privé `profile-avatars`;
- chemin `<user_id>/<fichier>`;
- upload/suppression par le propriétaire ;
- lecture seulement par le propriétaire ou un membre partageant son foyer ;
- aucune `service_role` dans le client.

## Audit
0 diagnostic de transpilation et parité i18n conservée.
