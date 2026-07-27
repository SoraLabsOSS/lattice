import { describe, expect, it } from "vitest";
import {
  createBrandConfig,
  generateDesignTokens,
  generateSkills,
  HEADLESS_LIB_OPTIONS,
} from "../src/index.js";

const FRONTMATTER_PATTERN = /^---\nname: .+\ndescription: .+\n---\n/;
const PRIMARY_HUE_PATTERN = /Primary hue: `\w+`/;

function buildSet(config: ReturnType<typeof createBrandConfig>) {
  return {
    dark: generateDesignTokens(config, true).tokens,
    light: generateDesignTokens(config, false).tokens,
  };
}

describe("generateSkills", () => {
  it("generates all three skill artifacts with the expected shape", () => {
    const config = createBrandConfig();
    const artifacts = generateSkills(config, buildSet(config));

    expect(artifacts).toHaveLength(3);
    expect(artifacts.map((a) => a.id)).toEqual([
      "tokens",
      "components",
      "accessibility",
    ]);
    expect(artifacts.map((a) => a.filename)).toEqual([
      "tokens-and-theming.skill.md",
      "component-creation.skill.md",
      "accessibility-and-motion.skill.md",
    ]);

    for (const artifact of artifacts) {
      expect(artifact.content).toMatch(FRONTMATTER_PATTERN);
      expect(artifact.content).not.toContain("undefined");
      expect(artifact.content).not.toContain("NaN");
      expect(artifact.content.length).toBeGreaterThan(200);
    }
  });

  it("embeds resolved token references, not raw fallback property names", () => {
    const config = createBrandConfig();
    const set = buildSet(config);
    const [, components] = generateSkills(config, set);

    expect(components.content).toContain(
      `background: var(${"--color-background-primary"});`
    );
    expect(set.light["--color-background-primary"]).toBeDefined();
  });

  it.each(
    HEADLESS_LIB_OPTIONS
  )("produces a working dialog example for headlessLib=%s", (headlessLib) => {
    const config = createBrandConfig({ headlessLib });
    const [, components] = generateSkills(config, buildSet(config));

    expect(components.content).not.toContain("undefined");
    expect(components.content).not.toContain("NaN");
  });

  it("reflects config values (density, roundness, status colors) in the docs", () => {
    const config = createBrandConfig({
      density: "compact",
      roundness: "pill",
      statusColors: { error: "#123456" },
    });
    const [tokens, , accessibility] = generateSkills(config, buildSet(config));

    expect(tokens.content).toContain("Density is configured to **compact**");
    expect(tokens.content).toContain("Configured roundness preset: **pill**");
    expect(accessibility.content).toContain("#123456");
  });

  it("lists supporting hues distinct from the primary and neutral ramps", () => {
    const config = createBrandConfig({
      accentColor: "#22c55e",
      primaryColor: "#2e7bab",
      useAccent: true,
    });
    const [tokens] = generateSkills(config, buildSet(config));

    expect(tokens.content).toMatch(PRIMARY_HUE_PATTERN);
    expect(tokens.content).toContain("Supporting hues:");
  });
});
