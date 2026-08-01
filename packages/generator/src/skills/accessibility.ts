import type { TokenSet } from "../export-tokens.js";
import type { BrandConfig } from "../types.js";
import {
  deriveFacts,
  frontmatter,
  type SkillArtifact,
  skillFile,
} from "./types.js";

const NAME = "accessibility-and-motion";

const DESCRIPTION = `Use before shipping interactive UI on this Lattice token system — contrast pairs, focus rings, keyboard, motion tokens, and reduced-motion.
Not for generating tokens, inventing brand colors, or icon morph/hover gesture work (use a dedicated icon skill).`;

export function buildAccessibilitySkill(
  config: BrandConfig,
  set: TokenSet
): SkillArtifact {
  const f = deriveFacts(config, set);

  return {
    description: DESCRIPTION.replace(/\n/g, " ").trim(),
    files: [
      skillFile(
        "SKILL.md",
        `${frontmatter(NAME, DESCRIPTION)}
# Accessibility & motion

Generated with WCAG 2.2 AA contrast as a baseline. These gates preserve that contract for keyboard, focus, motion, and reduced-motion.

## The seven gates

1. Pair \`foreground/onX\` with matching \`background/X\` — never cross-pair.
2. \`:focus-visible\` only; never \`outline: none\` without a replacement.
3. Prefer headless keyboard semantics — don't reimplement menus/dialogs.
4. Animate \`opacity\` / \`transform\`; avoid layout properties.
5. Wrap non-essential motion in \`prefers-reduced-motion\`.
6. Status needs color **and** a non-color signal (icon/label).
7. Touch targets ≥ 44×44 px on primary mobile flows (density **${config.density}**).

## Read next

| Situation | Open |
| --- | --- |
| Contrast pairs + focus rings | [references/CONTRAST-FOCUS.md](references/CONTRAST-FOCUS.md) |
| Motion tokens + reduced-motion | [references/MOTION.md](references/MOTION.md) |
| Forms, SR, status colors | [references/FORMS-AT.md](references/FORMS-AT.md) |
| Heuristic token-usage lint | [scripts/lint-token-usage.mjs](scripts/lint-token-usage.mjs) |

## Procedure

1. Confirm every text/surface pair is a matching semantic couple.
2. Wire \`:focus-visible\` with \`--shape-border-thick\` + primary ring color.
3. Gate decorative motion; keep a reduced fade for meaningful state changes.
4. Run \`node scripts/lint-token-usage.mjs <files…>\` on new component CSS before merge.
`
      ),
      skillFile(
        "references/CONTRAST-FOCUS.md",
        `# Contrast & focus

The token pipeline checks every \`foreground/onX\` ↔ \`background/X\` pair for ≥ 4.5:1 (≥ 3:1 for large/bold text). Failures were adjusted at generation time.

\`\`\`css
/* ✅ guaranteed AA */
.cta {
  background: var(${f.bgPrimary});
  color:      var(${f.fgOnPri});
}

/* ❌ may fail — onPrimary is tuned for primary, not raised */
.bad {
  background: var(${f.bgRaised});
  color:      var(${f.fgOnPri});
}
\`\`\`

Custom gradients: test the pair manually.

## Focus

\`\`\`css
.focusable:focus-visible {
  outline:        var(--shape-border-thick) solid var(${f.bgPrimary});
  outline-offset: 2px;
  border-radius:  inherit;
}
\`\`\`

## Keyboard

Custom interactive elements must be focusable, activate on Enter **and** Space, expose \`role\` if not native, and wire \`aria-*\` to state. Prefer the headless primitive for menu/listbox/dialog/tooltip/popover.
`
      ),
      skillFile(
        "references/MOTION.md",
        `# Motion & reduced-motion

Tokens under \`--transition-*\`:

- Durations: \`instant\` (0), \`fast\` (~150ms), \`default\` (~250ms), \`slow\` (~400ms).
- Easings: \`standard\`, \`emphasized\`, \`decelerate\` (entry), \`accelerate\` (exit).

\`\`\`css
.btn {
  transition:
    background-color var(--transition-fast)    var(--transition-easing-standard),
    transform        var(--transition-default) var(--transition-easing-emphasized);
}
\`\`\`

**Rules:** GPU-friendly properties only; layout/state → \`fast\`; entry/exit → \`default\`; \`slow\` for hero only.

## Reduced motion

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
\`\`\`

Meaningful state changes keep a reduced fade — don't strip perception entirely.

\`\`\`tsx
import { useReducedMotion } from 'framer-motion';

const reduced = useReducedMotion();
<motion.div
  initial={{ opacity: 0, y: reduced ? 0 : 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: reduced ? 0.1 : 0.28 }}
/>
\`\`\`
`
      ),
      skillFile(
        "references/FORMS-AT.md",
        `# Forms, AT, status

## Touch targets

Minimum 44×44 px. Medium action + default padding lands there. Don't shrink primary mobile controls below \`--space-2xl\` height. Compact + \`btn-sm\` may be < 44 px — keyboard/mouse only.

## Screen readers

- \`display: none\` / \`visibility: hidden\` — unread.
- \`aria-hidden="true"\` — visible, unread (decorative icons).
- \`.sr-only\` — visually hidden, read by AT.

\`\`\`css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
\`\`\`

## Forms

- Visible label or \`aria-label\` — placeholder is not a label.
- Group with \`fieldset\`/\`legend\` (or ARIA group).
- Errors via \`aria-describedby\` + \`aria-live\` when async.
- \`required\` on the control itself.

## Status colors

Use color **and** icon/label. Configured seeds:

- success ≈ \`${config.statusColors.success}\`
- warning ≈ \`${config.statusColors.warning}\`
- critical ≈ \`${config.statusColors.error}\`
- info ≈ \`${config.statusColors.info}\`
`
      ),
      skillFile(
        "scripts/lint-token-usage.mjs",
        `#!/usr/bin/env node
/**
 * Heuristic lint for Lattice component styles.
 * Flags raw hex colors and naked px/rem in CSS-looking lines.
 * Usage: node scripts/lint-token-usage.mjs <file…>
 * Exit 1 if any findings.
 */
import { readFileSync } from "node:fs";

const HEX = /#[0-9a-fA-F]{3,8}\\b/g;
const RAW_SIZE = /(?<![\\w-])\\d+(\\.\\d+)?(px|rem)\\b/g;
const ALLOW_HEX = /(svg|url\\(|--lattice-allow-hex)/i;

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/lint-token-usage.mjs <file…>");
  process.exit(2);
}

let findings = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOW_HEX.test(line)) continue;
    for (const m of line.matchAll(HEX)) {
      findings++;
      console.log(\`\${file}:\${i + 1}: raw hex \${m[0]}\`);
    }
    if (/var\\(--/.test(line)) continue;
    for (const m of line.matchAll(RAW_SIZE)) {
      findings++;
      console.log(\`\${file}:\${i + 1}: raw size \${m[0]}\`);
    }
  }
}

if (findings > 0) {
  console.error(\`\\n\${findings} finding(s). Prefer semantic tokens (see SKILL.md).\`);
  process.exit(1);
}
console.log("lint-token-usage: ok");
`
      ),
    ],
    id: "accessibility",
    name: NAME,
    rootDir: `skills/${NAME}`,
    title: "Accessibility & motion",
  };
}
