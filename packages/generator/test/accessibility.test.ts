import { describe, expect, it } from "vitest";
import {
  type ContrastPair,
  validateWcagAaContrast,
} from "../src/accessibility.js";

describe("accessibility", () => {
  it("reports a failure when foreground/background don't meet the minimum ratio", () => {
    const tokens = {
      "--bg": "#888888",
      "--fg": "#999999",
    };
    const pairs: ContrastPair[] = [
      {
        background: "--bg",
        foreground: "--fg",
        minimum: 4.5,
        name: "low contrast",
      },
    ];

    const failures = validateWcagAaContrast(tokens, pairs);
    expect(failures).toHaveLength(1);
    expect(failures[0].name).toBe("low contrast");
    expect(failures[0].ratio).toBeLessThan(4.5);
  });

  it("passes when the ratio meets the minimum", () => {
    const tokens = {
      "--bg": "#ffffff",
      "--fg": "#000000",
    };
    const pairs: ContrastPair[] = [
      {
        background: "--bg",
        foreground: "--fg",
        minimum: 4.5,
        name: "high contrast",
      },
    ];

    expect(validateWcagAaContrast(tokens, pairs)).toEqual([]);
  });

  it("resolves var() references before measuring contrast", () => {
    const tokens = {
      "--alias-bg": "var(--real-bg)",
      "--fg": "#000000",
      "--real-bg": "#ffffff",
    };
    const pairs: ContrastPair[] = [
      {
        background: "--alias-bg",
        foreground: "--fg",
        minimum: 4.5,
        name: "aliased",
      },
    ];

    expect(validateWcagAaContrast(tokens, pairs)).toEqual([]);
  });

  it("treats an unresolved token name as a literal color value", () => {
    const tokens: Record<string, string> = {};
    const pairs: ContrastPair[] = [
      {
        background: "#ffffff",
        foreground: "#000000",
        minimum: 4.5,
        name: "literal",
      },
    ];

    expect(validateWcagAaContrast(tokens, pairs)).toEqual([]);
  });
});
