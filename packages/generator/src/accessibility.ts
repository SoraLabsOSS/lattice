import { wcagContrast } from "culori";

export interface ContrastPair {
  background: string;
  foreground: string;
  minimum: number;
  name: string;
}

export interface ContrastValidationFailure extends ContrastPair {
  backgroundValue: string;
  foregroundValue: string;
  ratio: number;
}

const WCAG_AA_TEXT_RATIO = 4.5;
const VAR_REFERENCE_PATTERN = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;
// `background-primary` resolves to the user's exact input color (preserving
// brand fidelity), so it isn't guaranteed body-text AA the way ramp-derived
// surfaces are. We still enforce large-text AA — adequate for primary
// buttons, which typically use bold/large labels.
const WCAG_AA_LARGE_TEXT_RATIO = 3.0;

export const DEFAULT_CONTRAST_PAIRS: ContrastPair[] = [
  {
    background: "--color-background-base",
    foreground: "--color-foreground-onBase",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "body on base",
  },
  {
    background: "--color-background-base",
    foreground: "--color-foreground-onBaseMuted",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "muted text on base",
  },
  {
    background: "--color-background-raised",
    foreground: "--color-foreground-onRaised",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "raised text",
  },
  {
    background: "--color-background-sunken",
    foreground: "--color-foreground-onSunken",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "sunken text",
  },
  {
    background: "--color-background-primary",
    foreground: "--color-foreground-onPrimary",
    minimum: WCAG_AA_LARGE_TEXT_RATIO,
    name: "primary surface",
  },
  {
    background: "--color-background-accent",
    foreground: "--color-foreground-onAccent",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "accent surface",
  },
  {
    background: "--color-background-success",
    foreground: "--color-foreground-onSuccess",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "success surface",
  },
  {
    background: "--color-background-warning",
    foreground: "--color-foreground-onWarning",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "warning surface",
  },
  {
    background: "--color-background-critical",
    foreground: "--color-foreground-onCritical",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "critical surface",
  },
  {
    background: "--color-background-info",
    foreground: "--color-foreground-onInfo",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "info surface",
  },
  {
    background: "--color-background-primarySubtle",
    foreground: "--color-foreground-onPrimarySubtle",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "primary subtle surface",
  },
  {
    background: "--color-background-accentSubtle",
    foreground: "--color-foreground-onAccentSubtle",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "accent subtle surface",
  },
  {
    background: "--color-background-successSubtle",
    foreground: "--color-foreground-onSuccessSubtle",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "success subtle surface",
  },
  {
    background: "--color-background-warningSubtle",
    foreground: "--color-foreground-onWarningSubtle",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "warning subtle surface",
  },
  {
    background: "--color-background-criticalSubtle",
    foreground: "--color-foreground-onCriticalSubtle",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "critical subtle surface",
  },
  {
    background: "--color-background-infoSubtle",
    foreground: "--color-foreground-onInfoSubtle",
    minimum: WCAG_AA_TEXT_RATIO,
    name: "info subtle surface",
  },
];

function resolveTokenValue(
  tokens: Record<string, string>,
  value: string,
  depth = 0
): string {
  if (depth > 8) {
    return value;
  }
  const match = value.match(VAR_REFERENCE_PATTERN);
  if (!match) {
    return value;
  }
  const next = tokens[match[1]];
  return next ? resolveTokenValue(tokens, next, depth + 1) : value;
}

function resolveNamedToken(
  tokens: Record<string, string>,
  name: string
): string {
  return resolveTokenValue(tokens, tokens[name] ?? name);
}

export function validateWcagAaContrast(
  tokens: Record<string, string>,
  pairs: ContrastPair[] = DEFAULT_CONTRAST_PAIRS
): ContrastValidationFailure[] {
  const failures: ContrastValidationFailure[] = [];

  for (const pair of pairs) {
    const foregroundValue = resolveNamedToken(tokens, pair.foreground);
    const backgroundValue = resolveNamedToken(tokens, pair.background);
    const ratio = wcagContrast(backgroundValue, foregroundValue);
    if (!Number.isFinite(ratio) || ratio < pair.minimum) {
      failures.push({
        ...pair,
        backgroundValue,
        foregroundValue,
        ratio,
      });
    }
  }

  return failures;
}
