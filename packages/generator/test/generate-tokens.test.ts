import { describe, expect, it } from "vitest";
import { createBrandConfig, generateDesignTokens } from "../src/index.js";

describe("generate-tokens: config-driven constants", () => {
  describe("density -> --dimension-100", () => {
    it.each([
      ["compact", "6px"],
      ["default", "8px"],
      ["comfortable", "10px"],
    ] as const)("density=%s -> %s", (density, expected) => {
      const config = createBrandConfig({ density });
      const { tokens } = generateDesignTokens(config, false);
      expect(tokens["--dimension-100"]).toBe(expected);
    });
  });

  describe("roundness -> --shape-radius-container", () => {
    it.each([
      ["sharp", "var(--dimension-0)"],
      ["subtle", "var(--dimension-100)"],
      ["rounded", "var(--dimension-200)"],
      ["pill", "var(--dimension-300)"],
    ] as const)("roundness=%s -> %s", (roundness, expected) => {
      const config = createBrandConfig({ roundness });
      const { tokens } = generateDesignTokens(config, false);
      expect(tokens["--shape-radius-container"]).toBe(expected);
    });
  });

  describe("expressiveness -> transition durations", () => {
    it.each([
      ["minimal", "100ms", "250ms"],
      ["balanced", "150ms", "350ms"],
      ["expressive", "250ms", "500ms"],
    ] as const)("expressiveness=%s -> swift=%s gradual=%s", (expressiveness, swift, gradual) => {
      const config = createBrandConfig({ expressiveness });
      const { tokens } = generateDesignTokens(config, false);
      expect(tokens["--transition-swift-duration"]).toBe(swift);
      expect(tokens["--transition-gradual-duration"]).toBe(gradual);
    });
  });

  it("emits the documented state opacity scale", () => {
    const { tokens } = generateDesignTokens(createBrandConfig(), false);

    expect(tokens["--state-opacity-hover"]).toBe("0.12");
    expect(tokens["--state-opacity-active"]).toBe("0.24");
    expect(tokens["--state-opacity-disabled"]).toBe("0.4");
  });

  it("emits the typography size ladder", () => {
    const { tokens } = generateDesignTokens(createBrandConfig(), false);

    expect(tokens["--typography-size-200"]).toBe("16px");
    expect(tokens["--typography-size-500"]).toBe("40px");
  });
});

describe("generate-tokens: unparseable primaryColor", () => {
  // Regression: a controlled hex input in the web app calls onChange (and
  // thus generateDesignTokens) on every keystroke, so primaryColor is
  // routinely an incomplete/invalid hex mid-typing (e.g. "#e", "#e44").
  // culori's wcagContrast throws on those instead of failing soft, and it's
  // reachable from multiple places in the pipeline (contrast clamping,
  // neutral-extreme selection) — this must never crash generation.
  it.each([
    "#e",
    "#e44",
    "#zzzzzz",
    "",
    "not-a-color",
  ])("falls back gracefully instead of throwing for primaryColor=%j", (invalidHex) => {
    const config = createBrandConfig({ primaryColor: invalidHex });
    expect(() => generateDesignTokens(config, false)).not.toThrow();
    expect(() => generateDesignTokens(config, true)).not.toThrow();

    const { tokens } = generateDesignTokens(config, false);
    expect(tokens["--color-background-primary"]).toBeDefined();
    expect(Object.keys(tokens).length).toBeGreaterThan(150);
  });

  it("does not mutate the caller's config object", () => {
    const config = createBrandConfig({ primaryColor: "#zzzzzz" });
    generateDesignTokens(config, false);
    expect(config.primaryColor).toBe("#zzzzzz");
  });
});
