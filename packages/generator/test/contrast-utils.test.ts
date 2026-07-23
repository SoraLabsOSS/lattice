import { describe, expect, it } from "vitest";
import { generateRamp } from "../src/color-utils.js";
import { pickContrastingFg, pickStep } from "../src/contrast-utils.js";

describe("contrast-utils", () => {
  describe("pickStep", () => {
    it("returns the step whose lightness is closest to the target", () => {
      const ramp = generateRamp("#2e7bab");
      expect(pickStep(ramp, 0.98)).toBe(50);
      expect(pickStep(ramp, 0.32)).toBe(900);
    });
  });

  describe("pickContrastingFg", () => {
    it("walks light-to-dark in light mode and returns the first AA-passing step", () => {
      const ramp = generateRamp("#2e7bab");
      const { hex, step } = pickContrastingFg("#ffffff", ramp, false);
      expect(step).not.toBeNull();
      expect(hex).toBe(ramp[step as keyof typeof ramp]);
    });

    it("walks dark-to-light in dark mode", () => {
      const ramp = generateRamp("#2e7bab");
      const { step } = pickContrastingFg("#000000", ramp, true);
      expect(step).not.toBeNull();
    });

    it("falls back to pure white/black when no ramp step reaches the ratio", () => {
      const ramp = generateRamp("#808080", 10);
      const { hex, step } = pickContrastingFg("#7f7f7f", ramp, false, 21);
      expect(step).toBeNull();
      expect(hex).toBe("#ffffff");
    });
  });
});
