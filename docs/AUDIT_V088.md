# Audit V0.88 — isolation de session pendant replay Shopping

Correction P1 sans fonction produit nouvelle.

Risque : une file hors-ligne appartient à l'utilisateur qui l'a créée, mais un replay déjà lancé peut chevaucher une déconnexion/changement de compte.

Durcissement : avant chaque mutation distante, le replay compare l'utilisateur courant au propriétaire de la clé de file. En cas de différence ou d'absence de session, il s'arrête et réécrit les opérations restantes dans la file d'origine.
