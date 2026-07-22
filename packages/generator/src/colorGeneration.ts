import { converter, displayable, formatHex, wcagContrast } from "culori";
import { type ColorRamp, type NeutralColorRamp, STEPS } from "./colorUtils.js";

export const toOklch = converter("oklch");

// ========== Generation Modes (for secondary color) ===========================

export const GENERATION_MODES = [
  { id: "complementary", label: "Complementary", offset: 180 },
  { id: "split-complementary", label: "Split Complementary", offset: 150 },
  { id: "triadic", label: "Triadic", offset: 120 },
  { id: "analogous", label: "Analogous", offset: 30 },
  { id: "tetradic", label: "Tetradic", offset: 90 },
  { id: "monochromatic", label: "Monochromatic", offset: 0 },
] as const;

export type GenerationMode = (typeof GENERATION_MODES)[number]["id"];

export function getGeneratedColor(
  baseHex: string,
  mode: GenerationMode
): string {
  const base = toOklch(baseHex);
  if (!base) {
    return baseHex;
  }

  const modeConfig = GENERATION_MODES.find((m) => m.id === mode);
  const offset = modeConfig ? modeConfig.offset : 180;

  return (
    formatHex({
      c: base.c,
      h: ((base.h || 0) + offset) % 360,
      l: base.l,
      mode: "oklch",
    }) || baseHex
  );
}

/**
 * Derive a hover color from an exact-input primary by shifting lightness:
 * darker in light mode, lighter in dark mode. Preserves hue and chroma
 * (chroma re-clamped to gamut at the new lightness).
 */
export function deriveHoverFromInput(hex: string, mode: ColorMode): string {
  const o = toOklch(hex);
  if (!o) {
    return hex;
  }
  const L =
    mode === "dark"
      ? Math.min((o.l ?? 0.5) + 0.06, 0.95)
      : Math.max((o.l ?? 0.5) - 0.06, 0.05);
  const H = o.h ?? 0;
  const C = Math.min(o.c ?? 0, maxChromaForLH(L, H));
  return formatHex({ c: C, h: H, l: L, mode: "oklch" }) ?? hex;
}

// ========== Primary Contrast Guardrail =======================================

/**
 * Minimum WCAG contrast required between the exact-input primary and the
 * base background. 3:1 is the WCAG AA threshold for UI components / graphical
 * elements — appropriate for button/border surfaces. (Text legibility is
 * handled separately by `foreground-onPrimary`.)
 */
export const MIN_PRIMARY_CONTRAST = 3.0;

export interface PrimaryContrastClampResult {
  /** True if the input was nudged to meet the contrast threshold. */
  adjusted: boolean;
  /** Hex that should be emitted as the primary primitive. */
  applied: string;
  /** WCAG contrast of `applied` vs. baseBgHex. */
  contrastAfter: number;
  /** WCAG contrast of the original input vs. baseBgHex. */
  contrastBefore: number;
  /** Which mode triggered the adjustment (informational). */
  mode: ColorMode;
  /** Original input hex (unchanged from `config.primaryColor`). */
  original: string;
}

/**
 * Ensure the exact-input primary maintains readable contrast against the
 * mode's base background. If the input falls below `MIN_PRIMARY_CONTRAST`,
 * walk OKLCH lightness toward the opposite of the background (darker on
 * light bg, lighter on dark bg) in small steps until the threshold is met.
 * Preserves hue; chroma is re-clamped to gamut at the new lightness.
 */
