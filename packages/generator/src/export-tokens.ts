import { converter, formatHex, formatHsl, formatRgb, parse } from "culori";
import { HUE_NAMES } from "./generate-tokens.js";

// ---------------------------------------------------------------------------
// Color-space formatting
// ---------------------------------------------------------------------------

export type ColorSpace = "hex" | "rgb" | "hsl" | "oklch";

const toOklch = converter("oklch");

function formatColor(raw: string, space: ColorSpace): string {
  const parsed = parse(raw);
  if (!parsed) {
    return raw;
  }
  if (space === "hex") {
    return formatHex(parsed) || raw;
  }
  if (space === "rgb") {
    return formatRgb(parsed) || raw;
  }
  if (space === "hsl") {
    return formatHsl(parsed) || raw;
  }
  const o = toOklch(parsed);
  if (!o) {
    return raw;
  }
  const l = o.l.toFixed(4);
  const c = o.c.toFixed(4);
  const h = (o.h ?? 0).toFixed(4);
  return `oklch(${l} ${c} ${h})`;
}

const HEX_LITERAL_PATTERN = /^#[0-9a-f]{3,8}$/i;
const FUNCTIONAL_COLOR_LITERAL_PATTERN =
  /^(rgb|rgba|hsl|hsla|oklch|lch|lab)\(/i;
const RGBA_WITH_ALPHA_PATTERN = /^rgba?\([^)]*,[^)]*,[^)]*,/;
const HSLA_WITH_ALPHA_PATTERN = /^hsla?\([^)]*,[^)]*,[^)]*,/;

function isColorLiteral(v: string): boolean {
  const t = v.trim();
  return (
    HEX_LITERAL_PATTERN.test(t) || FUNCTIONAL_COLOR_LITERAL_PATTERN.test(t)
  );
}

function convertLiteral(raw: string, space: ColorSpace): string {
  const t = raw.trim();
  if (t.startsWith("linear-gradient") || t.startsWith("radial-gradient")) {
    return raw;
  }
  if (!isColorLiteral(t)) {
    return raw;
  }
  // rgba/hsla with alpha — keep as-is to preserve transparency (OKLCH has no alpha literal parity here)
  if (
    (RGBA_WITH_ALPHA_PATTERN.test(t) || HSLA_WITH_ALPHA_PATTERN.test(t)) &&
    (space === "rgb" || space === "hsl")
  ) {
    return raw;
  }
  return formatColor(t, space);
}

// ---------------------------------------------------------------------------
// Primitive vs semantic classification
// ---------------------------------------------------------------------------

const HUE_PATTERN = new RegExp(`^--color-(${HUE_NAMES.join("|")})-(\\d+)$`);
const CSS_VAR_PREFIX_PATTERN = /^--/;

function parsePrimitive(prop: string): { hue: string; step: string } | null {
  const m = prop.match(HUE_PATTERN);
  return m ? { hue: m[1], step: m[2] } : null;
}

function isPrimitiveColorToken(prop: string): boolean {
  return parsePrimitive(prop) !== null;
}

// ---------------------------------------------------------------------------
// var() reference handling
// ---------------------------------------------------------------------------

const VAR_REF_RE = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;

function varReferencedName(value: string): string | null {
  const m = value.trim().match(VAR_REF_RE);
  return m ? m[1] : null;
}

/** Follow `var(...)` indirection until a literal is reached. */
function resolveVar(
  value: string,
  tokens: Record<string, string>,
  depth = 0
): string {
  if (depth > 8) {
    return value;
  }
  const ref = varReferencedName(value);
  if (!ref) {
    return value;
  }
  const next = tokens[ref];
  if (next === undefined) {
    return value;
  }
  return resolveVar(next, tokens, depth + 1);
}

// ---------------------------------------------------------------------------
// Tokens input
// ---------------------------------------------------------------------------

export interface TokenSet {
  dark: Record<string, string>;
  light: Record<string, string>;
}

export type ExportFormat = "css" | "dtcg" | "tailwind" | "shadcn";

// ---------------------------------------------------------------------------
// Category mapping (drives grouped output in CSS / DTCG / Tailwind / shadcn)
// ---------------------------------------------------------------------------

