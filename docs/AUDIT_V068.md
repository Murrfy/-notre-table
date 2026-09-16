# Audit V0.68

Checkpoint pré-bêta consacré au parcours d'invitation.

- migration `202609140003_harden_invitations.sql`;
- génération cryptographique des codes ;
- création idempotente tant qu'une invitation live existe ;
- code à usage unique / expiration 7 jours ;
- UI verrouillée pendant mutation ;
- smoke backend étendu.

Le vrai smoke Supabase reste à exécuter contre un projet distant.
