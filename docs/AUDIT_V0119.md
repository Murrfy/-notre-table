# AUDIT V0.119 — privacy native et assets Production fail-closed

Aucun changement produit. Ce checkpoint réduit la surface native et empêche une release Production visuellement incomplète.

- Android bloque explicitement `android.permission.RECORD_AUDIO`; Notre Table n’enregistre aucun son.
- `expo-image-picker` garde `microphonePermission: false` côté iOS.
- Le release doctor expose désormais l’état du blocage audio et des assets de marque.
- Le gate EAS Production exige une icône locale/versionnée et un adaptive icon Android local/versionné avant de pouvoir déclarer la Production prête.
- Preview et développement ne sont pas bloqués par l’absence temporaire de ces assets de marque.
- Validation finale locale : **127/127 régressions**, **17/17 gates EAS**, **82 TS/TSX**, audits continuité/hygiène/backend/release PASS ; **229 fichiers** couverts par le manifest de provenance.
