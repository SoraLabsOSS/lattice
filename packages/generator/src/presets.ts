import type { BrandConfigInput } from "./types.js";

/**
 * Curated brand seeds for the generator — not baked CSS themes.
 * Each entry is a BrandConfigInput; `generateDesignTokens` builds the ramps.
 * Colors drawn from well-known product palettes / Tailwind midtones as seeds.
 */
export interface BrandPreset {
  /** Swatch shown in the picker (usually primary). */
  color: string;
  config: BrandConfigInput;
  description: string;
  id: string;
  label: string;
}

export const BRAND_PRESETS: readonly BrandPreset[] = [
  {
    color: "#2e7bab",
    config: {
      density: "default",
      expressiveness: "balanced",
      headingFont: "Rubik",
      neutralTint: "brand-tinted",
      primaryColor: "#2e7bab",
      primaryFont: "Nunito",
      roundness: "rounded",
      secondaryGenerationMode: "complementary",
      shadows: "subtle",
    },
    description: "Calm product blue — Lattice default",
    id: "ocean",
    label: "Ocean",
  },
  {
    color: "#3ecf8e",
    config: {
      density: "default",
      expressiveness: "balanced",
      headingFont: "Inter",
      headingWeight: 600,
      neutralTint: "cool",
      primaryColor: "#3ecf8e",
      primaryFont: "Inter",
      roundness: "rounded",
      secondaryGenerationMode: "analogous",
      shadows: "subtle",
    },
    description: "Fresh green — developer tooling",
    id: "emerald",
    label: "Emerald",
  },
  {
    color: "#171717",
    config: {
      chromaFalloff: 90,
      density: "compact",
      expressiveness: "minimal",
      headingFont: "Inter",
      headingWeight: 500,
      neutralTint: "pure",
      primaryColor: "#171717",
      primaryFont: "Inter",
      roundness: "subtle",
      secondaryGenerationMode: "monochromatic",
      shadows: "none",
    },
    description: "Near-black mono — minimal SaaS",
    id: "ink",
    label: "Ink",
  },
  {
    color: "#635bff",
    config: {
      density: "default",
      expressiveness: "balanced",
      headingFont: "Plus Jakarta Sans",
      headingWeight: 600,
      neutralTint: "cool",
      primaryColor: "#635bff",
      primaryFont: "Plus Jakarta Sans",
      roundness: "rounded",
      secondaryGenerationMode: "complementary",
      shadows: "subtle",
    },
    description: "Electric indigo — payments / fintech",
    id: "iris",
    label: "Iris",
  },
  {
    color: "#5e6ad2",
    config: {
      density: "compact",
      expressiveness: "minimal",
      headingFont: "Inter",
      headingWeight: 500,
      neutralTint: "cool",
      primaryColor: "#5e6ad2",
      primaryFont: "Inter",
      roundness: "subtle",
      secondaryGenerationMode: "analogous",
      shadows: "subtle",
    },
    description: "Soft indigo — issue trackers",
    id: "periwinkle",
    label: "Periwinkle",
  },
  {
    color: "#3b82f6",
    config: {
      density: "default",
      expressiveness: "balanced",
      headingFont: "Inter",
      headingWeight: 600,
      neutralTint: "cool",
      primaryColor: "#3b82f6",
      primaryFont: "Inter",
      roundness: "rounded",
      secondaryGenerationMode: "complementary",
      shadows: "subtle",
    },
    description: "Classic Tailwind blue",
    id: "azure",
    label: "Azure",
  },
  {
    color: "#8b5cf6",
    config: {
      density: "default",
      expressiveness: "expressive",
      headingFont: "Space Grotesk",
      headingWeight: 600,
      neutralTint: "brand-tinted",
      primaryColor: "#8b5cf6",
      primaryFont: "Space Grotesk",
      roundness: "rounded",
      secondaryGenerationMode: "triadic",
      shadows: "dramatic",
    },
    description: "Bright purple — creative tools",
    id: "violet",
    label: "Violet",
  },
  {
    color: "#e11d48",
    config: {
      density: "comfortable",
      expressiveness: "expressive",
      headingFont: "Poppins",
      headingWeight: 600,
      neutralTint: "warm",
      primaryColor: "#e11d48",
      primaryFont: "Poppins",
      roundness: "pill",
      secondaryGenerationMode: "analogous",
      shadows: "subtle",
    },
    description: "Warm crimson — lifestyle / social",
    id: "rose",
    label: "Rose",
  },
  {
    color: "#d97706",
    config: {
      density: "comfortable",
      expressiveness: "expressive",
      headingFont: "Fraunces",
      headingWeight: 500,
      neutralTint: "warm",
      primaryColor: "#d97706",
      primaryFont: "DM Sans",
      roundness: "subtle",
      secondaryGenerationMode: "complementary",
      shadows: "subtle",
    },
    description: "Golden warmth — editorial",
    id: "amber",
    label: "Amber",
  },
  {
    color: "#0d9488",
    config: {
      density: "default",
      expressiveness: "balanced",
      headingFont: "Manrope",
      headingWeight: 600,
      neutralTint: "cool",
      primaryColor: "#0d9488",
      primaryFont: "Manrope",
      roundness: "rounded",
      secondaryGenerationMode: "analogous",
      shadows: "subtle",
    },
    description: "Cool teal — health / data",
    id: "teal",
    label: "Teal",
  },
  {
    color: "#475569",
    config: {
      chromaFalloff: 85,
      density: "compact",
      expressiveness: "minimal",
      headingFont: "IBM Plex Sans",
      headingWeight: 500,
      neutralTint: "cool",
      primaryColor: "#475569",
      primaryFont: "IBM Plex Sans",
      roundness: "sharp",
      secondaryGenerationMode: "monochromatic",
      shadows: "none",
    },
    description: "Neutral graphite — enterprise",
    id: "slate",
    label: "Slate",
  },
  {
    color: "#f97316",
    config: {
      density: "comfortable",
      expressiveness: "expressive",
      headingFont: "Nunito Sans",
      headingWeight: 700,
      neutralTint: "warm",
      primaryColor: "#f97316",
      primaryFont: "Nunito Sans",
      roundness: "rounded",
      secondaryGenerationMode: "complementary",
      shadows: "dramatic",
    },
    description: "Friendly orange — consumer apps",
    id: "coral",
    label: "Coral",
  },
] as const;

export function getBrandPreset(id: string): BrandPreset | undefined {
  return BRAND_PRESETS.find((preset) => preset.id === id);
}

/** Match a live config to a preset by primary color (case-insensitive hex). */
export function matchBrandPreset(
  primaryColor: string
): BrandPreset | undefined {
  const normalized = primaryColor.trim().toLowerCase();
  return BRAND_PRESETS.find(
    (preset) => preset.config.primaryColor?.toLowerCase() === normalized
  );
}