type Category =
  | "primitive-color"
  | "background"
  | "border"
  | "foreground"
  | "interactive"
  | "chart"
  | "gradient"
  | "font"
  | "space"
  | "typography"
  | "dimension"
  | "shape"
  | "shadow"
  | "state"
  | "transition"
  | "other";

const CATEGORY_ORDER: Category[] = [
  "primitive-color",
  "background",
  "border",
  "foreground",
  "interactive",
  "chart",
  "gradient",
  "font",
  "space",
  "typography",
  "dimension",
  "shape",
  "shadow",
  "state",
  "transition",
  "other",
];

const CATEGORY_LABELS: Record<Category, string> = {
  background: "Semantic background tokens",
  border: "Semantic border tokens",
  chart: "Chart tokens",
  dimension: "Dimension tokens",
  font: "Font tokens",
  foreground: "Semantic foreground tokens",
  gradient: "Gradient tokens",
  interactive: "Interactive tokens",
  other: "Other",
  "primitive-color": "Color primitives",
  shadow: "Shadow tokens",
  shape: "Shape tokens",
  space: "Space tokens",
  state: "State tokens",
  transition: "Transition tokens",
  typography: "Typography tokens",
};

function categorize(prop: string): Category {
  if (isPrimitiveColorToken(prop)) {
    return "primitive-color";
  }
  if (prop.startsWith("--color-background-")) {
    return "background";
  }
  if (prop.startsWith("--color-border-")) {
    return "border";
  }
  if (prop.startsWith("--color-foreground-")) {
    return "foreground";
  }
  if (prop.startsWith("--color-interactive-")) {
    return "interactive";
  }
  if (prop.startsWith("--color-chart-")) {
    return "chart";
  }
  if (prop.startsWith("--color-")) {
    return "foreground"; // fallback bucket
  }
  if (prop.startsWith("--gradient-")) {
    return "gradient";
  }
  if (prop.startsWith("--font-")) {
    return "font";
  }
  if (prop.startsWith("--space-")) {
    return "space";
  }
  if (prop.startsWith("--typography-")) {
    return "typography";
  }
  if (prop.startsWith("--dimension-")) {
    return "dimension";
  }
  if (prop.startsWith("--shape-")) {
    return "shape";
  }
  if (prop.startsWith("--shadow-")) {
    return "shadow";
  }
  if (prop.startsWith("--state-")) {
    return "state";
  }
  if (prop.startsWith("--transition-")) {
    return "transition";
  }
  return "other";
}

function groupByCategory(
  tokens: Record<string, string>
): Record<Category, [string, string][]> {
  const groups = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, [] as [string, string][]])
  ) as Record<Category, [string, string][]>;
  for (const entry of Object.entries(tokens)) {
    groups[categorize(entry[0])].push(entry);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// CSS export
// ---------------------------------------------------------------------------

/**
 * Format a single token value for CSS output.
 *
 * - `var(...)` references: emitted verbatim so the downstream cascade resolves them.
 * - Color literals (hex / rgb / hsl / oklch): converted to the requested space.
 * - Other values (duration strings, shadow shorthands, gradients, etc.): untouched.
 */
function formatCssValue(prop: string, raw: string, space: ColorSpace): string {
  if (varReferencedName(raw)) {
    return raw;
  }
  if (prop.startsWith("--color-") && isColorLiteral(raw)) {
    return convertLiteral(raw, space);
  }
  return raw;
}

function categoryBlockLines(
  tokens: Record<string, string>,
  space: ColorSpace,
  includeSemantic: boolean
): string[] {
  const groups = groupByCategory(tokens);
  const lines: string[] = [];
  let firstSection = true;

  for (const category of CATEGORY_ORDER) {
    if (!includeSemantic && category !== "primitive-color") {
      continue;
    }
    const entries = groups[category];
    if (entries.length === 0) {
      continue;
    }

    if (!firstSection) {
      lines.push("");
    }
    firstSection = false;
    lines.push(`  /* ${CATEGORY_LABELS[category]} */`);
    for (const [prop, raw] of entries) {
      lines.push(`  ${prop}: ${formatCssValue(prop, raw, space)};`);
    }
  }
  return lines;
}

function cssBlock(
  selector: string,
  tokens: Record<string, string>,
  space: ColorSpace,
  includeSemantic: boolean
): string {
  const body = categoryBlockLines(tokens, space, includeSemantic);
  return [`${selector} {`, ...body, "}"].join("\n");
}

/**
 * Diff between light and dark token sets.
 *
 * Because semantic tokens are emitted as `var(--color-<hue>-<step>)`, the
 * diff captures:
 *   1. Primitive hex values that differ per mode (re-emitted for the dark ramp).
 *   2. Semantic tokens whose *chosen ramp step* changes across modes (the
 *      var() reference points at a different step in dark mode).
 */
function diffFromLight(
  light: Record<string, string>,
  dark: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [prop, raw] of Object.entries(dark)) {
    if (light[prop] !== raw) {
      out[prop] = raw;
    }
  }
  return out;
}

