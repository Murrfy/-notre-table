# Audit V0.280

Checkpoint **0.280.0**.

Le mode cuisine expose un handler de session éphémère au moteur vocal global. Seules les commandes locales reconnues par le moteur cuisine sont interceptées ; les autres capacités LIA continuent leur routage habituel. Aucun second flux microphone n’est créé.
