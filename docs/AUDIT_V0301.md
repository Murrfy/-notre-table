# Audit V0.301

Checkpoint **0.301.0**.

V0.301 permet à LIA de réutiliser plus tard certains petits souvenirs relationnels appris explicitement, mais uniquement dans une conversation directe marquée comme privée. Le mode table ne reçoit aucun souvenir personnel de ce mécanisme.

Les faits rapides de V0.300 sont filtrés par foyer et par identité stable. Sans personne nommée, une demande sur parfum, couleur ou shampoing ne charge que les faits de l’organisatrice. Les faits d’un autre membre ne deviennent pertinents que si ce membre est clairement nommé. Aucun souvenir sensible n’est injecté.

Lorsqu’aucun souvenir n’est directement pertinent, un seul petit rappel complice peut être proposé au modèle, au maximum une fois toutes les 24 heures. Cette mémoire reste optionnelle : LIA peut l’ignorer si elle ne rend pas la réponse meilleure et ne doit jamais s’en servir pour lancer une nouvelle série de questions.