function exportCSS(
  set: TokenSet,
  space: ColorSpace,
  includeSemantic: boolean
): string {
  const light = cssBlock(":root", set.light, space, includeSemantic);
  const darkOverrides = diffFromLight(set.light, set.dark);
  const dark = cssBlock(
    ':root[data-theme="dark"]',
    darkOverrides,
    space,
    includeSemantic
  );
  return `${light}\n\n${dark}`;
}

// ---------------------------------------------------------------------------
// DTCG JSON export
// ---------------------------------------------------------------------------

const SIMPLE_DTCG_TYPE_BY_PREFIX: { prefix: string; type: string }[] = [
  { prefix: "--color-", type: "color" },
  { prefix: "--gradient-", type: "other" },
  { prefix: "--space-", type: "dimension" },
  { prefix: "--dimension-", type: "dimension" },
  { prefix: "--shape-", type: "dimension" },
  { prefix: "--shadow-", type: "shadow" },
  { prefix: "--state-", type: "other" },
  { prefix: "--transition-", type: "other" },
];

function dtcgFontType(prop: string): string {
  if (prop.endsWith("-family")) {
    return "fontFamily";
  }
  if (prop.includes("-weight")) {
    return "fontWeight";
  }
  if (prop.includes("-size")) {
    return "dimension";
  }
  return "other";
}

function dtcgTypographyType(prop: string): string {
  if (prop.includes("-family")) {
    return "fontFamily";
  }
  if (prop.startsWith("--typography-weight-")) {
    return "fontWeight";
  }
  return "dimension";
}

function dtcgTypeFor(prop: string): string {
  if (prop.startsWith("--font-")) {
    return dtcgFontType(prop);
  }
  if (prop.startsWith("--typography-")) {
    return dtcgTypographyType(prop);
  }

  const simpleMatch = SIMPLE_DTCG_TYPE_BY_PREFIX.find(({ prefix }) =>
    prop.startsWith(prefix)
  );
  return simpleMatch?.type ?? "other";
}

/** Convert a `var(--foo-bar-baz)` reference into a DTCG reference `{foo.bar.baz}`. */
function dtcgReferenceFor(value: string): string | null {
  const name = varReferencedName(value);
  if (!name) {
    return null;
  }
  return `{${name.replace(CSS_VAR_PREFIX_PATTERN, "").split("-").join(".")}}`;
}

function dtcgValue(prop: string, value: string, space: ColorSpace): string {
  const ref = dtcgReferenceFor(value);
  if (ref) {
    return ref;
  }
  if (prop.startsWith("--color-") && isColorLiteral(value)) {
    return convertLiteral(value, space);
  }
  return value;
}

function tokenPath(prop: string): string[] {
  return prop.replace(CSS_VAR_PREFIX_PATTERN, "").split("-");
}

function insertDTCG(
  root: Record<string, unknown>,
  prop: string,
  value: string,
  space: ColorSpace
) {
  const parts = tokenPath(prop);
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!cursor[parts[i]]) {
      cursor[parts[i]] = {};
    }
    cursor = cursor[parts[i]] as Record<string, unknown>;
  }
  cursor[parts.at(-1) as string] = {
    $type: dtcgTypeFor(prop),
    $value: dtcgValue(prop, value, space),
  };
}

function buildDTCG(tokens: Record<string, string>, space: ColorSpace) {
  const primitive: Record<string, unknown> = {};
  const semantic: Record<string, unknown> = {};
  for (const [prop, val] of Object.entries(tokens)) {
    const bucket = isPrimitiveColorToken(prop) ? primitive : semantic;
    insertDTCG(bucket, prop, val, space);
  }
  return { primitive, semantic };
}

