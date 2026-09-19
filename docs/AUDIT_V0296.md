# Audit V0.296

Checkpoint **0.296.0**.

Le moteur d’enrichissement progressif de LIA peut désormais apprendre un deuxième fait familial après les anniversaires : le plat préféré d’une personne. Le formulaire initial reste inchangé et court.

Les anniversaires restent prioritaires dans la file de faits manquants. Les questions de profil conservent la même cadence globale d’au moins 48 heures, les mêmes reports/refus et le même pipeline vocal. Un plat préféré n’est enregistré qu’après une réponse explicite, jamais déduit d’un clic ou d’un choix ponctuel dans Message famille.

Le fait est persisté côté backend avec contrôle d’accès : l’utilisateur peut enrichir son propre profil ; l’administratrice du foyer peut enrichir un membre léger. À l’approche d’un anniversaire, ce goût peut être utilisé comme simple piste conversationnelle, sans créer automatiquement repas, rappel, achat, réservation ou planning.
