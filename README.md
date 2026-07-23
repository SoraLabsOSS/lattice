# Sora Lattice

**Sora Lattice** generates design-system foundations from a few brand choices — primary/secondary/accent colors, neutrals, status hues, fonts, density and surface style — and emits semantic tokens tuned for WCAG AA contrast. It ships as a [Bun](https://bun.sh/) workspace orchestrated by [Turborepo](https://turbo.build/), split into a reusable token-generation library and an Astro web app that wraps it in a marketing site, an interactive Configurator, live previews, and one-click exports.

## Repository layout

| Path | Purpose |
|------|---------|
| [`packages/generator`](packages/generator/README.md) | `@soralabsoss/generator` — pure TypeScript library that produces OKLCH ramps, semantic token sets, and CSS / DTCG / Tailwind / shadcn exports. No DOM dependencies; usable from Node or the browser. |
| [`apps/web`](apps/web/README.md) | Astro 5 + React 19 frontend: marketing pages, the `/generate` Configurator, live component playground, and export dialog. Consumes `@soralabsoss/generator` via `workspace:*`. |

## Requirements

- **Node.js** 18.20.8+ or 22+ (22+ recommended; pinned in `apps/web/.nvmrc`).
- **Bun** 1.3+ (`packageManager` in root `package.json` pins `bun@1.3.5`).

## Getting started

```bash
bun install
bun run dev      # starts the web app via Turborepo (Astro on http://localhost:4321)
```

Other root scripts (all delegate through Turborepo):

```bash
bun run build    # build the generator package, then the web app
bun run test     # run vitest in every workspace that defines `test`
bun run preview  # serve the production web build
```

Turbo task wiring lives in [`turbo.json`](turbo.json); `^build` ensures `@soralabsoss/generator` is compiled before `apps/web` consumes it.

## Working on a single package

```bash
bun run --filter @soralabsoss/generator build
bun run --filter @soralabsoss/generator test
bun run --filter @sora-lattice/web dev
```

See each package's README for API docs, scripts, and customization notes.
