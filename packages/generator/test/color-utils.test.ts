import { describe, expect, it } from "vitest";
import {
  adjustLightness,
  flipRamp,
  generateRamp,
  getContrastColor,
  invertForDarkMode,
  STEPS,
} from "../src/color-utils.js";

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

describe("color-utils", () => {
  describe("generateRamp", () => {
    it("produces a hex value for every step, lightest at 50 and darkest at 900", () => {
      const ramp = generateRamp("#2e7bab");

      for (const step of STEPS) {
        expect(ramp[step]).toMatch(HEX_COLOR_PATTERN);
      }
      expect(ramp[50]).not.toBe(ramp[900]);
    });

    it("clamps neutral ramps to near-zero chroma regardless of input saturation", () => {
      const neutral = generateRamp("#2e7bab", 100, true);
      const chromatic = generateRamp("#2e7bab", 100, false);

      expect(neutral[600]).not.toBe(chromatic[600]);
    });
  });

  describe("flipRamp", () => {
    it("swaps step 50<->900, 100<->800, ... and is self-inverse", () => {
      const ramp = generateRamp("#2e7bab");
      const flipped = flipRamp(ramp);

      expect(flipped[50]).toBe(ramp[900]);
      expect(flipped[900]).toBe(ramp[50]);
      expect(flipped[400]).toBe(ramp[500]);
      expect(flipRamp(flipped)).toEqual(ramp);
    });
  });

  describe("invertForDarkMode", () => {
    it("inverts lightness per step while preserving hue", () => {
      const ramp = generateRamp("#2e7bab");
      const inverted = invertForDarkMode(ramp);

      expect(inverted[100]).not.toBe(ramp[100]);
      for (const step of STEPS) {
        expect(inverted[step]).toMatch(HEX_COLOR_PATTERN);
      }
    });
  });

  describe("getContrastColor", () => {
    it("picks black text on a light background", () => {
      expect(getContrastColor("#ffffff")).toBe("#000000");
    });

    it("picks white text on a dark background", () => {
      expect(getContrastColor("#000000")).toBe("#ffffff");
    });

    it("falls back to black for an unparsable color", () => {
      expect(getContrastColor("not-a-color")).toBe("#000000");
    });
  });

  describe("adjustLightness", () => {
    it("shifts lightness up and clamps at 1", () => {
      const lightened = adjustLightness("#202020", 0.9);
      expect(lightened).not.toBe("#202020");
      expect(lightened).toMatch(HEX_COLOR_PATTERN);
    });

    it("returns the input unchanged when the color can't be parsed", () => {
      expect(adjustLightness("not-a-color", 0.1)).toBe("not-a-color");
    });
  });
});
