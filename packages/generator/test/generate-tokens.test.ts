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

  it("scales typography sizes by fontScale", () => {
    const { tokens } = generateDesignTokens(
      createBrandConfig({ fontScale: 1.25 }),
      false
    );
    expect(tokens["--typography-size-200"]).toBe("20px");
    expect(tokens["--typography-size-500"]).toBe("50px");
  });

  it("emits mono font family from monoFont", () => {
    const { tokens } = generateDesignTokens(
      createBrandConfig({ monoFont: "Fira Code" }),
      false
    );
    expect(tokens["--typography-font-family-mono"]).toContain("Fira Code");
    expect(tokens["--font-mono-family"]).toBe(
      "var(--typography-font-family-mono)"
    );
  });

  it("emits letterSpacing as typography tracking", () => {
    const { tokens } = generateDesignTokens(
      createBrandConfig({ letterSpacing: 0.025 }),
      false
    );
    expect(tokens["--typography-letter-spacing"]).toBe("0.025em");
    expect(tokens["--font-body-letter-spacing"]).toBe(
      "var(--typography-letter-spacing)"
    );
  });

  it("applies styleOverrides for dimension base and transitions", () => {
    const { tokens } = generateDesignTokens(
      createBrandConfig({
        styleOverrides: {
          dimensionBasePx: 12,
          transitionGradualMs: 600,
          transitionSwiftMs: 80,
        },
      }),
      false
    );
    expect(tokens["--dimension-100"]).toBe("12px");
    expect(tokens["--transition-swift-duration"]).toBe("80ms");
    expect(tokens["--transition-gradual-duration"]).toBe("600ms");
  });

  it("maps accent tokens to accent hue when useAccent is enabled", () => {
    const without = generateDesignTokens(createBrandConfig(), false);
    const withAccent = generateDesignTokens(
      createBrandConfig({
        accentColor: "#e11d48",
        useAccent: true,
        useCustomAccent: true,
      }),
      false
    );
    expect(withAccent.tokens["--color-background-accent"]).toBeDefined();
    expect(withAccent.tokens["--color-background-accent"]).not.toBe(
      without.tokens["--color-background-accent"]
    );
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