function exportDTCG(set: TokenSet, space: ColorSpace): string {
  const obj = {
    dark: buildDTCG(set.dark, space),
    light: buildDTCG(set.light, space),
  };
  return JSON.stringify(obj, null, 2);
}

// ---------------------------------------------------------------------------
// Tailwind export
// ---------------------------------------------------------------------------

/**
 * Build a Tailwind `colors` block.
 *
 * Primitive ramps emit concrete hex values (so `bg-blue-500` etc. work even
 * without CSS-var runtime). Semantic entries reference the CSS variables so
 * that dark-mode and runtime theme switches stay reactive through the same
 * `:root[data-theme="dark"]` selector emitted by the CSS export.
 */
function buildColorGroups(tokens: Record<string, string>, space: ColorSpace) {
  const primitives: Record<string, Record<string, string>> = {};
  const semantic: Record<string, string | Record<string, string>> = {};

  for (const [prop, raw] of Object.entries(tokens)) {
    if (!prop.startsWith("--color-")) {
      continue;
    }
    const primParts = parsePrimitive(prop);
    if (primParts) {
      if (!primitives[primParts.hue]) {
        primitives[primParts.hue] = {};
      }
      primitives[primParts.hue][primParts.step] = convertLiteral(raw, space);
      continue;
    }
    const rest = prop.slice("--color-".length);
    const [group, ...tail] = rest.split("-");
    const semanticValue = `var(${prop})`;
    if (tail.length === 0) {
      semantic[group] = semanticValue;
    } else {
      if (typeof semantic[group] !== "object") {
        semantic[group] = {};
      }
      (semantic[group] as Record<string, string>)[tail.join("-")] =
        semanticValue;
    }
  }
  return { primitives, semantic };
}

const NUMERIC_KEY_PATTERN = /^\d+$/;

function serializeGroup(
  map: Record<string, string | Record<string, string>>,
  indent: string
): string {
  return Object.entries(map)
    .map(([k, v]) => {
      if (typeof v === "string") {
        return `${indent}'${k}': '${v}'`;
      }
      const inner = Object.entries(v)
        .map(
          ([kk, vv]) =>
            `${indent}  ${NUMERIC_KEY_PATTERN.test(kk) ? kk : `'${kk}'`}: '${vv}'`
        )
        .join(",\n");
      return `${indent}'${k}': {\n${inner}\n${indent}}`;
    })
    .join(",\n");
}

function exportTailwind(set: TokenSet, space: ColorSpace): string {
  const { primitives, semantic } = buildColorGroups(set.light, space);
  const primitivesSerialized = serializeGroup(primitives, "        ");
  const semanticSerialized = serializeGroup(semantic, "        ");

  return `/** @type {import('tailwindcss').Config} */
/* Primitive ramps are concrete hex values; semantic tokens reference CSS vars
   defined by the generated :root / :root[data-theme="dark"] blocks, so
   dark-mode and runtime edits flow through naturally. */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        /* Primitive ramps */
${primitivesSerialized},
        /* Semantic tokens */
${semanticSerialized}
      }
    }
  }
}`;
}

// ---------------------------------------------------------------------------
// shadcn export — drop-in Tailwind v4 / shadcn theme CSS
//
// Shape mirrors tweakcn's v4 generator (semantic :root/.dark + @theme inline +
// @layer base), without dumping Lattice primitive ramps into the theme file.
// Radius scale uses the current shadcn Rhea multipliers (not the older ±px).
// ---------------------------------------------------------------------------

type ShadcnEntry = [string, string];
type MaybeEntry = [string, string | undefined];

/** Resolve a semantic token to its concrete value (following var() indirection). */
function resolved(
  tokens: Record<string, string>,
  prop: string
): string | undefined {
  const v = tokens[prop];
  return v ? resolveVar(v, tokens) : undefined;
}

/** Strip surrounding quotes from the first font name only (keep fallbacks). */
function unquoteFontFamily(value: string): string {
  return value.replace(/^'([^']*)'/, "$1").replace(/^"([^"]*)"/, "$1");
}

const SHADCN_COLOR_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

const SHADCN_SHADOW_KEYS = [
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
] as const;

