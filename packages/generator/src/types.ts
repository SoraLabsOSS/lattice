import type { GenerationMode } from "./color-generation.js";
import type { ColorRamp, NeutralColorRamp } from "./color-utils.js";

export type { ColorRamp, NeutralColorRamp } from "./color-utils.js";

export const FONT_WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800, 900] as const;
export type FontWeight = (typeof FONT_WEIGHT_OPTIONS)[number];

export const HEADLESS_LIB_OPTIONS = [
  "base-ui",
  "radix",
  "react-aria",
  "headless-ui",
] as const;
export type HeadlessLib = (typeof HEADLESS_LIB_OPTIONS)[number];
export const DEFAULT_HEADLESS_LIB: HeadlessLib = "base-ui";

export interface BodyFontWeights {
  bold: FontWeight;
  light: FontWeight;
  regular: FontWeight;
}

export const DEFAULT_HEADING_WEIGHT: FontWeight = 400;
export const DEFAULT_BODY_WEIGHTS: BodyFontWeights = {
  bold: 700,
  light: 300,
  regular: 400,
};
export const DEFAULT_MONO_FONT = "JetBrains Mono";

export type RadiusRole =
  | "action"
  | "badge"
  | "container"
  | "field"
  | "subcontainer"
  | "supercontainer";

/** Optional fine-grained overrides applied after Style preset enums. */
export interface StyleOverrides {
  /** Overrides density base for `--dimension-*` (and thus spacing + radius refs). */
  dimensionBasePx?: number;
  /** Per-role radius CSS values; when set, replaces the preset entry for that role. */
  radii?: Partial<Record<RadiusRole, string>>;
  /** Multiplier on preset radius dimension steps (0.5–1.5). Ignored when `radii` set. */
  radiusScale?: number;
  shadowOverlay?: string;
  shadowRaised?: string;
  transitionGradualMs?: number;
  transitionSwiftMs?: number;
}

export interface BrandConfig {
  accentColor?: string;
  accentGenerationMode?: GenerationMode;
  accentRamp?: ColorRamp;
  bodyWeights: BodyFontWeights;
  chromaFalloff: number;
  customBodyFontName?: string;
  customHeadingFontName?: string;
  density: "compact" | "default" | "comfortable";
  expressiveness: "minimal" | "balanced" | "expressive";
  fontScale: number;
  headingFont: string;
  headingWeight: FontWeight;
  headlessLib: HeadlessLib;
  logoUrl?: string;
  /** Monospace typeface for code / mono UI. */
  monoFont: string;
  neutralRamp?: NeutralColorRamp;
  neutralTint: "pure" | "cool" | "warm" | "brand-tinted";
  primaryColor: string;
  primaryFont: string;
  primaryRamp?: ColorRamp;
  rampOverrides: Record<string, Partial<ColorRamp>>;
  roundness: "sharp" | "subtle" | "rounded" | "pill";
  secondaryColor?: string;
  secondaryGenerationMode?: GenerationMode;
  secondaryRamp?: ColorRamp;
  shadows: "none" | "subtle" | "dramatic";
  statusColors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  styleOverrides?: StyleOverrides;
  tertiaryColor?: string;
  tertiaryGenerationMode?: GenerationMode;
  tertiaryRamp?: ColorRamp;
  useAccent: boolean;
  useCustomAccent: boolean;
  useCustomSecondary: boolean;
  useCustomTertiary: boolean;
  useTertiary: boolean;
}

export type BrandConfigInput = Partial<
  Omit<BrandConfig, "statusColors" | "bodyWeights" | "rampOverrides">
> & {
  statusColors?: Partial<BrandConfig["statusColors"]>;
  bodyWeights?: Partial<BodyFontWeights>;
  rampOverrides?: BrandConfig["rampOverrides"];
};

export const initialConfig: BrandConfig = {
  accentGenerationMode: "triadic",
  bodyWeights: { ...DEFAULT_BODY_WEIGHTS },
  chromaFalloff: 80,
  density: "default",
  expressiveness: "balanced",
  fontScale: 1,
  headingFont: "Rubik",
  headingWeight: DEFAULT_HEADING_WEIGHT,
  headlessLib: DEFAULT_HEADLESS_LIB,
  monoFont: DEFAULT_MONO_FONT,
  neutralTint: "brand-tinted",
  primaryColor: "#2e7bab",
  primaryFont: "Nunito",
  rampOverrides: {},
  roundness: "rounded",
  secondaryGenerationMode: "complementary",
  shadows: "subtle",
  statusColors: {
    error: "#ef4444",
    info: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
  },
  tertiaryGenerationMode: "analogous",
  useAccent: false,
  useCustomAccent: false,
  useCustomSecondary: false,
  useCustomTertiary: false,
  useTertiary: false,
};

export function createBrandConfig(input: BrandConfigInput = {}): BrandConfig {
  return {
    ...initialConfig,
    ...input,
    bodyWeights: {
      ...initialConfig.bodyWeights,
      ...input.bodyWeights,
    },
    monoFont: input.monoFont ?? initialConfig.monoFont,
    rampOverrides: input.rampOverrides ?? {},
    statusColors: {
      ...initialConfig.statusColors,
      ...input.statusColors,
    },
    styleOverrides:
      input.styleOverrides === undefined
        ? initialConfig.styleOverrides
        : { ...initialConfig.styleOverrides, ...input.styleOverrides },
  };
}
