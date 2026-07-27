# Changelog

All notable changes to this package are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.2]

- Fixed a crash in `generateDesignTokens` when `primaryColor` was an unparseable or partial hex string (e.g. mid-edit in a color picker): `clampPrimaryForContrast` now validates the color before computing contrast instead of letting `culori`'s `wcagContrast` throw. Invalid input now degrades to a safe fallback instead of throwing.
- Fixed a stray trailing quote in the shadcn exporter's `--font-sans` value when the source font-family string was quoted (`shadcnExtras` in `export-tokens.ts`).
- Added unit tests for `skills.ts` and `export-tokens.ts`, plus regression tests covering the crash fix above.

## [0.1.1]

- Added `LICENSE` to the published tarball (was previously missing).
- Added `sideEffects: false` for correct tree-shaking in consumer bundlers.
- Fixed stale `README` "Source layout" section (wrong file casing, missing `skills.ts` entry) and other stale references (scope name, file link casing).
- Added `CHANGELOG.md`.
- Documented ESM-only status, `skills.ts` scope rationale, and the intentional silent-fallback behavior of the color-math helpers in `README.md`.
- Added unit tests for previously-untested pure functions in `color-utils.ts`, `color-generation.ts`, `contrast-utils.ts`, `accessibility.ts`, and config-driven constants in `generate-tokens.ts`.

## [0.1.0]

Initial release.

- OKLCH-first primitive ramp generation (`generateRamp`, `generateOklchRamp`,
  `generateNeutralRamp`) with Gaussian chroma distribution and gamut clamping.
- Semantic token mapping (`generateDesignTokens`) with WCAG-AA-aware
  foreground/background pairing and a primary-contrast guardrail.
- Exporters for CSS, [DTCG](https://design-tokens.github.io/community-group/format/)
  JSON, Tailwind, and shadcn-style themes (`exportTokens`).
- `generateTheme` one-shot convenience wrapper.
- WCAG AA contrast validation (`validateWcagAaContrast`) against 16 default
  semantic pairs.
- Agent-facing skill markdown generation (`generateSkills`) for
  tokens/theming, component creation, and accessibility guidance.
