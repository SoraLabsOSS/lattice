# Changelog

All notable changes to this package are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- Added curated `BRAND_PRESETS` (seed primary + type + style knobs) with
  `getBrandPreset` / `matchBrandPreset` helpers for the configurator preset
  gallery.
- Reshaped `generateSkills` to [Agent Skills](https://agentskills.io/home)
  packages: `skills/<name>/SKILL.md` (lean + WHAT/WHEN/NOT description) with
  progressive disclosure into `references/`, plus
  `scripts/lint-token-usage.mjs` on the accessibility skill. Added
  `flattenSkillFiles` / `skillEntryMarkdown` helpers for export zip paths.

## [0.2.0]

- Reworked the `shadcn` exporter into a Tailwind v4 drop-in theme file (aligned
  with [tweakcn](https://github.com/jnsahaj/tweakcn)'s export shape):
  `@import "tailwindcss"`, `@custom-variant dark`, semantic `:root` / `.dark`,
  `@theme inline` (including Rhea radius scale through `--radius-4xl`), and
  `@layer base` body/border rules.
- Removed Lattice primitive ramps from the `shadcn` export (they remain in the
  `css` format). Fonts/radius/spacing stay on `:root` only; heading font maps
  to `--font-serif`.
- Expanded `toShadcnCssVars` for the Components live preview: fonts, radius
  (density-independent), spacing unit, shadow stacks, and Tailwind
  `--font-weight-*` remapped from brand weight slots. Added
  `isPreviewScopedShadcnVar` to document that the map must stay on a preview
  root (not `<html>`).

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
