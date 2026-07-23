import { wcagContrast } from "culori";
import { describe, expect, it } from "vitest";
import {
  clampPrimaryForContrast,
  falloffToSigma,
  getGeneratedColor,
  MIN_PRIMARY_CONTRAST,
  maxChromaForLH,
  selectHues,
} from "../src/color-generation.js";

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

describe("color-generation", () => {
  describe("getGeneratedColor", () => {
    it("rotates hue by 180deg for complementary", () => {
      const base = "#2e7bab";
      const complementary = getGeneratedColor(base, "complementary");
      expect(complementary).not.toBe(base);
      expect(complementary).toMatch(HEX_COLOR_PATTERN);
    });

    it("returns the same color for monochromatic (0deg offset)", () => {
      const base = "#2e7bab";
      expect(getGeneratedColor(base, "monochromatic")).toBe(base);
    });

    it("falls back to the input hex when it can't be parsed", () => {
      expect(getGeneratedColor("not-a-color", "triadic")).toBe("not-a-color");
    });
  });

  describe("clampPrimaryForContrast", () => {
    it("leaves an already-compliant color unadjusted", () => {
      const result = clampPrimaryForContrast("#000000", "#ffffff", "light");
      expect(result.adjusted).toBe(false);
      expect(result.applied).toBe("#000000");
    });

    it("darkens a too-light primary against a light background until AA passes", () => {
      const result = clampPrimaryForContrast("#f5f0e8", "#ffffff", "light");
      expect(result.adjusted).toBe(true);
      expect(result.contrastAfter).toBeGreaterThanOrEqual(
        MIN_PRIMARY_CONTRAST - 0.05
      );
      expect(wcagContrast(result.applied, "#ffffff")).toBeCloseTo(
        result.contrastAfter,
        1
      );
    });

    it("lightens a too-dark primary against a dark background until AA passes", () => {
      const result = clampPrimaryForContrast("#1a1005", "#000000", "dark");
      expect(result.adjusted).toBe(true);
      expect(result.contrastAfter).toBeGreaterThanOrEqual(
        MIN_PRIMARY_CONTRAST - 0.05
      );
    });
  });

  describe("maxChromaForLH", () => {
    it("returns near-zero chroma at the lightness extremes", () => {
      expect(maxChromaForLH(0, 240)).toBeCloseTo(0, 1);
      expect(maxChromaForLH(1, 240)).toBeCloseTo(0, 1);
    });

    it("returns positive chroma in the middle of the lightness range", () => {
      expect(maxChromaForLH(0.6, 240)).toBeGreaterThan(0);
    });
  });

  describe("falloffToSigma", () => {
    it("maps 0 -> widest sigma and 100 -> tightest sigma", () => {
      expect(falloffToSigma(0)).toBeCloseTo(0.4, 5);
      expect(falloffToSigma(100)).toBeCloseTo(0.15, 5);
    });
  });

  describe("selectHues", () => {
    it("selects up to 9 hues including the nearest named hue to the primary", () => {
      const result = selectHues(240);
      expect(result.selected.length).toBeLessThanOrEqual(9);
      expect(result.primaryName).toBe("Blue");
      expect(result.selected.some((h) => h.isPrimary)).toBe(true);
    });

    it("drops semantic hues that are occupied by the primary or secondary", () => {
      const result = selectHues(25, 30);
      const droppedNames = result.dropped.map((d) => d.name);
      expect(droppedNames.length).toBeGreaterThan(0);
    });
  });
});
