# Audit V0.274

Checkpoint **0.274.0**.

LIA peut déclencher explicitement la surface de vision frigo/placard et l’ouverture caméra depuis une commande vocale directe. Le flux réutilise le pipeline photo existant, reste fail-closed si la vision n’est pas configurée et ne transforme jamais une détection visuelle en écriture persistante silencieuse.