function shadcnSemantic(
  tokens: Record<string, string>,
  isDark: boolean
): ShadcnEntry[] {
  const t = (k: string) => resolved(tokens, `--color-${k}`);
  const neutralStep = (step: number) => tokens[`--color-neutral-${step}`];
  const secondary = isDark ? neutralStep(800) : neutralStep(100);
  const input = isDark ? neutralStep(700) : neutralStep(200);

  // shadcn's chart palette intentionally reaches across the brand + status
  // palette; look up via semantic tokens so it tracks the user's configured
  // primary/accent/status hues rather than hard-coded role names.
  const chart = (name: string) => t(`background-${name}`) ?? "";

  const entries: MaybeEntry[] = [
    ["--background", t("background-base")],
    ["--foreground", t("foreground-onBase")],
    ["--card", t("background-raised")],
    ["--card-foreground", t("foreground-onRaised")],
    ["--popover", t("background-overlay")],
    ["--popover-foreground", t("foreground-onBase")],
    ["--primary", t("background-primary")],
    ["--primary-foreground", t("foreground-onPrimary")],
    ["--secondary", secondary],
    ["--secondary-foreground", t("foreground-onBase")],
    ["--muted", t("background-sunken")],
    ["--muted-foreground", t("foreground-onBaseMuted")],
    ["--accent", t("background-accent")],
    ["--accent-foreground", t("foreground-onAccent")],
    ["--destructive", t("background-critical")],
    ["--destructive-foreground", t("foreground-onCritical")],
    ["--border", isDark ? neutralStep(700) : neutralStep(200)],
    ["--input", input],
    ["--ring", t("background-primary")],
    ["--chart-1", chart("primary")],
    ["--chart-2", chart("accent")],
    ["--chart-3", chart("success")],
    ["--chart-4", chart("warning")],
    ["--chart-5", chart("info")],
    ["--sidebar", t("background-sunken")],
    ["--sidebar-foreground", t("foreground-onSunken")],
    ["--sidebar-primary", t("background-primary")],
    ["--sidebar-primary-foreground", t("foreground-onPrimary")],
    ["--sidebar-accent", t("background-accent")],
    ["--sidebar-accent-foreground", t("foreground-onAccent")],
    ["--sidebar-border", isDark ? neutralStep(700) : neutralStep(200)],
    ["--sidebar-ring", t("background-primary")],
  ];
  return entries.filter(
    (e): e is ShadcnEntry => typeof e[1] === "string" && e[1].length > 0
  );
}

/** Default density base (px) — radius in Components preview uses this so
 * Spacing (density) doesn't look like it's changing Rounding. */
const RADIUS_PREVIEW_BASE_PX = 8;
/** Tailwind `--spacing` unit at default density (matches stock TW). */
const SPACING_UNIT_DEFAULT_REM = 0.25;

/**
 * Resolve `--shape-radius-*` against the default density ladder, not the
 * live `--dimension-*` values (those scale with Spacing).
 */
function resolveRadiusAtDefaultDensity(
  tokens: Record<string, string>,
  shapeKey = "--shape-radius-container"
): string {
  const raw = tokens[shapeKey] || "0.625rem";
  const ref = varReferencedName(raw);
  if (ref?.startsWith("--dimension-")) {
    const step = ref.slice("--dimension-".length);
    if (step === "max") {
      return "999px";
    }
    const n = Number(step);
    if (!Number.isNaN(n)) {
      return `${(RADIUS_PREVIEW_BASE_PX * n) / 100}px`;
    }
  }
  return resolveVar(raw, tokens);
}

/** Map Lattice density (`--dimension-100`) → Tailwind spacing unit. */
function spacingUnitFromDensity(tokens: Record<string, string>): string {
  const dim100 = tokens["--dimension-100"];
  const px = dim100 ? Number.parseFloat(dim100) : RADIUS_PREVIEW_BASE_PX;
  if (!Number.isFinite(px) || px <= 0) {
    return `${SPACING_UNIT_DEFAULT_REM}rem`;
  }
  return `${SPACING_UNIT_DEFAULT_REM * (px / RADIUS_PREVIEW_BASE_PX)}rem`;
}

