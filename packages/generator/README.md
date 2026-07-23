# @soralabsoss/generator

Pure TypeScript library that turns a small `BrandConfig` (a few colors, a couple of fonts, some style knobs) into a full design-token system: OKLCH primitive ramps, semantic tokens with WCAG-AA-validated contrast pairings, and exporters for CSS, [DTCG](https://design-tokens.github.io/community-group/format/) JSON, Tailwind, and shadcn-style themes.

It has no DOM dependencies — it runs in Node, in the browser, or inside the [`@sora-lattice/web`](../../apps/web/) Configurator that ships in this repo.

## Install (workspace use)

The `@sora-lattice/web` package already depends on it via `workspace:*`. To consume it from another workspace package, add:

```jsonc
// package.json
"dependencies": {
  "@soralabsoss/generator": "workspace:*"
}
```

The package is built to `dist/` and exports its public surface from [`src/index.ts`](src/index.ts). It's ESM-only — `package.json` has no CJS `require` export condition, so `require('@soralabsoss/generator')` will not resolve.

## Quick start

One-shot: produce tokens and exported artifacts in a single call.

```ts
import { generateTheme } from '@soralabsoss/generator';

const theme = generateTheme(
  {
    primaryColor: '#2e7bab',
    primaryFont: 'Inter',
    headingFont: 'Cormorant Garamond',
  },
  { formats: ['css', 'shadcn'], colorSpace: 'oklch' },
);

theme.tokens.light;             // Record<string, string> of CSS custom properties
theme.tokens.dark;
theme.artifacts[0].content;     // CSS string with :root + :root[data-theme="dark"]
theme.artifacts[1].content;     // shadcn-style @layer base output
```

Step-by-step: build the config, generate light/dark token sets, then export.

```ts
import {
  createBrandConfig,
  generateDesignTokens,
  exportTokens,
  validateWcagAaContrast,
} from '@soralabsoss/generator';

const config = createBrandConfig({ primaryColor: '#2e7bab' });

const light = generateDesignTokens(config, false).tokens;
const dark  = generateDesignTokens(config, true).tokens;

const css = exportTokens({ light, dark }, 'css', 'oklch');

const failures = validateWcagAaContrast(light); // [] when all pairs pass AA
```

## Public API surface

| Symbol | What it does |
|---|---|
| `createBrandConfig(input)` | Merges partial input with `initialConfig` defaults; safe for all-optional input. |
| `generateDesignTokens(config, isDark)` | Returns `{ tokens, semanticMap }`. `semanticMap` records which primitive each semantic token resolves to (used by the inspector UI). |
| `generateTheme(input, options)` | Convenience wrapper: builds the config, both modes, and any requested export artifacts in one call. |
| `exportTokens(tokens, format, colorSpace, options?)` | `format`: `'css' \| 'dtcg' \| 'tailwind' \| 'shadcn'`. `colorSpace`: `'hex' \| 'rgb' \| 'hsl' \| 'oklch'`. |
| `generateRamp`, `generateOklchRamp`, `generateNeutralRamp` | Lower-level OKLCH ramp builders. |
| `getGeneratedColor(hex, mode)` | Compute a complementary / triadic / analogous / etc. partner from a base color. |
| `validateWcagAaContrast(tokens, pairs?)` | Returns failing `ContrastValidationFailure[]` for the default 16 semantic pairs, or for a custom list. |
| `pickContrastingFg(bg, ramp, isDark)` | Walk a ramp until a step meets WCAG AA against a background. |
| `generateSkills(config, tokens)` | Generates agent-facing skill markdown (tokens/theming, component creation, accessibility) describing the emitted token system. |
| `NAMED_HUES`, `STEPS`, `NEUTRAL_STEPS`, `GENERATION_MODES`, `SEMANTIC_HUES` | Constant tables consumed by the generator and re-exported for UI use. |

Types: `BrandConfig`, `BrandConfigInput`, `ColorRamp`, `NeutralColorRamp`, `TokenSet`, `ExportFormat`, `ColorSpace`, `PrimitiveMapping`, `ContrastPair`, `ContrastValidationFailure`, `GenerationMode`.

`generateSkills` (in [`skills.ts`](src/skills.ts)) lives in this package rather than a separate one because it reads the exact `BrandConfig`/`TokenSet` shapes this package produces to generate accurate, config-specific documentation (real token names, configured density/roundness/headless-lib, etc.) — it's a consumer of this package's own output, not an unrelated concern bolted on. It's used by the Configurator's export flow ([`apps/web/src/components/Configurator/Export/export-page.tsx`](../../apps/web/src/components/Configurator/Export/export-page.tsx)) to ship a `.claude/skills`-style bundle alongside generated tokens.

## Source layout

```
src/
├── index.ts             # Public exports + generateTheme()
├── types.ts             # BrandConfig, defaults, createBrandConfig()
├── color-utils.ts       # STEPS, ColorRamp types, generateRamp, helpers
├── color-generation.ts  # OKLCH math: gamut clamp, Gaussian chroma, hue allocation
├── contrast-utils.ts    # pickStep / pickContrastingFg
├── generate-tokens.ts   # Semantic mapping → CSS custom properties (light + dark)
├── export-tokens.ts     # Format-specific writers (CSS, DTCG, Tailwind, shadcn)
├── accessibility.ts     # WCAG AA validation against the 16 default pairs
├── skills.ts            # Agent/tool-facing skill descriptors for the generator API
└── culori.d.ts          # Local types for the subset of culori we use
```

## Scripts

Inside this monorepo (uses Turborepo/bun workspace filtering):

```bash
bun run --filter @soralabsoss/generator build   # tsc → dist/
bun run --filter @soralabsoss/generator test    # vitest run
```

Working in this package directly (e.g. after cloning just this repo, or from an npm-installed copy for local hacking) — the filter above only resolves inside the monorepo workspace:

```bash
cd packages/generator
bun run build   # tsc → dist/
bun run test    # vitest run
```

The test suite (`test/*.test.ts`) covers config normalization, deterministic token output, all four export formats, the AA contrast guarantees for both modes, and the pure color-math/contrast helpers in isolation.

## Publishing

This package is published to npm as [`@soralabsoss/generator`](https://www.npmjs.com/package/@soralabsoss/generator) under MIT, so it can be consumed outside this monorepo (e.g. a CLI in another repo calling `generateTheme()` directly, with no network dependency).

To cut a release:

1. Bump `version` in [`package.json`](package.json) (semver — this is a public API surface once published).
2. Push a tag matching `generator-v<version>` (e.g. `generator-v0.1.0`) on `main`.
3. [`.github/workflows/publish-generator.yml`](../../.github/workflows/publish-generator.yml) builds, tests, verifies the tag matches `package.json`, then runs `npm publish --access public --provenance`.

Requires an `NPM_TOKEN` repository secret (npm automation token with publish rights on the `@soralabsoss` scope).

## Implementation notes

- Color math is OKLCH-first via [culori](https://culorijs.org/). Lightness targets in [color-generation.ts](src/color-generation.ts) are tuned so that primary/status backgrounds land near step 600 in light mode and step 400 in dark mode, which keeps neutral-0 foregrounds above 4.5:1 contrast without per-token overrides.
- Color-parsing helpers (`generateRamp`, `getContrastColor`, `adjustLightness`, `getGeneratedColor`, etc.) fall back to a sensible default (the input hex, or a fixed black/white) instead of throwing when `culori` can't parse a color. This is deliberate: a single malformed color (e.g. mid-edit in a color picker) degrades one ramp/step rather than crashing the whole `generateTheme()` call. Validate user-supplied color strings before passing them in if you need hard failures.
- Semantic tokens are emitted as `var(--color-<hue>-<step>)` references rather than literal hex, so consumers can edit primitives without rebuilding the whole token set.
- Exporters share a single category mapping (`primitive-color`, `background`, `border`, `foreground`, `interactive`, `chart`, `gradient`, `font`, `space`, `typography`, `dimension`, `shape`, `shadow`, `state`, `transition`, `other`), so output ordering and grouping stay consistent across formats.
