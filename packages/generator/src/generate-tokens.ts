import { wcagContrast } from "culori";
import type {
  ColorMode,
  PrimaryContrastClampResult,
} from "./color-generation.js";
import {
  clampPrimaryForContrast,
  generateNeutralRamp,
  generateOklchRamp,
  getGeneratedColor,
  maxChromaForLH,
  NAMED_HUES,
  toOklch,
} from "./color-generation.js";
import {
  type ColorRamp,
  flipRamp,
  type NeutralColorRamp,
  STEPS,
} from "./color-utils.js";
import { pickStep } from "./contrast-utils.js";
import { type BrandConfig, initialConfig, type RadiusRole } from "./types.js";

// ---------------------------------------------------------------------------
// Lightness targets — the tunable "knobs" for semantic mapping
// ---------------------------------------------------------------------------

// Most targets are mode-independent: a semantic token picks one ramp step (by
// lightness on the light-mode ramp) and dark mode is handled by flipping the
// chromatic primitive ramps. `strong` is the exception — a flipped filled
// surface lands mid-tone, too close to both neutral extremes to clear WCAG AA
// for its `on*` foreground, so it keeps a per-mode target: the dark surface is
// nudged lighter so dark text on it stays legible.
const LIGHTNESS_TARGETS = {
  fgColored: 0.42, // colored text on base surfaces
  strong: { dark: 0.66, light: 0.48 }, // primary/accent/status filled backgrounds
  strongHover: 0.42, // hover states
  subtle: 0.97, // subtle backgrounds
};

// ---------------------------------------------------------------------------
// Types for the semantic → primitive mapping (used by inspector)
// ---------------------------------------------------------------------------

export interface PrimitiveMapping {
  darkStep: number | null;
  lightStep: number | null;
  /** Hue-name of the referenced primitive ramp (e.g. 'blue', 'neutral'), or null for literal values. */
  ramp: string | null;
  /**
   * Override key consumed by `updateRampStep` when the inspector edits this token.
   * For primary/secondary/neutral this is the role name; for decoratives & status
   * it is the hue name. Null for literal-valued tokens.
   */
  role?: string | null;
  /**
   * Routing sentinel for inspector edits. When set to 'primaryColor', editing
   * this token writes the new hex back to `config.primaryColor` rather than
   * `rampOverrides`. Used by the saturated-primary tokens that resolve to the
   * exact-input primitive `--color-primary-base` (and its hover derivative).
   */
  target?: "primaryColor";
}

export interface TokenResult {
  /**
   * Populated when the input primary color failed the contrast guardrail
   * against the current mode's base background and was nudged toward
   * readability. Undefined when no adjustment was needed.
   */
  primaryAdjustment?: PrimaryContrastClampResult;
  semanticMap: Record<string, PrimitiveMapping>;
  /** Step-500 representatives of the role ramps — used by UI swatches. */
  swatches: { primary: string; secondary: string; neutral: string };
  tokens: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Hue allocation — one ramp per hue, priority-ordered
// ---------------------------------------------------------------------------

/** Lowercase hue-name identifiers emitted as color primitives. */
export const HUE_NAMES = NAMED_HUES.map((h) => h.name.toLowerCase()).concat(
  "neutral"
);

/** Stable preference order for decorative hue slots. */
const DECORATIVE_HUE_PREFERENCE = [
  "amber",
  "teal",
  "indigo",
  "purple",
  "cyan",
  "pink",
];
/** How many decorative slots the generator fills (after collision pruning). */
const DECORATIVE_SLOT_COUNT = 4;

/** Return the lowercase hue name nearest to the given OKLCH hue angle. */
function hueNameFor(hue: number): string {
  const normalized = ((hue % 360) + 360) % 360;
  const [firstHue] = NAMED_HUES;
  let best = firstHue;
  let bestDist = 360;
  for (const nh of NAMED_HUES) {
    const diff = Math.abs(normalized - nh.hue);
    const dist = Math.min(diff, 360 - diff);
    if (dist < bestDist) {
      bestDist = dist;
      best = nh;
    }
  }
  return best.name.toLowerCase();
}

// `red`/`yellow`/`green` are reserved for the status roles (critical/warning/
// success). When bucketing a *brand* input (primary/secondary) they only count
// as a match within this tight tolerance — so an orange-red primary snaps to
// `orange`, leaving `red` free for `critical` instead of greedily swallowing it.
const RESERVED_SEMANTIC_HUES = new Set(["red", "yellow", "green"]);
const RESERVED_HUE_TOLERANCE = 10; // degrees

/**
 * Like `hueNameFor`, but for brand roles: the reserved status hues only win
 * when the input is genuinely close to them, so they stay available for the
 * status roles that semantically need them.
 */
function hueNameForRole(hue: number): string {
  const normalized = ((hue % 360) + 360) % 360;
  const [firstHue] = NAMED_HUES;
  let best = firstHue;
  let bestDist = 360;
  for (const nh of NAMED_HUES) {
    const diff = Math.abs(normalized - nh.hue);
    const dist = Math.min(diff, 360 - diff);
    if (
      RESERVED_SEMANTIC_HUES.has(nh.name.toLowerCase()) &&
      dist > RESERVED_HUE_TOLERANCE
    ) {
      continue; // reserved hue too far — let a non-semantic neighbour take it
    }
    if (dist < bestDist) {
      bestDist = dist;
      best = nh;
    }
  }
  return best.name.toLowerCase();
}

/** Canonical OKLCH hue for a hue-name (used when seeding decorative ramps). */
function canonicalHue(name: string): number {
  const nh = NAMED_HUES.find((h) => h.name.toLowerCase() === name);
  return nh ? nh.hue : 0;
}

export interface RampAllocation {
  /**
   * Dark-mode ramps (overrides applied). Chromatic ramps are flipped so the
   * darkest shade sits on step 50; the neutral ramp keeps its natural ordering.
   */
  byHueDark: Record<string, ColorRamp | NeutralColorRamp>;
  /** Light-mode ramps (overrides applied). Used for mode-stable step picking. */
  byHueLight: Record<string, ColorRamp | NeutralColorRamp>;
  /** Hue names for decorative slots, ordered. */
  decorativeHues: string[];
  /** Role → hue assignment. Covers primary/secondary/success/warning/critical/info. */
  roleHue: Record<RampRole, string>;
}

type RampRole =
  | "primary"
  | "secondary"
  | "accent"
  | "tertiary"
  | "success"
  | "warning"
  | "critical"
  | "info";

const BRAND_ROLES = new Set<RampRole>([
  "primary",
  "secondary",
  "accent",
  "tertiary",
]);

// ---------------------------------------------------------------------------
// Preset → token value mappings
// ---------------------------------------------------------------------------

/**
 * Radius presets — emit as `var(--dimension-...)` references so radii
 * scale with density alongside spacing.
 */
const RADIUS_PRESETS: Record<
  BrandConfig["roundness"],
  Record<string, string>
> = {
  pill: {
    action: "var(--dimension-max)",
    badge: "var(--dimension-max)",
    container: "var(--dimension-300)",
    field: "var(--dimension-max)",
    subcontainer: "var(--dimension-200)",
    supercontainer: "var(--dimension-400)",
  },
  rounded: {
    action: "var(--dimension-125)",
    badge: "var(--dimension-100)",
    container: "var(--dimension-200)",
    field: "var(--dimension-125)",
    subcontainer: "var(--dimension-100)",
    supercontainer: "var(--dimension-300)",
  },
  sharp: {
    action: "var(--dimension-25)",
    badge: "var(--dimension-25)",
    container: "var(--dimension-0)",
    field: "var(--dimension-25)",
    subcontainer: "var(--dimension-0)",
    supercontainer: "var(--dimension-0)",
  },
  subtle: {
    action: "var(--dimension-75)",
    badge: "var(--dimension-50)",
    container: "var(--dimension-100)",
    field: "var(--dimension-75)",
    subcontainer: "var(--dimension-50)",
    supercontainer: "var(--dimension-150)",
  },
};

/** Core primitive (dimension-100) per density. */
const DIMENSION_BASE_PX: Record<BrandConfig["density"], number> = {
  comfortable: 10,
  compact: 6,
  default: 8,
};

function dimensionBaseFor(config: BrandConfig): number {
  return (
    config.styleOverrides?.dimensionBasePx ?? DIMENSION_BASE_PX[config.density]
  );
}

/** Dimension step ladder — matches the shape of the sample tokens.css. */
const DIMENSION_STEPS = [
  0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 500, 600,
  800, 1000,
] as const;

/** Semantic t-shirt scale → dimension step. */
const SPACING_SCALE: Record<string, number> = {
  "2xl": 400,
  "3xl": 500,
  "4xl": 600,
  "5xl": 800,
  "6xl": 1000,
  lg: 200,
  md: 150,
  sm: 100,
  xl: 300,
  xs: 50,
};

// ---------------------------------------------------------------------------
// Typography ladder (mirrors tokens.css primitive tier)
// ---------------------------------------------------------------------------

/** px values for typography-size-<step>. */
const TYPOGRAPHY_SIZE_STEPS: Record<number, number> = {
  100: 8,
  125: 10,
  150: 12,
  175: 14,
  200: 16,
  225: 18,
  250: 20,
  300: 24,
  350: 28,
  400: 32,
  500: 40,
  600: 48,
  800: 64,
};

/** Heading size ladder (semantic → primitive step). */
const HEADING_SIZE_STEPS: Record<string, number> = {
  "2xl": 500,
  "3xl": 600,
  "4xl": 800,
  lg: 350,
  md: 300,
  sm: 225,
  xl: 400,
  xs: 200,
};

/** Body size ladder (semantic → primitive step). */
const BODY_SIZE_STEPS: Record<string, number> = {
  "2xs": 125,
  lg: 225,
  md: 200,
  sm: 175,
  xs: 150,
};

/**
 * Action / field size ladder (semantic → primitive step).
 *
 * Each text size pairs with an icon-only button one step up the icon ladder:
 *   xs → 12px text + 14px icon
 *   sm → 14px text + 16px icon
 *   md → 16px text + 20px icon
 *   lg → 18px text + 24px icon
 * The per-size line-heights in `fontSemantics` are set to the matching icon
 * height so text buttons and icon buttons have identical outer heights.
 */
const ACTION_SIZE_STEPS: Record<string, number> = {
  lg: 225, // 18px
  md: 200, // 16px
  sm: 175, // 14px
  xs: 150, // 12px
};

// ---------------------------------------------------------------------------
// Non-color token builders
// ---------------------------------------------------------------------------

function dimensionPrimitives(config: BrandConfig): Record<string, string> {
  const base = dimensionBaseFor(config);
  const out: Record<string, string> = {};
  for (const step of DIMENSION_STEPS) {
    out[`--dimension-${step}`] = `${(base * step) / 100}px`;
  }
  out["--dimension-max"] = "999px";
  return out;
}

function spaceSemantics(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, step] of Object.entries(SPACING_SCALE)) {
    out[`--space-${name}`] = `var(--dimension-${step})`;
  }
  return out;
}

