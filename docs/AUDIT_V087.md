# Audit V0.87 — copy_previous_week sous concurrence

Aucun ajout produit et aucune migration SQL.

Le smoke Supabase réel exécute `copy_previous_week` simultanément depuis deux membres du même foyer sur la même semaine cible. La preuve exige :

- succès des deux appels ;
- un seul slot cible `dinner` ;
- exactement les deux participants de la semaine source ;
- exactement l'invité de la semaine source.

Le but est de prouver sur PostgreSQL/Supabase le comportement concurrent déjà fourni par l'UPSERT/contrainte unique, sans ajouter un verrou redondant au backend.