export function clampPrimaryForContrast(
  hex: string,
  baseBgHex: string,
  mode: ColorMode
): PrimaryContrastClampResult {
  const initialContrast = wcagContrast(hex, baseBgHex) ?? 1;
  if (initialContrast >= MIN_PRIMARY_CONTRAST) {
    return {
      adjusted: false,
      applied: hex,
      contrastAfter: initialContrast,
      contrastBefore: initialContrast,
      mode,
      original: hex,
    };
  }

  const o = toOklch(hex);
  if (!o) {
    return {
      adjusted: false,
      applied: hex,
      contrastAfter: initialContrast,
      contrastBefore: initialContrast,
      mode,
      original: hex,
    };
  }

  const H = o.h ?? 0;
  const startL = o.l ?? 0.5;
  const startC = o.c ?? 0;
  // Walk away from the bg: lighter when bg is dark, darker when bg is light.
  const direction = mode === "dark" ? +1 : -1;
  const stepL = 0.02;
  const minL = 0.1;
  const maxL = 0.92;

  let bestHex = hex;
  let bestContrast = initialContrast;

  for (let i = 1; i <= 50; i++) {
    const L = startL + direction * stepL * i;
    // Stop when we've walked past the safe lightness range in our direction
    // of travel. (The input itself might already sit outside [minL, maxL] —
    // walking toward the opposite side is still progress, so only break once
    // we cross the far bound.)
    if (direction < 0 && L < minL) {
      break;
    }
    if (direction > 0 && L > maxL) {
      break;
    }
    const C = Math.min(startC, maxChromaForLH(L, H));
    const candidate = formatHex({ c: C, h: H, l: L, mode: "oklch" });
    if (!candidate) {
      continue;
    }
    const contrast = wcagContrast(candidate, baseBgHex) ?? 1;
    if (contrast >= MIN_PRIMARY_CONTRAST) {
      return {
        adjusted: true,
        applied: candidate,
        contrastAfter: contrast,
        contrastBefore: initialContrast,
        mode,
        original: hex,
      };
    }
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestHex = candidate;
    }
  }

  // Couldn't reach the threshold within the lightness bounds — return the
  // best candidate we found so the surface is at least more legible.
  return {
    adjusted: bestHex !== hex,
    applied: bestHex,
    contrastAfter: bestContrast,
    contrastBefore: initialContrast,
    mode,
    original: hex,
  };
}

// ========== Named Hue System =================================================

export interface NamedHue {
  hue: number;
  name: string;
}

export const NAMED_HUES: NamedHue[] = [
  { hue: 25, name: "Red" },
  { hue: 55, name: "Orange" },
  { hue: 75, name: "Amber" },
  { hue: 95, name: "Yellow" },
  { hue: 125, name: "Lime" },
  { hue: 150, name: "Green" },
  { hue: 175, name: "Teal" },
  { hue: 200, name: "Cyan" },
  { hue: 240, name: "Blue" },
  { hue: 275, name: "Indigo" },
  { hue: 305, name: "Purple" },
  { hue: 345, name: "Pink" },
];

/** Hues that are always retained regardless of hue selection. */
export const SEMANTIC_HUES = ["Red", "Green", "Blue", "Yellow"];
const SEMANTIC_OCCUPATION_THRESHOLD = 24;

// ========== Lightness Targets ================================================

export const LIGHT_MODE_LIGHTNESS: Record<number, number> = {
  50: 0.965,
  100: 0.925,
  200: 0.87,
  300: 0.78,
  400: 0.68,
  500: 0.58,
  600: 0.48,
  700: 0.39,
  800: 0.31,
  900: 0.24,
};

// Step 50 = lightest tint, step 900 = darkest tint — same semantic as light mode,
// just tuned for dark-mode surfaces (peaks are less extreme than light mode).
// Used by the NEUTRAL ramp, which needs to reach genuinely deep surfaces.
export const DARK_MODE_LIGHTNESS: Record<number, number> = {
  50: 0.88,
  100: 0.77,
  200: 0.65,
  300: 0.56,
  400: 0.48,
  500: 0.4,
  600: 0.33,
  700: 0.27,
  800: 0.22,
  900: 0.18,
};

