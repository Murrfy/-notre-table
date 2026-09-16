# Notre Table — International architecture baseline

## Principle
International is a foundation, not a later translation pass. Shared household data and user interface language are separate concerns.

## What is localized per member
- interface language;
- date/number/currency formatting;
- metric/imperial display;
- first day of week;
- 12/24-hour clock;
- LTR/RTL direction;
- future Store/RevenueCat subscription price returned by the user's storefront.

Each household member may therefore use a different language without changing the household's shared records.

## What remains canonical in shared data
Technical enumerations are language-neutral codes:
- meal types: `breakfast`, `lunch`, `dinner`, `snack`;
- difficulty: `easy`, `medium`, `hard`;
- aisles: `produce`, `fresh`, `meat_fish`, `pantry`, `frozen`, `drinks`, `other`;
- units: canonical codes such as `g`, `kg`, `ml`, `l`, `cup`, `oz`, `lb`;
- diet/allergy matching uses canonical keys, not displayed wording.

## User-authored content
Recipe titles, preparation steps, notes and manually-entered shopping text are stored in the language supplied by the user. We never silently overwrite the original with a translation.

For recipes we retain `source_language`. A later translation layer may cache a translated view per user, while the original stays intact.

## Ingredient semantic keys
`ingredient_key` is a language-neutral semantic key used for matching and merging. Example: the visible words `lait`, `milk`, `leche` and `חלב` can resolve to the canonical key `milk`.

This prevents two family members using different languages from creating duplicate shopping lines merely because the labels differ.

## Week boundaries
The original French MVP assumed Monday. International builds use the device calendar's `firstWeekday` from `expo-localization`; Expo documents Sunday=1 through Saturday=7. The app converts that to JavaScript's Sunday=0 through Saturday=6.

## Subscription pricing
Never convert the French 4.99 EUR reference price ourselves and present it as a local Store price. Production pricing must come from Apple/Google through RevenueCat so currency, tax presentation and storefront pricing remain correct. Until RevenueCat is connected, the paywall explicitly labels the EUR amount as a reference price.

## Current launch-language status
Enabled today: French, English, Spanish, Hebrew. The translation layer has English fallback and is structured so more languages can be added without changing stored household data.

Priority candidates after product validation: German, Italian, Portuguese, then markets chosen from actual acquisition/retention data.

## Global brand invariant
The product name is **Notre Table** in every locale. UI copy, descriptions and notifications are translated, but the brand itself is not translated to “Our Table”, “Nuestra Mesa”, etc. This keeps app-store identity, word-of-mouth and future trademark work consistent across territories.

## Translated recipe views
International members may need to read a recipe that was authored in another language. Translation is therefore modeled as a **separate view**, never as a mutation of the original recipe.

`recipe_translations` stores a cached title, ingredient-name view and preparation steps for a target language. It also stores a `source_hash` so a stale translation can be ignored after the original recipe changes. Household clients can read eligible translations through RLS; generation is intended to come from a trusted provider-neutral translation endpoint/service role later.

If no translation exists, the original content remains fully usable and visible. This design lets translation be added or changed without a data migration or loss of the user's original recipe.

## Cross-language shopping labels
Generated shopping lines retain the original recipe label and an `ingredient_key`. For keys in Notre Table's own starter lexicon, the visible shopping label can be rendered in each member's language while quantity, unit and merge semantics remain shared. Unknown ingredients safely fall back to the original wording.

The starter lexicon is deliberately small and original. It is not a scraped competitor dataset. It can later be supplemented by a provider-neutral semantic normalization service without changing the stored data model.