function nearestDimensionStep(step: number): number {
  let best: number = DIMENSION_STEPS[0];
  let bestDist = Math.abs(step - best);
  for (const candidate of DIMENSION_STEPS) {
    const dist = Math.abs(step - candidate);
    if (dist < bestDist) {
      best = candidate;
      bestDist = dist;
    }
  }
  return best;
}

function scaleRadiusValue(value: string, scale: number): string {
  const match = value.match(/^var\(--dimension-(\d+|max)\)$/);
  if (!match) {
    return value;
  }
  if (match[1] === "max") {
    return value;
  }
  const step = Number(match[1]);
  const scaled = nearestDimensionStep(Math.round(step * scale));
  return `var(--dimension-${scaled})`;
}

function shapeTokens(
  roundness: BrandConfig["roundness"],
  overrides?: BrandConfig["styleOverrides"]
): Record<string, string> {
  const out: Record<string, string> = {
    "--shape-border-regular": "1px",
    "--shape-border-thick": "2px",
    "--shape-border-thin": "0.5px",
    "--shape-radius-max": "var(--dimension-max)",
    "--shape-ringOffset": "var(--dimension-25)",
  };
  const scale = overrides?.radiusScale ?? 1;
  for (const [key, value] of Object.entries(RADIUS_PRESETS[roundness])) {
    const role = key as RadiusRole;
    const override = overrides?.radii?.[role];
    out[`--shape-radius-${key}`] =
      override ?? (scale === 1 ? value : scaleRadiusValue(value, scale));
  }
  return out;
}