// Chromatic (primary/secondary/status/decorative) dark ramps use a shallower
// curve: the dark end stops well above the neutral floor. Once a chromatic ramp
// is flipped for dark mode, step 50 (subtle tinted surfaces) lands on the
// darkest shade — at very low lightness OKLCH chroma collapses, so subtle tints
// would read as muddy near-greys. Keeping the floor at ~0.30 preserves enough
// chroma for subtle surfaces to stay recognisably tinted against a dark base.
export const DARK_MODE_CHROMATIC_LIGHTNESS: Record<number, number> = {
  50: 0.9,
  100: 0.81,
  200: 0.72,
  300: 0.63,
  400: 0.55,
  500: 0.48,
  600: 0.42,
  700: 0.37,
  800: 0.33,
  900: 0.3,
};

// ========== Gamut Utilities ==================================================

function isInGamut(L: number, C: number, H: number): boolean {
  return displayable({ c: C, h: H, l: L, mode: "oklch" });
}

/** Max chroma cache: keyed by `${hue_rounded}-${lightness_rounded}` */
const maxChromaCache = new Map<string, number>();

/** Find the maximum chroma that fits in sRGB for a given lightness and hue. */
export function maxChromaForLH(L: number, H: number): number {
  // Round for cache efficiency (resolution ~0.01 L, ~1° H)
  const lKey = Math.round(L * 100);
  const hKey = Math.round(H);
  const key = `${hKey}-${lKey}`;

  const cached = maxChromaCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  let low = 0;
  let high = 0.4;

  while (high - low > 0.001) {
    const mid = (low + high) / 2;
    if (isInGamut(L, mid, H)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // 0.95 safety margin to avoid edge clipping
  const result = low * 0.95;
  maxChromaCache.set(key, result);
  return result;
}

// ========== Chroma Floor =====================================================

/**
 * Proportion of gamut-max chroma used as a floor at each step, scaled by input
 * saturation ratio. Lifts chroma at ramp extremes for vivid inputs so that the
 * entire ramp feels more cohesive with the input color.
 */
const CHROMA_FLOOR_FACTOR = 0.15;

// ========== Gaussian Chroma Distribution =====================================

function gaussianChroma(
  L: number,
  peakL: number,
  sigma: number,
  peakC: number
): number {
  return peakC * Math.exp(-0.5 * ((L - peakL) / sigma) ** 2);
}

// ========== Sigma Mapping ====================================================

/**
 * Map the UI chromaFalloff (0–100) to a Gaussian sigma.
 * Higher falloff → tighter bell → smaller sigma.
 *   falloff=0   → sigma=0.40 (very wide, uniform chroma)
 *   falloff=80  → sigma=0.20 (default-like)
 *   falloff=100 → sigma=0.15 (tight, chroma drops fast)
 */
export function falloffToSigma(chromaFalloff: number): number {
  return 0.15 + (1 - chromaFalloff / 100) * 0.25;
}

// ========== Hue Selection ====================================================

function angularDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

function findNearestHue(hue: number): NamedHue {
  let nearest = NAMED_HUES[0];
  let minDist = angularDistance(hue, nearest.hue);

  for (const nh of NAMED_HUES) {
    const dist = angularDistance(hue, nh.hue);
    if (dist < minDist) {
      minDist = dist;
      nearest = nh;
    }
  }

  return nearest;
}

export interface HueSlot {
  hue: number;
  isOriginal: boolean;
  isPrimary: boolean;
  name: string;
}

export interface HueSelection {
  dropped: { name: string; reason: string }[];
  primaryName: string;
  selected: HueSlot[];
}

/**
 * Select 9 chromatic hues from the 12 named hues using a greedy algorithm.
 */
export function selectHues(
  primaryHue: number,
  secondaryHue?: number
): HueSelection {
  const nearestNamed = findNearestHue(primaryHue);
  const secondary = typeof secondaryHue === "number" ? secondaryHue : null;

  const candidates: HueSlot[] = NAMED_HUES.map((h) => ({
    hue: h.name === nearestNamed.name ? primaryHue : h.hue,
    isOriginal: h.name !== nearestNamed.name,
    isPrimary: h.name === nearestNamed.name,
    name: h.name,
  }));

  const semanticCandidates = candidates.filter((c) =>
    SEMANTIC_HUES.includes(c.name)
  );
  const occupiedSemanticBy = new Map<string, "primary" | "secondary">();
  for (const semantic of semanticCandidates) {
    const primaryDistance = angularDistance(primaryHue, semantic.hue);
    const secondaryDistance =
      secondary === null
        ? Number.POSITIVE_INFINITY
        : angularDistance(secondary, semantic.hue);
    const minDistance = Math.min(primaryDistance, secondaryDistance);
    if (minDistance <= SEMANTIC_OCCUPATION_THRESHOLD) {
      occupiedSemanticBy.set(
        semantic.name,
        primaryDistance <= secondaryDistance ? "primary" : "secondary"
      );
    }
  }

  const selected: HueSlot[] = [];
  const primaryCandidate = candidates.find(
    (c) => c.name === nearestNamed.name
  )!;
  selected.push(primaryCandidate);

  for (const semantic of SEMANTIC_HUES) {
    if (semantic !== nearestNamed.name && !occupiedSemanticBy.has(semantic)) {
      const candidate = candidates.find((c) => c.name === semantic)!;
      selected.push(candidate);
    }
  }

  const excludedSemanticNames = new Set(
    Array.from(occupiedSemanticBy.keys()).filter(
      (name) => name !== nearestNamed.name
    )
  );
  const remaining = candidates.filter(
    (c) => !(selected.includes(c) || excludedSemanticNames.has(c.name))
  );

  while (selected.length < 9 && remaining.length > 0) {
    let bestCandidate: HueSlot | null = null;
    let bestMinDist = -1;

    for (const candidate of remaining) {
      let minDist = Number.POSITIVE_INFINITY;
      for (const sel of selected) {
        minDist = Math.min(minDist, angularDistance(candidate.hue, sel.hue));
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      selected.push(bestCandidate);
      remaining.splice(remaining.indexOf(bestCandidate), 1);
    }
  }

  const dropped = Array.from(occupiedSemanticBy.entries())
    .filter(([name]) => name !== nearestNamed.name)
    .map(([name, source]) => ({
      name,
      reason: `covered by ${source}`,
    }));

  dropped.push(
    ...remaining.map((r) => {
      let closestSelected = selected[0];
      let closestDist = angularDistance(r.hue, closestSelected.hue);
      for (const s of selected) {
        const dist = angularDistance(r.hue, s.hue);
        if (dist < closestDist) {
          closestDist = dist;
          closestSelected = s;
        }
      }
      return { name: r.name, reason: `too close to ${closestSelected.name}` };
    })
  );

  selected.sort((a, b) => a.hue - b.hue);

  return { dropped, primaryName: nearestNamed.name, selected };
}

// ========== Core Ramp Generation (Gaussian OKLCH) ============================

export type ColorMode = "light" | "dark";

interface GaussianParams {
  peakC: number;
  peakL: number;
  sigma: number;
}

/**
 * Compute the Gaussian parameters for a ramp given a hue and an anchor
 * chroma/lightness. This decouples peakC from the input: peakC is solved
 * such that the Gaussian passes through `anchorC` at `anchorL`.
 */
function computeGaussianParams(
  hue: number,
  anchorL: number,
  anchorC: number,
  sigma: number,
  mode: ColorMode
): GaussianParams {
  const peakL = mode === "dark" ? 0.65 : 0.6;
  const hueMaxC = maxChromaForLH(peakL, hue);

  // Normalized Gaussian value at the anchor's lightness (peakC = 1)
  const gaussianAtAnchor = gaussianChroma(anchorL, peakL, sigma, 1.0);

  let peakC: number;
  if (gaussianAtAnchor > 0.001) {
    peakC = Math.min(anchorC / gaussianAtAnchor, hueMaxC);
  } else {
    // Anchor is far from the peak — use hue max
    peakC = hueMaxC;
  }

  return { peakC, peakL, sigma };
}

/**
 * Generate a 10-step OKLCH color ramp using Gaussian chroma distribution.
 *
 * @param hue          OKLCH hue angle
 * @param baseChroma   Chroma of the anchor color (used to derive peakC)
 * @param baseL        Lightness of the anchor color
 * @param chromaFalloff 0–100 UI slider value (mapped to sigma internally)
 * @param options      Optional: mode ('light'|'dark'), sigma override, satRatio
 */
export function generateOklchRamp(
  hue: number,
  baseChroma: number,
  baseL: number,
  chromaFalloff = 0.8,
  options?: {
    mode?: ColorMode;
    sigma?: number;
    satRatio?: number;
  }
): ColorRamp {
  const mode = options?.mode ?? "light";
  const sigma =
    options?.sigma ??
    falloffToSigma(
      // Support legacy 0–1 range: if < 1.5 treat as fraction
      chromaFalloff > 1.5 ? chromaFalloff : chromaFalloff * 100
    );
  const satRatio = options?.satRatio ?? 0;

  const lightnessMap =
    mode === "dark" ? DARK_MODE_CHROMATIC_LIGHTNESS : LIGHT_MODE_LIGHTNESS;
  const { peakL, peakC } = computeGaussianParams(
    hue,
    baseL,
    baseChroma,
    sigma,
    mode
  );

  // Build the ramp
  const ramp: Partial<ColorRamp> = {};
  for (const step of STEPS) {
    const L = lightnessMap[step];
    const C_gaussian = gaussianChroma(L, peakL, sigma, peakC);
    const C_max = maxChromaForLH(L, hue);
    const C_floor = C_max * satRatio * CHROMA_FLOOR_FACTOR;
    const C = Math.min(Math.max(C_gaussian, C_floor), C_max);
    ramp[step as keyof ColorRamp] =
      formatHex({ c: C, h: hue, l: L, mode: "oklch" }) || "#808080";
  }

  return ramp as ColorRamp;
}

/**
 * Generate a neutral ramp tinted according to the chosen strategy.
 *
 * The neutral ramp includes two extra extremes beyond the standard 10 steps:
 *   - `0`    → near-white (L 0.99) for light mode / near-black for dark mode
 *   - `1050` → near-black (L ~0.20) for light mode / near-white for dark mode
 */
export function generateNeutralRamp(
  primaryHue: number,
  tintMode: "pure" | "cool" | "warm" | "brand-tinted",
  _baseL: number,
  _chromaFalloff = 0.8,
  options?: { mode?: ColorMode }
): NeutralColorRamp {
  const mode = options?.mode ?? "light";
  const isDark = mode === "dark";
  const lightnessMap = isDark ? DARK_MODE_LIGHTNESS : LIGHT_MODE_LIGHTNESS;

  let hue = 0;
  let peakNeutralC = 0;

  switch (tintMode) {
    case "pure":
      peakNeutralC = 0;
      break;
    case "warm":
      hue = 60;
      peakNeutralC = 0.012;
      break;
    case "cool":
      hue = 255;
      peakNeutralC = 0.012;
      break;
    case "brand-tinted":
      hue = primaryHue;
      // Slightly reduce tint for yellow-green hues which can feel overpowering
      peakNeutralC = primaryHue >= 70 && primaryHue <= 140 ? 0.007 : 0.009;
      break;
  }

  // Use a gentle Gaussian for neutral chroma distribution
  const neutralPeakL = 0.55;
  const neutralSigma = 0.3;

  const ramp: Partial<ColorRamp> = {};
  for (const step of STEPS) {
    const L = lightnessMap[step];
    const C =
      peakNeutralC > 0
        ? Math.min(
            gaussianChroma(L, neutralPeakL, neutralSigma, peakNeutralC),
            maxChromaForLH(L, hue)
          )
        : 0;
    ramp[step as keyof ColorRamp] =
      formatHex({ c: C, h: hue, l: L, mode: "oklch" }) || "#808080";
  }

  // Extreme endpoints
  const endpointC = (v: number) =>
    peakNeutralC > 0
      ? Math.min(
          gaussianChroma(v, neutralPeakL, neutralSigma, peakNeutralC),
          maxChromaForLH(v, hue)
        )
      : 0;

  if (isDark) {
    // Match light-mode ordering: step 0 = lightest extreme, step 1050 = darkest.
    // Consumers expect a monotonic ramp where higher step → darker color in both
    // modes; semantic tokens like `background-sunkenStrong` reach for neutral-1000
    // expecting it to be the deepest surface available.
    return {
      ...(ramp as ColorRamp),
      0:
        formatHex({ c: endpointC(0.95), h: hue, l: 0.95, mode: "oklch" }) ||
        "#f0f0f0",
      1050:
        formatHex({ c: endpointC(0.13), h: hue, l: 0.13, mode: "oklch" }) ||
        "#121212",
    };
  }

  return {
    ...(ramp as ColorRamp),
    0: formatHex({ c: 0, h: hue, l: 0.99, mode: "oklch" }) || "#fefefe",
    1050:
      formatHex({ c: endpointC(0.2), h: hue, l: 0.2, mode: "oklch" }) ||
      "#1a1a1a",
  };
}

// ========== Chroma Guardrails for Semantic/Accent Colors =====================

/**
 * Balance chroma across multiple ramps so no single hue dominates or recedes.
 * Operates on step 600 (the "solid" step) — if any ramp's chroma exceeds
 * 1.4× the average or falls below 0.6×, it's scaled proportionally.
 */
export function applyChromaGuardrails(
  ramps: { name: string; hue: number; ramp: ColorRamp }[]
): { name: string; hue: number; ramp: ColorRamp }[] {
  if (ramps.length === 0) {
    return ramps;
  }

  // Measure chroma at step 600 for each ramp
  const step600Chromas: { idx: number; C: number }[] = ramps.map((r, idx) => {
    const color = toOklch(r.ramp[600]);
    return { C: color?.c ?? 0, idx };
  });

  const avgC =
    step600Chromas.reduce((sum, s) => sum + s.C, 0) / step600Chromas.length;
  if (avgC < 0.001) {
    return ramps; // all near-zero, nothing to balance
  }

  const upperBound = avgC * 1.4;
  const lowerBound = avgC * 0.6;

  // Find ramps that need scaling
  const needsScaling = step600Chromas.some(
    (s) => s.C > upperBound || s.C < lowerBound
  );
  if (!needsScaling) {
    return ramps;
  }

  return ramps.map((r, idx) => {
    const measured = step600Chromas[idx].C;
    if (measured <= upperBound && measured >= lowerBound) {
      return r;
    }

    // Compute scaling factor
    const targetC = measured > upperBound ? upperBound : lowerBound;
    const scale = measured > 0.001 ? targetC / measured : 1;

    // Re-generate ramp with scaled chroma
    const newRamp: Partial<ColorRamp> = {};
    for (const step of STEPS) {
      const color = toOklch(r.ramp[step as keyof ColorRamp]);
      if (!color) {
        newRamp[step as keyof ColorRamp] = r.ramp[step as keyof ColorRamp];
        continue;
      }
      const scaledC = Math.min(
        color.c * scale,
        maxChromaForLH(color.l, color.h || 0)
      );
      newRamp[step as keyof ColorRamp] =
        formatHex({ c: scaledC, h: color.h || 0, l: color.l, mode: "oklch" }) ||
        r.ramp[step as keyof ColorRamp];
    }

    return { ...r, ramp: newRamp as ColorRamp };
  });
}
