import { describe, expect, it } from "vitest";
import {
  createBrandConfig,
  flattenSkillFiles,
  generateDesignTokens,
  generateSkills,
  HEADLESS_LIB_OPTIONS,
  skillEntryMarkdown,
} from "../src/index.js";

const FRONTMATTER_PATTERN = /^---\nname: .+\ndescription: >-\n/;
const PRIMARY_HUE_PATTERN = /Primary hue: `\w+`/;
const DESCRIPTION_TRIGGER_PATTERN = /use when|use before|not for/;

function buildSet(config: ReturnType<typeof createBrandConfig>) {
  return {
    dark: generateDesignTokens(config, true).tokens,
    light: generateDesignTokens(config, false).tokens,
  };
}

function entry(artifact: ReturnType<typeof generateSkills>[number]) {
  return skillEntryMarkdown(artifact);
}

function allText(artifact: ReturnType<typeof generateSkills>[number]) {
  return artifact.files.map((f) => f.content).join("\n");
}

describe("generateSkills", () => {
  it("generates Agent Skills packages with SKILL.md + references", () => {
    const config = createBrandConfig();
    const artifacts = generateSkills(config, buildSet(config));

    expect(artifacts).toHaveLength(3);
    expect(artifacts.map((a) => a.id)).toEqual([
      "tokens",
      "components",
      "accessibility",
    ]);
    expect(artifacts.map((a) => a.name)).toEqual([
      "tokens-and-theming",
      "component-creation",
      "accessibility-and-motion",
    ]);
    expect(artifacts.map((a) => a.rootDir)).toEqual([
      "skills/tokens-and-theming",
      "skills/component-creation",
      "skills/accessibility-and-motion",
    ]);

    for (const artifact of artifacts) {
      const skillMd = entry(artifact);
      expect(skillMd).toMatch(FRONTMATTER_PATTERN);
      expect(skillMd).toContain("## Read next");
      expect(skillMd).not.toContain("undefined");
      expect(skillMd).not.toContain("NaN");
      expect(artifact.files.some((f) => f.path === "SKILL.md")).toBe(true);
      expect(artifact.files.some((f) => f.path.startsWith("references/"))).toBe(
        true
      );
      expect(artifact.description.toLowerCase()).toMatch(
        DESCRIPTION_TRIGGER_PATTERN
      );
    }

    const flat = flattenSkillFiles(artifacts);
    expect(flat.some((f) => f.path.endsWith("/SKILL.md"))).toBe(true);
    expect(flat.length).toBeGreaterThan(artifacts.length * 2);
  });

  it("embeds resolved token references, not raw fallback property names", () => {
    const config = createBrandConfig();
    const set = buildSet(config);
    const [, components] = generateSkills(config, set);

    expect(allText(components)).toContain(
      `background: var(${"--color-background-primary"});`
    );
    expect(set.light["--color-background-primary"]).toBeDefined();
  });

  it.each(
    HEADLESS_LIB_OPTIONS
  )("produces a working dialog example for headlessLib=%s", (headlessLib) => {
    const config = createBrandConfig({ headlessLib });
    const [, components] = generateSkills(config, buildSet(config));

    expect(allText(components)).not.toContain("undefined");
    expect(allText(components)).not.toContain("NaN");
  });

  it("reflects config values (density, roundness, status colors) in the docs", () => {
    const config = createBrandConfig({
      density: "compact",
      roundness: "pill",
      statusColors: { error: "#123456" },
    });
    const [tokens, , accessibility] = generateSkills(config, buildSet(config));

    expect(allText(tokens)).toContain("**compact**");
    expect(allText(tokens)).toContain("**pill**");
    expect(allText(accessibility)).toContain("#123456");
  });

  it("lists supporting hues distinct from the primary and neutral ramps", () => {
    const config = createBrandConfig({
      accentColor: "#22c55e",
      primaryColor: "#2e7bab",
      useAccent: true,
    });
    const [tokens] = generateSkills(config, buildSet(config));

    expect(entry(tokens)).toMatch(PRIMARY_HUE_PATTERN);
    expect(entry(tokens)).toContain("Supporting hues:");
  });

  it("ships a token-usage lint script on the accessibility skill", () => {
    const config = createBrandConfig();
    const [, , accessibility] = generateSkills(config, buildSet(config));
    const script = accessibility.files.find(
      (f) => f.path === "scripts/lint-token-usage.mjs"
    );
    expect(script?.content).toContain("lint-token-usage");
    expect(script?.content).toContain("process.exit");
  });

  it("passes Agent Skills structural checks (skills-ref invariants)", () => {
    const config = createBrandConfig();
    const artifacts = generateSkills(config, buildSet(config));

    for (const artifact of artifacts) {
      expect(artifact.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(artifact.name.length).toBeLessThanOrEqual(64);
      expect(artifact.rootDir).toBe(`skills/${artifact.name}`);
      expect(artifact.description.length).toBeGreaterThan(0);
      expect(artifact.description.length).toBeLessThanOrEqual(1024);

      const skillMd = entry(artifact);
      const nameMatch = skillMd.match(/^---\nname: (.+)\n/);
      expect(nameMatch?.[1]).toBe(artifact.name);

      // Lean entry: keep activation under the recommended ~500-line budget.
      expect(skillMd.split("\n").length).toBeLessThan(120);

      // Progressive disclosure: detail lives one level deep in references/.
      for (const file of artifact.files) {
        if (file.path.startsWith("references/")) {
          expect(file.path.split("/")).toHaveLength(2);
        }
      }
    }
  });
});