/** First rgba() alpha in a box-shadow shorthand (for Advanced opacity knobs). */
function firstRgbaOpacity(value: string, fallback: number): number {
  const match = /rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/.exec(value);
  if (!match?.[1]) {
    return fallback;
  }
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampOpacity(value: number): number {
  return Math.min(Math.max(value, 0), 0.55);
}

/** Bridge Lattice shadow presets onto preview elevation.
 * Lattice `--shadow-raised` values are intentionally soft for product UIs and
 * nearly invisible on the cards demo (ring already defines the edge). Use a
 * clearer three-step stack so None / Subtle / Dramatic read in the preview.
 * Opacities scale from the generated tokens so Style Advanced sliders land.
 */
function applyShadowVars(
  vars: Record<string, string>,
  tokens: Record<string, string>
): void {
  const raisedToken = tokens["--shadow-raised"] ?? "none";
  const overlayToken = tokens["--shadow-overlay"] ?? "";
  const flat = raisedToken === "none";
  const dramatic = /20px|40px/.test(overlayToken);

  let raised: string;
  let mid: string;
  let overlay: string;
  if (flat) {
    raised = "none";
    mid = "none";
    overlay = "none";
  } else if (dramatic) {
    const scale = firstRgbaOpacity(overlayToken, 0.18) / 0.18 || 1;
    const r = clampOpacity(0.1 * scale);
    const m = clampOpacity(0.12 * scale);
    const o = clampOpacity(0.22 * scale);
    raised = `0 4px 6px -1px rgba(15, 23, 42, ${r}), 0 10px 28px -6px rgba(15, 23, 42, ${clampOpacity(0.16 * scale)})`;
    mid = `0 8px 16px -4px rgba(15, 23, 42, ${m}), 0 16px 40px -8px rgba(15, 23, 42, ${clampOpacity(0.18 * scale)})`;
    overlay = `0 20px 40px -8px rgba(15, 23, 42, ${o}), 0 8px 16px -4px rgba(15, 23, 42, ${m})`;
  } else {
    const scale = firstRgbaOpacity(overlayToken, 0.1) / 0.1 || 1;
    const raisedScale = firstRgbaOpacity(raisedToken, 0.06) / 0.06 || 1;
    const r = clampOpacity(0.06 * raisedScale);
    const r2 = clampOpacity(0.1 * raisedScale);
    const m = clampOpacity(0.06 * scale);
    const m2 = clampOpacity(0.08 * scale);
    const o = clampOpacity(0.08 * scale);
    const o2 = clampOpacity(0.1 * scale);
    raised = `0 1px 2px rgba(15, 23, 42, ${r}), 0 1px 3px rgba(15, 23, 42, ${r2})`;
    mid = `0 2px 4px rgba(15, 23, 42, ${m}), 0 4px 10px rgba(15, 23, 42, ${m2})`;
    overlay = `0 4px 6px -1px rgba(15, 23, 42, ${o}), 0 10px 20px -4px rgba(15, 23, 42, ${o2})`;
  }

  vars["--shadow-raised"] = raised;
  vars["--shadow-overlay"] = flat ? overlayToken : overlay;

  vars["--shadow-2xs"] = raised;
  vars["--shadow-xs"] = raised;
  vars["--shadow-sm"] = raised;
  vars["--shadow"] = raised;
  vars["--shadow-md"] = mid;
  vars["--shadow-lg"] = overlay;
  vars["--shadow-xl"] = overlay;
  vars["--shadow-2xl"] = overlay;
}

/**
 * Every `toShadcnCssVars` entry is preview-scoped. Do not apply the map on
 * `<html>` — mount it on the Components preview root (and portal into that
 * tree) so BrandIntake chrome never inherits brand tokens.
 */
export function isPreviewScopedShadcnVar(_key: string): boolean {
  return true;
}

/**
 * Map Lattice design tokens → shadcn CSS variables for the Components preview
 * (and live theme injection). Includes colors, fonts, radius, spacing, and
 * shadows so Style / Typography controls update the cards demo.
 * Secondary/accent fills stay muted like the shadcn homepage; brand hue still
 * drives --primary / charts.
 */
export function toShadcnCssVars(
  tokens: Record<string, string>,
  isDark = false
): Record<string, string> {
  const entries = shadcnSemantic(tokens, isDark);
  const mutedAccent = isDark
    ? tokens["--color-neutral-800"]
    : tokens["--color-neutral-100"];
  const onBase = resolved(tokens, "--color-foreground-onBase");

  const vars = Object.fromEntries(entries);
  if (mutedAccent) {
    vars["--secondary"] = mutedAccent;
    vars["--accent"] = mutedAccent;
    vars["--sidebar-accent"] = mutedAccent;
  }
  if (onBase) {
    vars["--secondary-foreground"] = onBase;
    vars["--accent-foreground"] = onBase;
    vars["--sidebar-accent-foreground"] = onBase;
  }

  vars["--font-sans"] = unquoteFontFamily(
    tokens["--typography-font-family-body"] || "system-ui, sans-serif"
  );
  vars["--font-serif"] = unquoteFontFamily(
    tokens["--typography-font-family-heading"] ||
      'Georgia, Cambria, "Times New Roman", Times, serif'
  );
  vars["--font-mono"] = unquoteFontFamily(
    tokens["--typography-font-family-mono"] ||
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  );

  // Rounding only — do not let density-scaled dimensions change --radius.
  vars["--radius"] = resolveRadiusAtDefaultDensity(tokens);
  // Spacing (density) → Tailwind spacing unit (cards use --spacing(N)).
  vars["--spacing"] = spacingUnitFromDensity(tokens);
  applyShadowVars(vars, tokens);

  // Remap Tailwind font-* utilities onto Lattice weight slots so Style /
  // Typography weight pills update shadcn cards (font-medium, font-semibold…).
  const weightLight = resolved(tokens, "--font-body-weight-light") ?? "300";
  const weightRegular = resolved(tokens, "--font-body-weight-regular") ?? "400";
  const weightMedium = resolved(tokens, "--font-body-weight-medium") ?? "500";
  const weightBold = resolved(tokens, "--font-body-weight-bold") ?? "700";
  const weightHeading = resolved(tokens, "--font-heading-weight") ?? "600";

  vars["--font-body-weight-light"] = weightLight;
  vars["--font-body-weight-regular"] = weightRegular;
  vars["--font-body-weight-medium"] = weightMedium;
  vars["--font-body-weight-bold"] = weightBold;
  vars["--font-heading-weight"] = weightHeading;

  vars["--font-weight-light"] = weightLight;
  vars["--font-weight-normal"] = weightRegular;
  vars["--font-weight-medium"] = weightMedium;
  vars["--font-weight-semibold"] = weightHeading;
  vars["--font-weight-bold"] = weightBold;

  return vars;
}

/** Font / radius / tracking / spacing — light-mode only (same as tweakcn). */
function shadcnTypographyExtras(tokens: Record<string, string>): ShadcnEntry[] {
  const fontSans = unquoteFontFamily(
    tokens["--typography-font-family-body"] || "system-ui, sans-serif"
  );
  const fontSerif = unquoteFontFamily(
    tokens["--typography-font-family-heading"] ||
      'Georgia, Cambria, "Times New Roman", Times, serif'
  );
  const radius = resolveVar(
    tokens["--shape-radius-container"] || "0.625rem",
    tokens
  );
  return [
    ["--font-sans", fontSans],
    ["--font-serif", fontSerif],
    [
      "--font-mono",
      unquoteFontFamily(
        tokens["--typography-font-family-mono"] ||
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      ),
    ],
    ["--radius", radius],
    ["--tracking-normal", "0em"],
    ["--spacing", "0.25rem"],
  ];
}

/**
 * Shadow stack aligned with tweakcn's exported vars. Lattice doesn't expose
 * per-size shadow knobs yet, so defaults stay stable and paste-compatible.
 */
function shadcnShadowExtras(): ShadcnEntry[] {
  const color = (opacity: number) => `hsl(0 0% 0% / ${opacity})`;
  return [
    ["--shadow-x", "0px"],
    ["--shadow-y", "1px"],
    ["--shadow-blur", "3px"],
    ["--shadow-spread", "0px"],
    ["--shadow-opacity", "0.1"],
    ["--shadow-color", "hsl(0 0% 0%)"],
    ["--shadow-2xs", `0px 1px 3px 0px ${color(0.05)}`],
    ["--shadow-xs", `0px 1px 3px 0px ${color(0.05)}`],
    [
      "--shadow-sm",
      `0px 1px 3px 0px ${color(0.1)}, 0px 1px 2px -1px ${color(0.1)}`,
    ],
    [
      "--shadow",
      `0px 1px 3px 0px ${color(0.1)}, 0px 1px 2px -1px ${color(0.1)}`,
    ],
    [
      "--shadow-md",
      `0px 1px 3px 0px ${color(0.1)}, 0px 2px 4px -1px ${color(0.1)}`,
    ],
    [
      "--shadow-lg",
      `0px 1px 3px 0px ${color(0.1)}, 0px 4px 6px -1px ${color(0.1)}`,
    ],
    [
      "--shadow-xl",
      `0px 1px 3px 0px ${color(0.1)}, 0px 8px 10px -1px ${color(0.1)}`,
    ],
    ["--shadow-2xl", `0px 1px 3px 0px ${color(0.25)}`],
  ];
}

const COLOR_VALUE_PREFIX_PATTERN = /^(#|rgb|hsl|oklch|lab|lch)/i;

function formatShadcnValue(raw: string, space: ColorSpace): string {
  return COLOR_VALUE_PREFIX_PATTERN.test(raw.trim())
    ? convertLiteral(raw, space)
    : raw;
}

function renderShadcnSelector(
  selector: string,
  entries: ShadcnEntry[],
  space: ColorSpace
): string {
  const lines = [`${selector} {`];
  for (const [prop, raw] of entries) {
    lines.push(`  ${prop}: ${formatShadcnValue(raw, space)};`);
  }
  lines.push("}");
  return lines.join("\n");
}

/** Tailwind v4 bridge — required for utilities like `bg-primary` to resolve. */
function renderShadcnThemeInline(trackingNormal: string): string {
  const colorLines = SHADCN_COLOR_KEYS.map(
    (key) => `  --color-${key}: var(--${key});`
  );
  const shadowLines = SHADCN_SHADOW_KEYS.map(
    (key) => `  --${key}: var(--${key});`
  );

  const trackingBlock =
    trackingNormal === "0em"
      ? ""
      : `
  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);`;

  return `@theme inline {
${colorLines.join("\n")}

  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
  --font-mono: var(--font-mono);

  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);

${shadowLines.join("\n")}${trackingBlock}
}`;
}

function renderShadcnBaseLayer(trackingNormal: string): string {
  const bodyTracking =
    trackingNormal === "0em"
      ? ""
      : "\n    letter-spacing: var(--tracking-normal);";
  return `@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;${bodyTracking}
  }
}`;
}

/**
 * Emit a paste-ready shadcn / Tailwind v4 theme CSS file.
 * Primitive Lattice ramps stay in the `css` export — not here.
 */
function exportShadcn(set: TokenSet, space: ColorSpace): string {
  const typography = shadcnTypographyExtras(set.light);
  const shadows = shadcnShadowExtras();
  const trackingNormal =
    typography.find(([k]) => k === "--tracking-normal")?.[1] ?? "0em";

  const lightEntries: ShadcnEntry[] = [
    ...shadcnSemantic(set.light, false),
    ...typography,
    ...shadows,
  ];
  const darkEntries: ShadcnEntry[] = [
    ...shadcnSemantic(set.dark, true),
    ...shadows,
  ];

  const lightBlock = renderShadcnSelector(":root", lightEntries, space);
  const darkBlock = renderShadcnSelector(".dark", darkEntries, space);
  const themeInline = renderShadcnThemeInline(trackingNormal);
  const baseLayer = renderShadcnBaseLayer(trackingNormal);

  return [
    '@import "tailwindcss";',
    "",
    "@custom-variant dark (&:is(.dark *));",
    "",
    lightBlock,
    "",
    darkBlock,
    "",
    themeInline,
    "",
    baseLayer,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API
//
// The previous markdown "Guide" export has been retired in favor of the
// dedicated Agent Skills packages generated by `./skills/`. See
// `generateSkills(config, set)`.
// ---------------------------------------------------------------------------

export interface ExportOptions {
  includeSemantic?: boolean;
}

export function exportTokens(
  set: TokenSet,
  format: ExportFormat,
  space: ColorSpace,
  options: ExportOptions = {}
): string {
  const includeSemantic = options.includeSemantic ?? true;
  switch (format) {
    case "css":
      return exportCSS(set, space, includeSemantic);
    case "dtcg":
      return exportDTCG(set, space);
    case "tailwind":
      return exportTailwind(set, space);
    case "shadcn":
      return exportShadcn(set, space);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
