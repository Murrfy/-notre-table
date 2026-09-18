# Audit V0.275

Checkpoint **0.275.0**.

Le résultat confirmé d’un scan frigo/placard devient un contexte de session borné et local. Les images ne sont pas stockées dans ce contexte ; seules des étiquettes d’ingrédients et des correspondances de recettes dérivées localement y entrent. Les éléments incertains sont exclus et le contexte expire après 30 minutes.
