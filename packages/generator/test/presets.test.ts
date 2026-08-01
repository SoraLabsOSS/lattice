import { describe, expect, test } from "vitest";
import {
  BRAND_PRESETS,
  createBrandConfig,
  generateTheme,
  getBrandPreset,
  matchBrandPreset,
} from "../src/index.js";

describe("brand presets", () => {
  test("ships a unique id and primary for every preset", () => {
    const ids = new Set(BRAND_PRESETS.map((p) => p.id));
    const primaries = new Set(
      BRAND_PRESETS.map((p) => p.config.primaryColor?.toLowerCase())
    );
    expect(ids.size).toBe(BRAND_PRESETS.length);
    expect(primaries.size).toBe(BRAND_PRESETS.length);
  });

  test("getBrandPreset / matchBrandPreset resolve ocean", () => {
    expect(getBrandPreset("ocean")?.label).toBe("Ocean");
    expect(matchBrandPreset("#2E7BAB")?.id).toBe("ocean");
    expect(matchBrandPreset("#ffffff")).toBeUndefined();
  });

  test("every preset generates a theme without throwing", () => {
    for (const preset of BRAND_PRESETS) {
      const theme = generateTheme(preset.config);
      expect(theme.config.primaryColor).toBe(
        createBrandConfig(preset.config).primaryColor
      );
      expect(Object.keys(theme.tokens.light).length).toBeGreaterThan(0);
    }
  });
});
