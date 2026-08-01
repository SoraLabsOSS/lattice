import type { TokenSet } from "../export-tokens.js";
import type { BrandConfig, HeadlessLib } from "../types.js";
import {
  deriveFacts,
  frontmatter,
  type SkillArtifact,
  type SystemFacts,
  skillFile,
} from "./types.js";

const NAME = "component-creation";

const HEADLESS_LIB_INFO: Record<
  HeadlessLib,
  { label: string; importPath: string; primitivesNote: string }
> = {
  "base-ui": {
    importPath: "@base-ui/react",
    label: "Base UI",
    primitivesNote:
      "Base UI exposes one primitive per file (e.g. `@base-ui/react/dialog` → `Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`).",
  },
  "headless-ui": {
    importPath: "@headlessui/react",
    label: "Headless UI",
    primitivesNote:
      "Headless UI exposes primitives from a single package; reach for `Dialog`, `Listbox`, `Menu`, etc.",
  },
  radix: {
    importPath: "@radix-ui/react-*",
    label: "Radix UI",
    primitivesNote:
      "Radix exposes one primitive per package (e.g. `@radix-ui/react-dialog`).",
  },
  "react-aria": {
    importPath: "react-aria-components",
    label: "React Aria",
    primitivesNote:
      "React Aria Components ship as a single package; import primitives by name from `react-aria-components`.",
  },
};

function dialogExample(lib: HeadlessLib, f: SystemFacts): string {
  switch (lib) {
    case "radix":
      return `import * as Dialog from '@radix-ui/react-dialog';

export const ConfirmDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void }> = ({ open, onOpenChange, children }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-backdrop" />
      <Dialog.Content className="dialog-card">{children}</Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

/* dialog.css */
.dialog-backdrop {
  position: fixed; inset: 0;
  background: var(--color-background-overlay);
  opacity: 0.6;
}
.dialog-card {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
  max-width:     min(90vw, 480px);
}`;
    case "react-aria":
      return `import { DialogTrigger, Dialog, Modal, ModalOverlay, Button } from 'react-aria-components';

export const ConfirmDialog = ({ children }) => (
  <DialogTrigger>
    <Button className="btn btn-primary">Open</Button>
    <ModalOverlay className="dialog-backdrop">
      <Modal className="dialog-card">
        <Dialog>{children}</Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>
);

/* dialog.css */
.dialog-card {
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
}`;
    case "headless-ui":
      return `import { Dialog } from '@headlessui/react';

export const ConfirmDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose, children }) => (
  <Dialog open={open} onClose={onClose} className="dialog-root">
    <div className="dialog-backdrop" aria-hidden="true" />
    <div className="dialog-positioner">
      <Dialog.Panel className="dialog-card">{children}</Dialog.Panel>
    </div>
  </Dialog>
);

/* dialog.css */
.dialog-card {
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
}`;
    default:
      return `import { Dialog } from '@base-ui/react/dialog';

export const ConfirmDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }> = ({ open, onOpenChange, children }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Backdrop className="dialog-backdrop" />
    <Dialog.Popup className="dialog-card">{children}</Dialog.Popup>
  </Dialog.Root>
);

/* dialog.css */
.dialog-backdrop {
  position: fixed; inset: 0;
  background: var(--color-background-overlay);
  opacity: 0.6;
}
.dialog-card {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
  max-width:     min(90vw, 480px);
}`;
  }
}