function typographyPrimitives(config: BrandConfig): Record<string, string> {
  const scale = config.fontScale || 1;
  const mono = config.monoFont || initialConfig.monoFont;
  const tracking = Number.isFinite(config.letterSpacing)
    ? config.letterSpacing
    : 0;
  const out: Record<string, string> = {
    "--typography-font-family-body": `'${config.primaryFont}', system-ui, -apple-system, sans-serif`,
    "--typography-font-family-heading": `'${config.headingFont}', system-ui, -apple-system, sans-serif`,
    "--typography-font-family-mono": `'${mono}', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
    "--typography-letter-spacing": `${tracking}em`,
  };
  for (const [step, px] of Object.entries(TYPOGRAPHY_SIZE_STEPS)) {
    out[`--typography-size-${step}`] =
      `${Math.round(px * scale * 100) / 100}px`;
  }
  // Weight primitives — include whatever the config actually uses.
  const weights = new Set<number>([
    config.headingWeight,
    config.bodyWeights.light,
    config.bodyWeights.regular,
    config.bodyWeights.bold,
    400,
    500,
    600,
  ]);
  for (const w of Array.from(weights).sort((a, b) => a - b)) {
    out[`--typography-weight-${w}`] = String(w);
  }
  return out;
}

function fontSemantics(config: BrandConfig): Record<string, string> {
  const out: Record<string, string> = {
    // Action
    // Line-heights are sized to match icon-only buttons at the same t-shirt
    // size, so text buttons and icon buttons have identical outer heights:
    //   xs → 12px text + 14px icon (14/12 → calc(140% / 120%))
    //   sm → 14px text + 16px icon (16/14 → calc(160% / 140%))
    //   md → 16px text + 20px icon (20/16 = 125%)
    //   lg → 18px text + 24px icon (24/18 → calc(240% / 180%))
    "--font-action-family": "var(--typography-font-family-body)",
    "--font-action-lg-lineheight": "calc(240% / 180%)",
    "--font-action-md-lineheight": "125%",
    "--font-action-sm-lineheight": "calc(160% / 140%)",
    "--font-action-weight": "var(--typography-weight-500)",
    "--font-action-xs-lineheight": "calc(140% / 120%)",
    // Body
    "--font-body-family": "var(--typography-font-family-body)",
    "--font-body-letter-spacing": "var(--typography-letter-spacing)",
    "--font-body-lineheight": "150%",
    "--font-body-weight-bold": `var(--typography-weight-${config.bodyWeights.bold})`,
    "--font-body-weight-light": `var(--typography-weight-${config.bodyWeights.light})`,
    "--font-body-weight-medium": `var(--typography-weight-${Math.min(600, Math.max(500, config.bodyWeights.regular))})`,
    "--font-body-weight-regular": `var(--typography-weight-${config.bodyWeights.regular})`,
    // Field — mirrors action so inputs and buttons line up at every size.
    "--font-field-family": "var(--typography-font-family-body)",
    "--font-field-lg-lineheight": "calc(240% / 180%)",
    "--font-field-md-lineheight": "125%",
    "--font-field-sm-lineheight": "calc(160% / 140%)",
    "--font-field-weight": `var(--typography-weight-${config.bodyWeights.regular})`,
    "--font-field-xs-lineheight": "calc(140% / 120%)",
    // Heading
    "--font-heading-family": "var(--typography-font-family-heading)",
    "--font-heading-letter-spacing": "var(--typography-letter-spacing)",
    "--font-heading-lineheight": "125%",
    "--font-heading-weight": `var(--typography-weight-${config.headingWeight})`,
    "--font-mono-family": "var(--typography-font-family-mono)",
  };
  for (const [name, step] of Object.entries(HEADING_SIZE_STEPS)) {
    out[`--font-heading-${name}-size`] = `var(--typography-size-${step})`;
  }
  for (const [name, step] of Object.entries(BODY_SIZE_STEPS)) {
    out[`--font-body-${name}-size`] = `var(--typography-size-${step})`;
  }
  for (const [name, step] of Object.entries(ACTION_SIZE_STEPS)) {
    out[`--font-action-${name}-size`] = `var(--typography-size-${step})`;
    out[`--font-field-${name}-size`] = `var(--typography-size-${step})`;
  }
  return out;
}

// Elevation system
// ----------------
// Four conceptual elevation tiers exist regardless of the configured level:
//   sunken  — recessed gutter surfaces (never casts a shadow)
//   base    — the default page surface (never casts a shadow)
//   raised  — cards, panels, inset surfaces lifted above base
//   overlay — modals, popovers, menus floating above the page
// Only `raised` and `overlay` emit visible shadow tokens.
function shadowTokens(
  level: BrandConfig["shadows"],
  isDark: boolean,
  overrides?: BrandConfig["styleOverrides"]
): Record<string, string> {
  const base = isDark ? "0,0,0" : "15,23,42";
  let tokens: Record<string, string>;
  switch (level) {
    case "none":
      tokens = {
        "--shadow-overlay": isDark
          ? `0 2px 6px rgba(${base},0.25), 0 1px 2px rgba(${base},0.18)`
          : `0 2px 6px rgba(${base},0.05), 0 1px 2px rgba(${base},0.03)`,
        "--shadow-raised": "none",
      };
      break;
    case "dramatic":
      tokens = {
        "--shadow-overlay": isDark
          ? `0 20px 40px rgba(${base},0.55), 0 8px 16px rgba(${base},0.35)`
          : `0 20px 40px rgba(${base},0.18), 0 8px 16px rgba(${base},0.1)`,
        "--shadow-raised": isDark
          ? `0 2px 6px rgba(${base},0.08)`
          : `0 2px 6px rgba(${base},0.06)`,
      };
      break;
    default:
      tokens = {
        "--shadow-overlay": isDark
          ? `0 10px 25px rgba(${base},0.45), 0 4px 10px rgba(${base},0.25)`
          : `0 10px 25px rgba(${base},0.1), 0 4px 10px rgba(${base},0.06)`,
        "--shadow-raised": isDark
          ? `0 1px 3px rgba(${base},0.1)`
          : `0 1px 3px rgba(${base},0.06)`,
      };
  }
  if (overrides?.shadowRaised) {
    tokens["--shadow-raised"] = overrides.shadowRaised;
  }
  if (overrides?.shadowOverlay) {
    tokens["--shadow-overlay"] = overrides.shadowOverlay;
  }
  return tokens;
}

// Shared alpha scale for interaction states. Consumed both by the raw
// `--state-opacity-*` primitives and by the interactive scrim tokens below, so
// the hover/active overlay opacity stays in lockstep with the primitive scale.
const STATE_OPACITY = {
  active: 0.24,
  disabled: 0.4,
  hover: 0.12,
} as const;

function stateTokens(): Record<string, string> {
  return {
    "--state-opacity-active": String(STATE_OPACITY.active),
    "--state-opacity-disabled": String(STATE_OPACITY.disabled),
    "--state-opacity-hover": String(STATE_OPACITY.hover),
  };
}

/** Parse a `#rrggbb` hex into a `r, g, b` triple for use inside `rgba()`. */
function hexToRgbTriple(hex: string): string {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const TRANSITION_DURATIONS_BY_EXPRESSIVENESS: Record<
  BrandConfig["expressiveness"],
  { gradual: string; swift: string }
> = {
  balanced: { gradual: "350ms", swift: "150ms" },
  expressive: { gradual: "500ms", swift: "250ms" },
  minimal: { gradual: "250ms", swift: "100ms" },
};

function transitionTokens(
  expressiveness: BrandConfig["expressiveness"],
  overrides?: BrandConfig["styleOverrides"]
): Record<string, string> {
  const presets = TRANSITION_DURATIONS_BY_EXPRESSIVENESS[expressiveness];
  const swift =
    overrides?.transitionSwiftMs === undefined
      ? presets.swift
      : `${overrides.transitionSwiftMs}ms`;
  const gradual =
    overrides?.transitionGradualMs === undefined
      ? presets.gradual
      : `${overrides.transitionGradualMs}ms`;

  const out: Record<string, string> = {
    "--transition-gradual-duration": gradual,
    "--transition-gradual-easing": "cubic-bezier(0.65, 0.05, 0.36, 1)",
    // Primitives
    "--transition-swift-duration": swift,
    "--transition-swift-easing": "cubic-bezier(0.22, 0.61, 0.36, 1)",
  };

  // Consumer-facing composite aliases — a minor deviation from tokens.css to
  // preserve the single-var shorthand used by ComponentSampler/PlaygroundDashboard.
  const themeProps = [
    "background-color",
    "border-color",
    "color",
    "border-radius",
    "padding",
    "gap",
    "box-shadow",
  ];
  out["--transition-theme"] = themeProps
    .map(
      (p) =>
        `${p} var(--transition-gradual-duration) var(--transition-gradual-easing)`
    )
    .join(", ");
  out["--transition-interactive"] =
    "all var(--transition-swift-duration) var(--transition-swift-easing)";
  out["--transition-chart"] = [
    "stroke var(--transition-gradual-duration) var(--transition-gradual-easing)",
    "fill var(--transition-gradual-duration) var(--transition-gradual-easing)",
    "opacity var(--transition-gradual-duration) var(--transition-gradual-easing)",
  ].join(", ");

  return out;
}

// ---------------------------------------------------------------------------
// Ramp allocation
// ---------------------------------------------------------------------------

/** Merge user per-step overrides into a generated ramp (immutably). */
function applyRampOverrides<T extends ColorRamp | NeutralColorRamp>(
  ramp: T,
  overrides: Partial<ColorRamp> | undefined
): T {
  if (!overrides) {
    return ramp;
  }
  const out = { ...ramp } as Record<string | number, string>;
  for (const [step, value] of Object.entries(overrides)) {
    if (value) {
      out[step] = value;
    }
  }
  return out as unknown as T;
}

interface BrandRampInfo {
  c: number;
  h: number;
  hue: string;
  l: number;
  ramp: ColorRamp;
}

function buildPrimaryRampInfo(
  config: BrandConfig,
  mode: ColorMode,
  falloff: number
): BrandRampInfo {
  const oklch = toOklch(config.primaryColor);
  const h = oklch?.h || 0;
  const l = oklch?.l ?? 0.5;
  const c = oklch?.c ?? 0;
  const maxC = maxChromaForLH(l, h);
  const satRatio = maxC > 0 ? c / maxC : 0;
  const ramp = generateOklchRamp(h, c, l, falloff, { mode, satRatio });
  return { c, h, hue: hueNameForRole(h), l, ramp };
}

function buildSecondaryRampInfo(
  mode: ColorMode,
  falloff: number,
  secondaryColor: string
): BrandRampInfo {
  const oklch = toOklch(secondaryColor);
  const h = oklch?.h || 0;
  const l = oklch?.l ?? 0.5;
  const c = oklch?.c ?? 0;
  const maxC = maxChromaForLH(l, h);
  const satRatio = maxC > 0 ? c / maxC : 0;
  const ramp = generateOklchRamp(h, c, l, falloff, { mode, satRatio });
  return { c, h, hue: hueNameForRole(h), l, ramp };
}

function resolveSecondaryColor(config: BrandConfig): string {
  return config.useCustomSecondary && config.secondaryColor
    ? config.secondaryColor
    : getGeneratedColor(
        config.primaryColor,
        config.secondaryGenerationMode || "complementary"
      );
}

function resolveAccentColor(config: BrandConfig): string {
  return config.useCustomAccent && config.accentColor
    ? config.accentColor
    : getGeneratedColor(
        config.primaryColor,
        config.accentGenerationMode || "triadic"
      );
}

function resolveTertiaryColor(config: BrandConfig): string {
  return config.useCustomTertiary && config.tertiaryColor
    ? config.tertiaryColor
    : getGeneratedColor(
        config.primaryColor,
        config.tertiaryGenerationMode || "analogous"
      );
}

/** Priority-order assignment: primary wins collisions, then secondary, then optional brand roles, then status. */
function assignmentPriority(config: BrandConfig): RampRole[] {
  const roles: RampRole[] = ["primary", "secondary"];
  if (config.useAccent) {
    roles.push("accent");
  }
  if (config.useTertiary) {
    roles.push("tertiary");
  }
  roles.push("success", "warning", "critical", "info");
  return roles;
}

function assignStatusRamps(
  mode: ColorMode,
  falloff: number,
  statusInput: Partial<Record<RampRole, string>>,
  primary: BrandRampInfo,
  secondary: BrandRampInfo,
  byHue: Record<string, ColorRamp | NeutralColorRamp>,
  roleHue: Record<RampRole, string>,
  priority: RampRole[]
): void {
  for (const role of priority) {
    const hex = statusInput[role];
    if (!hex) {
      continue;
    }
    const oklch = toOklch(hex);
    const h = oklch?.h || 0;
    const l = oklch?.l ?? 0.5;
    const c = oklch?.c ?? 0;
    const isBrandRole = BRAND_ROLES.has(role);
    // Brand roles bucket with the narrow rule so they don't
    // greedily occupy a reserved status hue; status roles bucket normally.
    const hueName = isBrandRole ? hueNameForRole(h) : hueNameFor(h);
    roleHue[role] = hueName;

    // Skip emission if a higher-priority role already occupies this hue slot.
    if (byHue[hueName]) {
      continue;
    }

    if (role === "primary") {
      byHue[hueName] = primary.ramp;
      continue;
    }
    if (role === "secondary") {
      byHue[hueName] = secondary.ramp;
      continue;
    }

    // Primary/secondary use the configured falloff for soft ramps; status uses 0.8.
    const sigma = isBrandRole ? falloff : 0.8;
    const maxC = maxChromaForLH(l, h);
    const satRatio = maxC > 0 ? c / maxC : 0;
    byHue[hueName] = generateOklchRamp(h, c, l, sigma, { mode, satRatio });
  }
}

/** Pick decorative hues not already occupied, up to `DECORATIVE_SLOT_COUNT`. */
function assignDecorativeRamps(
  mode: ColorMode,
  byHue: Record<string, ColorRamp | NeutralColorRamp>
): string[] {
  const isDark = mode === "dark";
  const decorativeHues: string[] = [];
  for (const candidate of DECORATIVE_HUE_PREFERENCE) {
    if (decorativeHues.length >= DECORATIVE_SLOT_COUNT) {
      break;
    }
    if (byHue[candidate]) {
      continue;
    }
    decorativeHues.push(candidate);
    const h = canonicalHue(candidate);
    const peakL = isDark ? 0.65 : 0.6;
    const hueMaxC = maxChromaForLH(peakL, h);
    const c = hueMaxC * 0.8;
    byHue[candidate] = generateOklchRamp(h, c, peakL, 0.8, {
      mode,
      satRatio: 0.8,
    });
  }
  return decorativeHues;
}

/** Build raw ramps for a single mode (no per-step overrides applied yet). */
function buildModeRamps(
  config: BrandConfig,
  mode: ColorMode
): {
  byHue: Record<string, ColorRamp | NeutralColorRamp>;
  roleHue: Record<RampRole, string>;
  decorativeHues: string[];
} {
  const falloff = config.chromaFalloff / 100;

  const primary = buildPrimaryRampInfo(config, mode, falloff);
  const secondaryColor = resolveSecondaryColor(config);
  const secondary = buildSecondaryRampInfo(mode, falloff, secondaryColor);

  const neutralRamp = generateNeutralRamp(
    primary.h,
    config.neutralTint,
    primary.l,
    falloff,
    { mode }
  );

  const statusInput: Partial<Record<RampRole, string>> = {
    critical: config.statusColors.error,
    info: config.statusColors.info,
    primary: config.primaryColor,
    secondary: secondaryColor,
    success: config.statusColors.success,
    warning: config.statusColors.warning,
  };
  if (config.useAccent) {
    statusInput.accent = resolveAccentColor(config);
  }
  if (config.useTertiary) {
    statusInput.tertiary = resolveTertiaryColor(config);
  }

  const byHue: Record<string, ColorRamp | NeutralColorRamp> = {
    neutral: neutralRamp,
  };
  const roleHue = {
    accent: secondary.hue,
    critical: "red",
    info: "blue",
    primary: primary.hue,
    secondary: secondary.hue,
    success: "green",
    tertiary: secondary.hue,
    warning: "yellow",
  } as Record<RampRole, string>;

  assignStatusRamps(
    mode,
    falloff,
    statusInput,
    primary,
    secondary,
    byHue,
    roleHue,
    assignmentPriority(config)
  );

  const decorativeHues = assignDecorativeRamps(mode, byHue);

  return { byHue, decorativeHues, roleHue };
}

/** Map a hue name back to its `config.rampOverrides` key. */
function overrideKeyForHue(
  hue: string,
  roleHue: Record<RampRole, string>
): string {
  if (hue === "neutral") {
    return "neutral";
  }
  if (roleHue.primary === hue) {
    return "primary";
  }
  if (roleHue.secondary === hue) {
    return "secondary";
  }
  if (roleHue.success === hue) {
    return "success";
  }
  if (roleHue.warning === hue) {
    return "warning";
  }
  if (roleHue.critical === hue) {
    return "critical";
  }
  if (roleHue.info === hue) {
    return "info";
  }
  if (roleHue.accent === hue) {
    return "accent";
  }
  if (roleHue.tertiary === hue) {
    return "tertiary";
  }
  return hue;
}

/**
 * Build both light and dark ramp sets. Dark-mode chromatic ramps are flipped
 * (darkest shade → step 50) so a single semantic mapping works in both modes;
 * the neutral ramp keeps its natural ordering. Per-step overrides are applied
 * after the flip, so an inspector-edited swatch stays at its displayed step.
 */
function allocateRamps(config: BrandConfig): RampAllocation {
  const light = buildModeRamps(config, "light");
  const dark = buildModeRamps(config, "dark");
  const overrides = config.rampOverrides;
  // Hue selection is mode-independent — light and dark agree.
  const { roleHue, decorativeHues } = light;

  const withOverride = (hue: string, ramp: ColorRamp | NeutralColorRamp) =>
    applyRampOverrides(
      ramp,
      overrides[overrideKeyForHue(hue, roleHue)] as
        | Partial<ColorRamp>
        | undefined
    );

  const byHueLight: Record<string, ColorRamp | NeutralColorRamp> = {};
  for (const [hue, ramp] of Object.entries(light.byHue)) {
    byHueLight[hue] = withOverride(hue, ramp);
  }

  const byHueDark: Record<string, ColorRamp | NeutralColorRamp> = {};
  for (const [hue, ramp] of Object.entries(dark.byHue)) {
    const oriented = hue === "neutral" ? ramp : flipRamp(ramp as ColorRamp);
    byHueDark[hue] = withOverride(hue, oriented);
  }

  return { byHueDark, byHueLight, decorativeHues, roleHue };
}

// ---------------------------------------------------------------------------
// Main token generator
// ---------------------------------------------------------------------------

const SEMANTIC_ROLES = ["success", "warning", "critical", "info"] as const;

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Pick between `neutral-0` and `neutral-1050` based on which has higher WCAG
 * contrast against `bg`. Used for foregrounds on solid, fully-saturated
 * surfaces (e.g. `onAccent`, `onSuccess`, `onPrimary`).
 */
function pickNeutralExtreme(bg: string, neutral: NeutralColorRamp): 0 | 1000 {
  return (wcagContrast(bg, neutral[0]) ?? 0) >=
    (wcagContrast(bg, neutral[1050]) ?? 0)
    ? 0
    : 1000;
}

/**
 * Accumulates emitted tokens/semanticMap entries and centralizes the handful
 * of assignment strategies (fixed step, lightness-picked step, contrast-aware
 * step, literal value) shared across every semantic token section below.
 */
class TokenEmitter {
  tokens: Record<string, string> = {};
  semanticMap: Record<string, PrimitiveMapping> = {};

  private readonly byHueLight: Record<string, ColorRamp | NeutralColorRamp>;
  private readonly byHueDark: Record<string, ColorRamp | NeutralColorRamp>;
  private readonly roleHue: Record<RampRole, string>;
  readonly isDark: boolean;

  constructor(
    byHueLight: Record<string, ColorRamp | NeutralColorRamp>,
    byHueDark: Record<string, ColorRamp | NeutralColorRamp>,
    roleHue: Record<RampRole, string>,
    isDark: boolean
  ) {
    this.byHueLight = byHueLight;
    this.byHueDark = byHueDark;
    this.roleHue = roleHue;
    this.isDark = isDark;
  }

  /** Active ramp set for primitive emission: chromatic ramps flipped when dark. */
  get byHue(): Record<string, ColorRamp | NeutralColorRamp> {
    return this.isDark ? this.byHueDark : this.byHueLight;
  }

  /** Reverse lookup: hue name → override role (for inspector). */
  overrideRoleFor(hue: string): string {
    return overrideKeyForHue(hue, this.roleHue);
  }

  /** Emit a token that references a primitive at a fixed step. */
  assignPrimitiveRef(tokenSuffix: string, hue: string, step: number): void {
    this.tokens[`--color-${tokenSuffix}`] = `var(--color-${hue}-${step})`;
    this.semanticMap[`color-${tokenSuffix}`] = {
      darkStep: step,
      lightStep: step,
      ramp: hue,
      role: this.overrideRoleFor(hue),
    };
  }

  /**
   * Emit a token that picks the ramp step closest to a lightness target.
   *
   * A plain `number` target picks one step on the light ramp and reuses it in
   * both modes — dark mode is handled by the flipped primitive ramp. A
   * `{light,dark}` target picks per mode (light step on the light ramp, dark
   * step on the flipped dark ramp) for the rare token whose flip lands wrong.
   */
  assignPicked(
    tokenSuffix: string,
    hue: string,
    target: number | { light: number; dark: number }
  ): void {
    let lightStep: number;
    let darkStep: number;
    if (typeof target === "number") {
      lightStep = pickStep(this.byHueLight[hue] as ColorRamp, target);
      darkStep = lightStep;
    } else {
      lightStep = pickStep(this.byHueLight[hue] as ColorRamp, target.light);
      darkStep = pickStep(this.byHueDark[hue] as ColorRamp, target.dark);
    }
    const step = this.isDark ? darkStep : lightStep;
    this.tokens[`--color-${tokenSuffix}`] = `var(--color-${hue}-${step})`;
    this.semanticMap[`color-${tokenSuffix}`] = {
      darkStep,
      lightStep,
      ramp: hue,
      role: this.overrideRoleFor(hue),
    };
  }

  /**
   * Emit a foreground token chosen to meet WCAG AA contrast with its background.
   * Picks a single mode-independent step that clears AA against the resolved
   * background in *both* the light ramp and the flipped dark ramp; if none does,
   * falls back to the step with the best worst-case contrast.
   */
  assignContrastFg(
    tokenSuffix: string,
    bgTokenSuffix: string,
    hue: string
  ): void {
    const lightRamp = this.byHueLight[hue] as ColorRamp;
    const darkRamp = this.byHueDark[hue] as ColorRamp;
    const bgValue = this.tokens[`--color-${bgTokenSuffix}`];
    const bgLight = resolveStepRef(bgValue, this.byHueLight);
    const bgDark = resolveStepRef(bgValue, this.byHueDark);

    let chosen: number | null = null;
    let bestStep: number = STEPS.at(-1) as number;
    let bestMin = -1;
    for (const step of STEPS) {
      const cLight = wcagContrast(bgLight, lightRamp[step]) ?? 0;
      const cDark = wcagContrast(bgDark, darkRamp[step]) ?? 0;
      if (cLight >= 4.5 && cDark >= 4.5) {
        chosen = step;
        break;
      }
      const worst = Math.min(cLight, cDark);
      if (worst > bestMin) {
        bestMin = worst;
        bestStep = step;
      }
    }
    const step = chosen ?? bestStep;
    this.tokens[`--color-${tokenSuffix}`] = `var(--color-${hue}-${step})`;
    this.semanticMap[`color-${tokenSuffix}`] = {
      darkStep: step,
      lightStep: step,
      ramp: hue,
      role: this.overrideRoleFor(hue),
    };
  }

  /**
   * Pick between `--color-neutral-0` and `--color-neutral-1000` based on which
   * has higher WCAG contrast against the resolved background.
   *
   * Used for foregrounds on solid, fully-saturated surfaces (e.g. `onAccent`,
   * `onSuccess`). The chromatic background flips between modes but the neutral
   * ramp does not, so the winning extreme is computed per mode — `lightStep`
   * and `darkStep` may differ.
   */
  assignNeutralContrastFg(tokenSuffix: string, bgTokenSuffix: string): void {
    const bgValue = this.tokens[`--color-${bgTokenSuffix}`];
    const neutralLight = this.byHueLight.neutral as NeutralColorRamp;
    const neutralDark = this.byHueDark.neutral as NeutralColorRamp;

    const lightStep = pickNeutralExtreme(
      resolveStepRef(bgValue, this.byHueLight),
      neutralLight
    );
    const darkStep = pickNeutralExtreme(
      resolveStepRef(bgValue, this.byHueDark),
      neutralDark
    );
    const step = this.isDark ? darkStep : lightStep;
    this.tokens[`--color-${tokenSuffix}`] = `var(--color-neutral-${step})`;

    this.semanticMap[`color-${tokenSuffix}`] = {
      darkStep,
      lightStep,
      ramp: "neutral",
      role: this.overrideRoleFor("neutral"),
    };
  }

  /** Emit a literal (non-primitive) value; records null mapping for the inspector. */
  assignLiteral(tokenSuffix: string, value: string): void {
    this.tokens[`--color-${tokenSuffix}`] = value;
    this.semanticMap[`color-${tokenSuffix}`] = {
      darkStep: null,
      lightStep: null,
      ramp: null,
      role: null,
    };
  }
}

/** Primitive color tokens — emit one ramp per hue. */
function emitPrimitiveRampTokens(emitter: TokenEmitter): void {
  // The legacy neutral ramp uses `1050` as its near-black / near-white endpoint;
  // tokens.css names that step `1000` instead. Keep the internal ramp identifier
  // for compatibility with ColorRampView etc., but emit the canonical name.
  const emittedStep = (step: string) => (step === "1050" ? "1000" : step);

  for (const [hue, ramp] of Object.entries(emitter.byHue)) {
    const role = emitter.overrideRoleFor(hue);
    for (const [step, hex] of Object.entries(ramp)) {
      const out = emittedStep(step);
      const tokenName = `color-${hue}-${out}`;
      emitter.tokens[`--${tokenName}`] = hex as string;
      emitter.semanticMap[tokenName] = {
        darkStep: Number(step),
        lightStep: Number(step),
        ramp: hue,
        role,
      };
    }
  }
}

interface PrimaryBaseResult {
  primaryAdjustment: PrimaryContrastClampResult;
  primaryBaseHex: string;
}

/**
 * Exact-input primitive: bypasses ramp clamping so saturated primary surfaces
 * (button background, border, hover) preserve the user's chosen hex verbatim.
 * Same hex in both light and dark modes — branding wins over mode-specific tuning.
 *
 * Guardrail: if the input would be illegible against this mode's base
 * background (e.g. a near-black primary in dark mode), nudge it toward the
 * opposite of the bg until WCAG 3:1 is met. `config.primaryColor` itself is
 * left untouched so the picker keeps showing the user's chosen hex.
 */
function emitExactPrimaryToken(
  emitter: TokenEmitter,
  config: BrandConfig,
  roleHue: Record<RampRole, string>
): PrimaryBaseResult {
  const neutralRampOut = emitter.byHue.neutral as NeutralColorRamp;
  const baseBgHex = (
    emitter.isDark ? neutralRampOut[800] : neutralRampOut[0]
  ) as string;
  const primaryAdjustment = clampPrimaryForContrast(
    config.primaryColor,
    baseBgHex,
    emitter.isDark ? "dark" : "light"
  );
  const primaryBaseHex = primaryAdjustment.applied;
  emitter.tokens["--color-primary-base"] = primaryBaseHex;
  emitter.semanticMap["color-primary-base"] = {
    darkStep: null,
    lightStep: null,
    ramp: roleHue.primary,
    role: "primary",
    target: "primaryColor",
  };
  return { primaryAdjustment, primaryBaseHex };
}

/** Semantic background tokens. */
function emitBackgroundTokens(
  emitter: TokenEmitter,
  roleHue: Record<RampRole, string>,
  decorativeHues: string[]
): void {
  // Neutral surfaces — step-based references for both modes.
  if (emitter.isDark) {
    emitter.assignPrimitiveRef("background-base", "neutral", 800);
    emitter.assignPrimitiveRef("background-sunken", "neutral", 900);
    emitter.assignPrimitiveRef("background-sunkenStrong", "neutral", 1000);
    emitter.assignPrimitiveRef("background-raised", "neutral", 700);
    emitter.assignPrimitiveRef("background-raisedHover", "neutral", 600);
    emitter.assignPrimitiveRef("background-overlay", "neutral", 700);
  } else {
    emitter.assignPrimitiveRef("background-base", "neutral", 0);
    emitter.assignPrimitiveRef("background-sunken", "neutral", 50);
    emitter.assignPrimitiveRef("background-sunkenStrong", "neutral", 100);
    emitter.assignPrimitiveRef("background-raised", "neutral", 0);
    emitter.assignPrimitiveRef("background-raisedHover", "neutral", 50);
    emitter.assignPrimitiveRef("background-overlay", "neutral", 0);
  }

  // Brand / accent backgrounds
  // background-primary routes through the exact-input primitive — see the
  // `--color-primary-base` block above. primaryHover is a normal semantic step
  // on the primary ramp, so it flips with the ramp in dark mode.
  emitter.tokens["--color-background-primary"] = "var(--color-primary-base)";
  emitter.semanticMap["color-background-primary"] = {
    darkStep: null,
    lightStep: null,
    ramp: roleHue.primary,
    role: "primary",
    target: "primaryColor",
  };
  emitter.assignPicked(
    "background-primaryHover",
    roleHue.primary,
    LIGHTNESS_TARGETS.strongHover
  );
  emitter.assignPicked(
    "background-primarySubtle",
    roleHue.primary,
    LIGHTNESS_TARGETS.subtle
  );
  emitter.assignPicked(
    "background-accent",
    roleHue.accent,
    LIGHTNESS_TARGETS.strong
  );
  emitter.assignPicked(
    "background-accentSubtle",
    roleHue.accent,
    LIGHTNESS_TARGETS.subtle
  );

  // Status backgrounds
  for (const role of SEMANTIC_ROLES) {
    const hue = roleHue[role];
    emitter.assignPicked(`background-${role}`, hue, LIGHTNESS_TARGETS.strong);
    emitter.assignPicked(
      `background-${role}Subtle`,
      hue,
      LIGHTNESS_TARGETS.subtle
    );
  }

  // Decorative backgrounds + borders
  for (const hue of decorativeHues) {
    emitter.assignPicked(
      `background-decorative-${hue}`,
      hue,
      LIGHTNESS_TARGETS.strong
    );
    emitter.assignPicked(
      `background-decorative-${hue}Subtle`,
      hue,
      LIGHTNESS_TARGETS.subtle
    );
    emitter.assignPicked(
      `border-decorative-${hue}`,
      hue,
      LIGHTNESS_TARGETS.strong
    );
  }
}

/** Foreground tokens (neutral hierarchy + colored + contrast-dependent). */
function emitForegroundTokens(
  emitter: TokenEmitter,
  roleHue: Record<RampRole, string>,
  decorativeHues: string[],
  primaryBaseHex: string
): void {
  if (emitter.isDark) {
    emitter.assignPrimitiveRef("foreground-onBase", "neutral", 50);
    emitter.assignPrimitiveRef("foreground-onBaseMuted", "neutral", 200);
    emitter.assignPrimitiveRef("foreground-onBaseFaint", "neutral", 300);
    emitter.assignPrimitiveRef("foreground-onRaised", "neutral", 50);
    emitter.assignPrimitiveRef("foreground-onSunken", "neutral", 100);
  } else {
    emitter.assignPrimitiveRef("foreground-onBase", "neutral", 900);
    emitter.assignPrimitiveRef("foreground-onBaseMuted", "neutral", 600);
    emitter.assignPrimitiveRef("foreground-onBaseFaint", "neutral", 500);
    emitter.assignPrimitiveRef("foreground-onRaised", "neutral", 900);
    emitter.assignPrimitiveRef("foreground-onSunken", "neutral", 900);
  }

  // Colored foregrounds on base surfaces
  emitter.assignPicked(
    "foreground-primary",
    roleHue.primary,
    LIGHTNESS_TARGETS.fgColored
  );
  emitter.assignPicked(
    "foreground-accent",
    roleHue.accent,
    LIGHTNESS_TARGETS.fgColored
  );
  for (const role of SEMANTIC_ROLES) {
    emitter.assignPicked(
      `foreground-${role}`,
      roleHue[role],
      LIGHTNESS_TARGETS.fgColored
    );
  }
  for (const hue of decorativeHues) {
    emitter.assignPicked(
      `foreground-decorative-${hue}`,
      hue,
      LIGHTNESS_TARGETS.fgColored
    );
  }

  // Contrast-dependent foregrounds — solid (fully-saturated) backgrounds snap
  // to a neutral extreme (neutral-0 / neutral-1000) for maximum legibility.
  //
  // foreground-onPrimary's background is the exact-input `--color-primary-base`,
  // which isn't a ramp step — so it's resolved against `primaryBaseHex` directly
  // rather than via `assignNeutralContrastFg`. Still emits a neutral primitive
  // (the neutral ramp doesn't flip, so one step works in both modes), matching
  // the sample tokens.css.
  const neutral = emitter.byHue.neutral as NeutralColorRamp;
  const onPrimaryStep = pickNeutralExtreme(primaryBaseHex, neutral);
  emitter.tokens["--color-foreground-onPrimary"] =
    `var(--color-neutral-${onPrimaryStep})`;
  emitter.semanticMap["color-foreground-onPrimary"] = {
    darkStep: onPrimaryStep,
    lightStep: onPrimaryStep,
    ramp: "neutral",
    role: "neutral",
  };

  emitter.assignNeutralContrastFg("foreground-onAccent", "background-accent");
  for (const role of SEMANTIC_ROLES) {
    const cap = capitalizeFirst(role);
    emitter.assignNeutralContrastFg(
      `foreground-on${cap}`,
      `background-${role}`
    );
  }
  for (const hue of decorativeHues) {
    const cap = capitalizeFirst(hue);
    emitter.assignNeutralContrastFg(
      `foreground-decorative-on${cap}`,
      `background-decorative-${hue}`
    );
  }

  // Subtle tinted backgrounds read best with a dark step of the same hue —
  // matches the sample tokens.css pattern (e.g. `onPrimarySubtle` → blue-700).
  emitter.assignContrastFg(
    "foreground-onPrimarySubtle",
    "background-primarySubtle",
    roleHue.primary
  );
  emitter.assignContrastFg(
    "foreground-onAccentSubtle",
    "background-accentSubtle",
    roleHue.accent
  );
  for (const role of SEMANTIC_ROLES) {
    const cap = capitalizeFirst(role);
    emitter.assignContrastFg(
      `foreground-on${cap}Subtle`,
      `background-${role}Subtle`,
      roleHue[role]
    );
  }
  for (const hue of decorativeHues) {
    const cap = capitalizeFirst(hue);
    emitter.assignContrastFg(
      `foreground-decorative-on${cap}Subtle`,
      `background-decorative-${hue}Subtle`,
      hue
    );
  }

  // CTA / gradient surfaces. `onGradient` is opaque white → the neutral-0
  // primitive (light in both modes, since the neutral ramp doesn't flip).
  // `onGradientMuted` and `gradientSoft` are *translucent* white — a muted
  // text that lets the gradient bleed through, and a 15%-white ghost-button
  // fill — so they can't map to an opaque primitive and stay literal as the
  // documented gradient exception.
  emitter.assignPrimitiveRef("foreground-onGradient", "neutral", 0);
  emitter.assignPrimitiveRef("foreground-onGradientMuted", "neutral", 100);
  emitter.assignPrimitiveRef("background-gradientSoft", "neutral", 0);
}

/** Semantic border tokens. */
function emitBorderTokens(
  emitter: TokenEmitter,
  roleHue: Record<RampRole, string>
): void {
  // Hairline borders reference the neutral ramp (matches the sample tokens.css:
  // border-neutral → neutral-100, border-strong → neutral-200). Dark mode uses
  // mid steps, not deep ones, so borders stay visible on raised surfaces
  // (which themselves sit at neutral-700).
  emitter.assignPrimitiveRef(
    "border-neutral",
    "neutral",
    emitter.isDark ? 600 : 100
  );
  emitter.assignPrimitiveRef(
    "border-strong",
    "neutral",
    emitter.isDark ? 500 : 200
  );
  // border-primary mirrors the exact-input primary fill so a primary button
  // doesn't get a hue mismatch between fill and outline.
  emitter.tokens["--color-border-primary"] = "var(--color-primary-base)";
  emitter.semanticMap["color-border-primary"] = {
    darkStep: null,
    lightStep: null,
    ramp: roleHue.primary,
    role: "primary",
    target: "primaryColor",
  };
  emitter.assignPicked(
    "border-accent",
    roleHue.accent,
    LIGHTNESS_TARGETS.strong
  );
  for (const role of SEMANTIC_ROLES) {
    emitter.assignPicked(
      `border-${role}`,
      roleHue[role],
      LIGHTNESS_TARGETS.strong
    );
  }
}

/** Chart tokens. */
function emitChartTokens(
  emitter: TokenEmitter,
  roleHue: Record<RampRole, string>
): void {
  // Chart gridlines — a faint neutral primitive (no hardcoded literal). Dark
  // mode uses a mid step so gridlines read against the chart surface.
  emitter.assignPrimitiveRef(
    "chart-grid",
    "neutral",
    emitter.isDark ? 600 : 100
  );
  const bgPrimaryMapping = emitter.semanticMap["color-background-primary"];
  const bgPrimary = emitter.tokens["--color-background-primary"];
  emitter.tokens["--color-chart-primary"] = bgPrimary;
  emitter.tokens["--color-chart-primaryGradientStart"] = bgPrimary;
  emitter.tokens["--color-chart-primaryGradientEnd"] = bgPrimary;
  emitter.semanticMap["color-chart-primary"] = { ...bgPrimaryMapping };
  emitter.semanticMap["color-chart-primaryGradientStart"] = {
    ...bgPrimaryMapping,
  };
  emitter.semanticMap["color-chart-primaryGradientEnd"] = {
    ...bgPrimaryMapping,
  };

  // Optional tertiary brand role surfaces as a secondary chart series color.
  if (roleHue.tertiary && roleHue.tertiary !== roleHue.secondary) {
    emitter.assignPicked(
      "chart-secondary",
      roleHue.tertiary,
      LIGHTNESS_TARGETS.strong
    );
  } else {
    emitter.assignPicked(
      "chart-secondary",
      roleHue.secondary,
      LIGHTNESS_TARGETS.strong
    );
  }
}

/**
 * Semantic interactive tokens: a translucent scrim laid over an interactive
 * element on hover/active. Light mode darkens the underlying surface with a
 * deep neutral; dark mode lightens it with a pale neutral. Because the
 * overlay only shifts whatever color sits beneath it, a single pair of
 * tokens drives the hover affordance for every interactive element
 * regardless of its own background. Alpha tracks the shared `STATE_OPACITY`
 * scale.
 */
function emitInteractiveTokens(emitter: TokenEmitter): void {
  const neutral = emitter.byHue.neutral as NeutralColorRamp;
  const scrim = hexToRgbTriple(
    (emitter.isDark ? neutral[50] : neutral[700]) as string
  );
  emitter.assignLiteral(
    "interactive-background-hover",
    `rgba(${scrim}, ${STATE_OPACITY.hover})`
  );
  emitter.assignLiteral(
    "interactive-background-active",
    `rgba(${scrim}, ${STATE_OPACITY.active})`
  );
}

function emitNonColorTokens(
  tokens: Record<string, string>,
  config: BrandConfig,
  isDark: boolean
): void {
  const overrides = config.styleOverrides;
  Object.assign(tokens, dimensionPrimitives(config));
  Object.assign(tokens, typographyPrimitives(config));
  Object.assign(tokens, spaceSemantics());
  Object.assign(tokens, shapeTokens(config.roundness, overrides));
  Object.assign(tokens, fontSemantics(config));
  Object.assign(tokens, shadowTokens(config.shadows, isDark, overrides));
  Object.assign(tokens, stateTokens());
  Object.assign(tokens, transitionTokens(config.expressiveness, overrides));
}

export function generateDesignTokens(
  config: BrandConfig,
  isDarkMode: boolean
): TokenResult {
  const isDark = isDarkMode;
  // `primaryColor` drives the whole pipeline (hue selection, contrast
  // clamping, neutral-extreme picks) and several of those steps call
  // culori's `wcagContrast` directly, which throws on an unparseable color
  // instead of failing soft. Sanitize once here — e.g. a partial hex typed
  // character-by-character in a live-updating input — rather than guarding
  // every downstream call site individually.
  const safeConfig = toOklch(config.primaryColor)
    ? config
    : { ...config, primaryColor: initialConfig.primaryColor };

  const allocation = allocateRamps(safeConfig);
  const { byHueLight, byHueDark, roleHue, decorativeHues } = allocation;

  const emitter = new TokenEmitter(byHueLight, byHueDark, roleHue, isDark);

  emitPrimitiveRampTokens(emitter);
  const { primaryBaseHex, primaryAdjustment } = emitExactPrimaryToken(
    emitter,
    safeConfig,
    roleHue
  );

  emitBackgroundTokens(emitter, roleHue, decorativeHues);
  emitForegroundTokens(emitter, roleHue, decorativeHues, primaryBaseHex);
  emitBorderTokens(emitter, roleHue);
  emitChartTokens(emitter, roleHue);

  emitter.tokens["--gradient-primary"] =
    "linear-gradient(135deg, var(--color-background-primary), var(--color-background-accent))";

  emitInteractiveTokens(emitter);
  emitNonColorTokens(emitter.tokens, safeConfig, isDark);

  const { byHue } = emitter;
  const swatches = {
    neutral: (byHue.neutral as ColorRamp)[500],
    primary: (byHue[roleHue.primary] as ColorRamp)[500],
    secondary: (byHue[roleHue.secondary] as ColorRamp)[500],
  };

  return {
    semanticMap: emitter.semanticMap,
    swatches,
    tokens: emitter.tokens,
    ...(primaryAdjustment.adjusted ? { primaryAdjustment } : {}),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEP_REF_PATTERN = /^var\(--color-([a-z]+)-(\d+)\)$/;

/**
 * Resolve a `var(--color-<hue>-<step>)` reference to a concrete hex via the
 * given ramp set. Returns the input unchanged if it isn't a step reference.
 * Used by the contrast helpers, which need a real color to measure against.
 */
function resolveStepRef(
  value: string | undefined,
  byHue: Record<string, ColorRamp | NeutralColorRamp>
): string {
  if (!value) {
    return "#808080";
  }
  const m = value.trim().match(STEP_REF_PATTERN);
  if (!m) {
    return value;
  }
  const ramp = byHue[m[1]] as unknown as Record<number, string> | undefined;
  if (!ramp) {
    return value;
  }
  let step = Number(m[2]);
  // The neutral ramp's deepest endpoint is keyed `1050` internally but emitted
  // as `1000`; map back when resolving.
  if (ramp[step] === undefined && step === 1000) {
    step = 1050;
  }
  return ramp[step] ?? value;
}
