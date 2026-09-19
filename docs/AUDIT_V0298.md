# Audit V0.298

Checkpoint **0.298.0**.

LIA reprend désormais le fil quand tous les destinataires réels d’un Message famille ont répondu. Le déclenchement dépend uniquement des destinataires effectivement présents dans le tableau, jamais de tous les membres théoriques du foyer.

La synthèse reste informative : LIA peut rappeler les choix nominatifs et la direction « facile / épater » déjà confirmée, mais elle ne transforme pas des préférences divergentes en décision automatique et ne commande, ne planifie ni n’achète rien sans demande explicite. Une prise en charge « Je m’occupe de tout » bloque cette relance. Le mécanisme est dédupliqué par ronde et se réarme seulement après un nouvel état incomplet.
