# Notre Table — Intellectual-property guardrails

## Product rule
Benchmark competitors to identify user problems and market expectations. Do not reproduce a competitor's protected expression.

Every feature must be documented internally as:
1. user problem;
2. generic/market pattern observed across products;
3. Notre Table's independent solution;
4. original copy, layout, interaction details and implementation.

## Never copy into the repository
- competitor source code or decompiled code;
- screenshots used as implementation assets;
- competitor illustrations, icons, photography, recipes or editorial content;
- competitor onboarding/paywall text, slogans, help text or store descriptions;
- distinctive screen layouts copied substantially screen-for-screen;
- proprietary datasets or scraped recipe libraries.

## Allowed product research
- compare publicly visible feature categories;
- read public support pages and user reviews to identify unmet needs;
- study common interaction patterns that are functional/industry-standard;
- record facts about market positioning and user complaints with source/date;
- design an independent workflow to solve the underlying problem.

## Originality requirements for Notre Table
- own visual identity and design system;
- own information architecture and navigation decisions;
- own wording in every language;
- own family collaboration model (member identities, voting, cook/attendee roles, household preferences);
- own data model and backend implementation;
- user-owned/imported recipes rather than copied competitor content.

## Naming and release clearance
Before public release in each major territory:
- run trademark clearance for `Notre Table` / localized brand candidates in relevant app/software/service classes;
- check domain/app-store naming conflicts;
- obtain specialist IP counsel for a final trademark/design/patent-risk review if the product is commercially material;
- keep dated design files, commits and product-decision notes to evidence independent development.

## Patent caution
Feature ideas that sound unusually technical or specific should be checked before implementation if they could plausibly be covered by active patents. Do not infer freedom to operate simply because a feature exists in several apps.

## Competitor references in the codebase
Competitor names should stay in research/strategy notes only. User-facing product copy and runtime code should not depend on a competitor's branding or terminology.

## Automated repository guardrail
`npm run audit` scans runtime TypeScript/TSX source and fails if competitor brand names are found under `src/`. Research references remain permitted in `docs/` only. The same audit also verifies translation-key parity and the global `NOTRE TABLE` brand invariant.

See `docs/ORIGINALITY_LOG.md` for dated product decisions framed as user problem → generic pattern → independently designed Notre Table solution.