export function buildComponentsSkill(
  config: BrandConfig,
  set: TokenSet
): SkillArtifact {
  const f = deriveFacts(config, set);
  const lib = HEADLESS_LIB_INFO[config.headlessLib];
  const description = `Use when building or refactoring React components against this Lattice token system with ${lib.label} — applying tokens, interactive states, composition, and forms.
Not for choosing brand colors, regenerating tokens, or icon SVG motion. Read tokens-and-theming first.`;

  return {
    description: description.replace(/\n/g, " ").trim(),
    files: [
      skillFile(
        "SKILL.md",
        `${frontmatter(NAME, description)}
# Component creation

Contract for writing components against this token system. **Read [tokens-and-theming](../tokens-and-theming/SKILL.md) first.**

Headless library: **${lib.label}** (\`${lib.importPath}\`). ${lib.primitivesNote} The library owns state, keyboard, focus, and ARIA — you apply tokens.

**Core principle:** components own structure; tokens own values. Don't pass \`color\` props down the tree — let CSS variables inherit.

## The five gates

1. Semantic token before primitive.
2. No raw \`px\` / \`rem\` / hex in component CSS — escalate for a new token.
3. Tokens compose; don't raise specificity to override.
4. Interactivity is a \`::after\` scrim, not a per-variant color swap.
5. Structure in the component; values from tokens.

## Read next

| Situation | Open |
| --- | --- |
| Button skeleton + token CSS | [references/SHAPE.md](references/SHAPE.md) |
| Hover / pressed scrim | [references/INTERACTIVITY.md](references/INTERACTIVITY.md) |
| ${lib.label} dialog composition + overrides | [references/COMPOSITION.md](references/COMPOSITION.md) |
| Inputs / fields | [references/FORMS.md](references/FORMS.md) |

## Procedure

1. Reach for a semantic token (decision tree in tokens-and-theming).
2. Wrap headless primitives with your own classes — never style library class names.
3. Add the scrim pattern for hover/pressed.
4. Prefer CSS-variable overrides over color props.

## Density & roundness

Configured density **${config.density}**, roundness **${config.roundness}**. They flow through \`--space-*\` and \`--shape-radius-*\`. If a component breaks at another density, you hard-coded a size.

## Switching headless libraries

Token API is library-agnostic. Swap imports/prop conventions; keep CSS on your classes. Do not couple CSS to \`.RadixDialogContent\`-style selectors.
`
      ),
      skillFile(
        "references/SHAPE.md",
        `# Component shape

\`\`\`tsx
import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...rest }, ref) => (
    <button
      ref={ref}
      className={\`btn btn-\${variant} btn-\${size} \${className}\`}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
\`\`\`

\`\`\`css
.btn {
  position: relative;          /* hosts the ::after scrim */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  border-radius: var(${f.radiusAction});
  border: var(--shape-border-regular) solid transparent;
  font-family: var(--font-action-family);
  font-weight: var(--font-action-weight);
  line-height: var(--font-action-lineheight);
  cursor: pointer;
  transition: background-color var(--transition-fast) var(--transition-easing-standard),
              border-color    var(--transition-fast) var(--transition-easing-standard);
}

.btn-sm { padding: var(--space-xs) var(--space-sm);  font-size: var(--font-action-sm-size); }
.btn-md { padding: var(--space-sm) var(--space-md);  font-size: var(--font-action-md-size); }
.btn-lg { padding: var(--space-md) var(--space-lg);  font-size: var(--font-action-lg-size); }

.btn-primary {
  background: var(${f.bgPrimary});
  color:      var(${f.fgOnPri});
}
.btn-secondary {
  background:   var(${f.bgRaised});
  color:        var(${f.fgOnBase});
  border-color: var(${f.borderTok});
}
.btn-ghost {
  background: transparent;
  color:      var(${f.fgPrimary});
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }
\`\`\`
`
      ),
      skillFile(
        "references/INTERACTIVITY.md",
        `# Interactive states

Hover/pressed use a \`::after\` scrim over \`currentColor\` — works on any surface without per-variant hover colors.

\`\`\`css
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
}
.btn:hover:not(:disabled)::after  { opacity: var(--state-hover-opacity, 0.06); }
.btn:active:not(:disabled)::after { opacity: var(--state-pressed-opacity, 0.12); }
\`\`\`

Do not layer a custom hover color *and* the scrim — pick one. Scrim is default.
`
      ),
      skillFile(
        "references/COMPOSITION.md",
        `# Composing ${lib.label}

The headless library owns behavior; your component owns appearance.

\`\`\`tsx
${dialogExample(config.headlessLib, f)}
\`\`\`

Not in this code: keyboard handling, \`aria-*\`, focus management, raw colors/sizes.

## Variants & overrides

1. **CSS variable props** — e.g. \`var(--card-bg, var(${f.bgRaised}))\`. Set \`--card-bg\` on a parent.
2. **\`className\`** — one-off layout tweaks; merge last.

\`\`\`tsx
.danger-zone {
  --card-bg:     var(--color-background-criticalSubtle);
  --card-border: var(--color-border-critical);
}

<Card className="my-grid-area" />
\`\`\`

Avoid props that map 1:1 to CSS values — that freezes today's token names into the API.
`
      ),
      skillFile(
        "references/FORMS.md",
        `# Forms & inputs

Inputs use \`--font-field-*\` (separate from action so sizes can diverge):

\`\`\`css
.input {
  height:       calc(var(--space-2xl) + var(--space-xs));
  padding:      0 var(--space-md);
  border:       var(--shape-border-regular) solid var(${f.borderTok});
  border-radius: var(--shape-radius-field);
  background:   var(${f.bgBase});
  color:        var(${f.fgOnBase});
  font-family:  var(--font-field-family);
  font-size:    var(--font-field-md-size);
  font-weight:  var(--font-field-weight);
  line-height:  var(--font-field-lineheight);
}
.input:focus-visible {
  outline:        var(--shape-border-thick) solid var(${f.bgPrimary});
  outline-offset: 2px;
  border-color:   var(${f.bgPrimary});
}
.input::placeholder { color: var(${f.fgMuted}); }
\`\`\`
`
      ),
    ],
    id: "components",
    name: NAME,
    rootDir: `skills/${NAME}`,
    title: "Component creation",
  };
}
