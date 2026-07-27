import { describe, expect, it } from "vitest";
import {
  createBrandConfig,
  type ExportFormat,
  exportTokens,
  generateDesignTokens,
  type TokenSet,
} from "../src/index.js";

function fixtureSet(overrides: Partial<Record<string, string>> = {}): TokenSet {
  const light: Record<string, string> = {
    "--color-background-base": "var(--color-neutral-0)",
    "--color-background-primary": "var(--color-blue-500)",
    "--color-blue-500": "#3b82f6",
    "--color-foreground-onBase": "var(--color-neutral-900)",
    "--color-foreground-onPrimary": "#ffffff",
    "--color-neutral-0": "#ffffff",
    "--color-neutral-900": "#111111",
    "--dimension-100": "8px",
    "--font-body-family": "'Inter', sans-serif",
    "--font-body-weight-regular": "400",
    "--shadow-md": "0 2px 4px rgba(0, 0, 0, 0.1)",
    "--shape-radius-container": "var(--dimension-100)",
    "--transition-fast": "150ms",
    "--typography-font-family-body": "'Inter', sans-serif",
    "--typography-size-200": "16px",
    "--typography-weight-400": "400",
    ...overrides,
  };
  return { dark: { ...light }, light };
}

describe("exportTokens", () => {
  it("throws on an unsupported format", () => {
    expect(() =>
      exportTokens(fixtureSet(), "yaml" as ExportFormat, "oklch")
    ).toThrow(/Unsupported export format/);
  });

  describe("css", () => {
    it("passes var() references through unchanged regardless of color space", () => {
      const output = exportTokens(fixtureSet(), "css", "hex");
      expect(output).toContain(
        "--color-background-base: var(--color-neutral-0);"
      );
    });

    it("converts color literals to the requested space", () => {
      const hex = exportTokens(fixtureSet(), "css", "hex");
      const rgb = exportTokens(fixtureSet(), "css", "rgb");
      const hsl = exportTokens(fixtureSet(), "css", "hsl");
      const oklch = exportTokens(fixtureSet(), "css", "oklch");

      expect(hex).toContain("--color-blue-500: #3b82f6;");
      expect(rgb).toMatch(/--color-blue-500: rgb\(/);
      expect(hsl).toMatch(/--color-blue-500: hsl\(/);
      expect(oklch).toMatch(/--color-blue-500: oklch\(/);
    });

    it("omits semantic categories when includeSemantic is false", () => {
      const output = exportTokens(fixtureSet(), "css", "oklch", {
        includeSemantic: false,
      });

      expect(output).toContain("--color-blue-500");
      expect(output).not.toContain("--color-background-base");
      expect(output).not.toContain("--font-body-family");
      expect(output).not.toContain("--typography-size-200");
    });

    it("only emits dark-mode props that actually differ from light", () => {
      const set = fixtureSet();
      set.dark = { ...set.light, "--color-blue-500": "#1e3a8a" };
      const output = exportTokens(set, "css", "hex");

      const darkSection = output.split(':root[data-theme="dark"]')[1];
      expect(darkSection).toContain("--color-blue-500: #1e3a8a;");
      expect(darkSection).not.toContain("--color-neutral-0");
    });

    it("leaves non-color values (shadows, transitions) untouched", () => {
      const output = exportTokens(fixtureSet(), "css", "hex");
      expect(output).toContain("--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1);");
      expect(output).toContain("--transition-fast: 150ms;");
    });
  });

  describe("dtcg", () => {
    it("produces valid JSON split into primitive and semantic buckets", () => {
      const output = exportTokens(fixtureSet(), "dtcg", "hex");
      const parsed = JSON.parse(output);

      expect(parsed.light.primitive.color.blue["500"].$type).toBe("color");
      expect(parsed.light.primitive.color.blue["500"].$value).toBe("#3b82f6");
      expect(parsed.light.semantic.color.background.base).toBeDefined();
    });

    it("turns var() references into DTCG {a.b.c} reference syntax", () => {
      const output = exportTokens(fixtureSet(), "dtcg", "hex");
      const parsed = JSON.parse(output);

      expect(parsed.light.semantic.color.background.base.$value).toBe(
        "{color.neutral.0}"
      );
    });

    it("assigns fontFamily/fontWeight/dimension $types for --font- tokens", () => {
      const output = exportTokens(fixtureSet(), "dtcg", "hex");
      const parsed = JSON.parse(output);

      expect(parsed.light.semantic.font.body.family.$type).toBe("fontFamily");
      expect(parsed.light.semantic.font.body.weight.regular.$type).toBe(
        "fontWeight"
      );
    });

    it("assigns fontFamily/fontWeight/dimension $types for --typography- tokens", () => {
      const output = exportTokens(fixtureSet(), "dtcg", "hex");
      const parsed = JSON.parse(output);

      expect(parsed.light.semantic.typography.font.family.body.$type).toBe(
        "fontFamily"
      );
      expect(parsed.light.semantic.typography.weight["400"].$type).toBe(
        "fontWeight"
      );
      expect(parsed.light.semantic.typography.size["200"].$type).toBe(
        "dimension"
      );
    });

    it("assigns shadow/other/dimension $types by simple prefix", () => {
      const output = exportTokens(fixtureSet(), "dtcg", "hex");
      const parsed = JSON.parse(output);

      expect(parsed.light.semantic.shadow.md.$type).toBe("shadow");
      expect(parsed.light.semantic.transition.fast.$type).toBe("other");
      expect(parsed.light.semantic.dimension["100"].$type).toBe("dimension");
    });
  });

  describe("tailwind", () => {
    it("emits primitive ramps as nested hex objects and semantic tokens as var() refs", () => {
      const output = exportTokens(fixtureSet(), "tailwind", "hex");

      expect(output).toContain("export default");
      expect(output).toMatch(/'blue':\s*{\s*500: '#3b82f6'/);
      expect(output).toContain(
        "'background': {\n          'base': 'var(--color-background-base)'"
      );
    });

    it("converts primitive values into the requested color space", () => {
      const output = exportTokens(fixtureSet(), "tailwind", "rgb");
      expect(output).toMatch(/500: 'rgb\(/);
    });
  });

  describe("shadcn", () => {
    it("wraps everything in an @layer base block with :root and .dark sections", () => {
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      expect(output).toContain("@layer base {");
      expect(output).toContain("  :root {");
      expect(output).toContain("  .dark {");
    });

    it("resolves semantic entries through var() indirection to concrete colors", () => {
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      expect(output).toContain("--background: #ffffff;");
      expect(output).toContain("--primary: #3b82f6;");
    });

    it("silently drops chart/semantic entries with no backing token instead of erroring", () => {
      // fixture only defines background-primary, so chart-1 resolves but
      // chart-2..5 (accent/success/warning/info) have no source token
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      expect(output).toContain("--chart-1: #3b82f6;");
      expect(output).not.toContain("--chart-2");
      expect(output).not.toContain("--accent:");
    });

    it("resolves the radius var() chain to a concrete value", () => {
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      expect(output).toContain("--radius: 8px;");
    });

    it("strips the quoted primary font name while preserving the unquoted fallback list", () => {
      // real generated values look like `'Nunito', system-ui, sans-serif`
      // (quoted name + unquoted fallback list) — only the surrounding
      // quotes around the first font name should be removed
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      expect(output).toContain("--font-sans: Inter, sans-serif;");
    });

    it("leaves an already-unquoted font family untouched", () => {
      const output = exportTokens(
        fixtureSet({
          "--typography-font-family-body": "system-ui, sans-serif",
        }),
        "shadcn",
        "hex"
      );
      expect(output).toContain("--font-sans: system-ui, sans-serif;");
    });
  });
});

describe("exportTokens against a real generated theme", () => {
  const set = {
    dark: generateDesignTokens(createBrandConfig(), true).tokens,
    light: generateDesignTokens(createBrandConfig(), false).tokens,
  };

  it.each<ExportFormat>([
    "css",
    "dtcg",
    "tailwind",
    "shadcn",
  ])("produces non-empty %s output for every color space", (format) => {
    for (const space of ["hex", "rgb", "hsl", "oklch"] as const) {
      const output = exportTokens(set, format, space);
      expect(output.length).toBeGreaterThan(100);
    }
  });

  it("css with includeSemantic:false only contains primitive color declarations", () => {
    const output = exportTokens(set, "css", "oklch", {
      includeSemantic: false,
    });
    expect(output).toContain("Color primitives");
    expect(output).not.toContain("Semantic background tokens");
    expect(output).not.toContain("--font-");
    expect(output).not.toContain("--space-");
  });

  it("dtcg output round-trips through JSON.parse for every color space", () => {
    for (const space of ["hex", "rgb", "hsl", "oklch"] as const) {
      expect(() => JSON.parse(exportTokens(set, "dtcg", space))).not.toThrow();
    }
  });
});
