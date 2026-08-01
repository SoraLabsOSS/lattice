import { describe, expect, it } from "vitest";
import {
  createBrandConfig,
  type ExportFormat,
  exportTokens,
  generateDesignTokens,
  isPreviewScopedShadcnVar,
  type TokenSet,
  toShadcnCssVars,
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
    it("emits a Tailwind v4 drop-in theme (import, dark variant, root, theme, base)", () => {
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      expect(output).toContain('@import "tailwindcss";');
      expect(output).toContain("@custom-variant dark (&:is(.dark *));");
      expect(output).toContain(":root {");
      expect(output).toContain(".dark {");
      expect(output).toContain("@theme inline {");
      expect(output).toContain("--color-primary: var(--primary);");
      expect(output).toContain("--radius-4xl: calc(var(--radius) * 2.6);");
      expect(output).toContain("@layer base {");
      expect(output).toContain("@apply bg-background text-foreground;");
    });

    it("does not dump Lattice primitive ramps into the shadcn theme file", () => {
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      expect(output).not.toContain("--neutral-0:");
      expect(output).not.toContain("--blue-500:");
      expect(output).not.toContain("/* Primitive tokens */");
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
      expect(output).not.toContain("--chart-2:");
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

    it("maps heading font to --font-serif", () => {
      const output = exportTokens(
        fixtureSet({
          "--typography-font-family-heading": "'GT Sectra', Georgia, serif",
        }),
        "shadcn",
        "hex"
      );
      expect(output).toContain("--font-serif: GT Sectra, Georgia, serif;");
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

    it("keeps fonts/radius/spacing on :root only (not redeclared under .dark)", () => {
      const output = exportTokens(fixtureSet(), "shadcn", "hex");
      const darkSection = output.split(".dark {")[1]?.split("@theme")[0] ?? "";
      expect(darkSection).not.toContain("--font-sans:");
      expect(darkSection).not.toContain("--radius:");
      expect(darkSection).not.toContain("--spacing:");
      expect(darkSection).toContain("--shadow-sm:");
    });
  });
});

describe("toShadcnCssVars", () => {
  it("bridges fonts and radius so Style / Typography update the Components preview", () => {
    const vars = toShadcnCssVars(fixtureSet().light, false);
    expect(vars["--font-sans"]).toBe("Inter, sans-serif");
    expect(vars["--radius"]).toBe("8px");
  });

  it("tracks roundness and body font from a generated brand config", () => {
    const sharp = generateDesignTokens(
      createBrandConfig({
        primaryFont: "Space Grotesk",
        roundness: "sharp",
      }),
      false
    ).tokens;
    const pill = generateDesignTokens(
      createBrandConfig({
        primaryFont: "Playfair Display",
        roundness: "pill",
      }),
      false
    ).tokens;

    const sharpVars = toShadcnCssVars(sharp, false);
    const pillVars = toShadcnCssVars(pill, false);

    expect(sharpVars["--font-sans"]).toContain("Space Grotesk");
    expect(pillVars["--font-sans"]).toContain("Playfair Display");
    expect(sharpVars["--radius"]).not.toBe(pillVars["--radius"]);
    // sharp container → dimension-0 → 0px; pill → dimension-300 (larger)
    expect(sharpVars["--radius"]).toBe("0px");
    expect(Number.parseFloat(pillVars["--radius"] ?? "0")).toBeGreaterThan(0);
  });

  it("remaps Tailwind font-weight utilities onto brand weight slots", () => {
    const tokens = generateDesignTokens(
      createBrandConfig({
        bodyWeights: { bold: 800, light: 300, regular: 400 },
        headingWeight: 900,
      }),
      false
    ).tokens;
    const vars = toShadcnCssVars(tokens, false);

    expect(vars["--font-weight-light"]).toBe("300");
    expect(vars["--font-weight-normal"]).toBe("400");
    expect(vars["--font-weight-bold"]).toBe("800");
    expect(vars["--font-weight-semibold"]).toBe("900");
    expect(vars["--font-heading-weight"]).toBe("900");
  });

  it("keeps radius stable across density so Spacing does not change Rounding", () => {
    const softCompact = toShadcnCssVars(
      generateDesignTokens(
        createBrandConfig({ density: "compact", roundness: "subtle" }),
        false
      ).tokens,
      false
    );
    const softSpacious = toShadcnCssVars(
      generateDesignTokens(
        createBrandConfig({ density: "comfortable", roundness: "subtle" }),
        false
      ).tokens,
      false
    );

    expect(softCompact["--radius"]).toBe(softSpacious["--radius"]);
    expect(softCompact["--radius"]).toBe("8px");
    expect(softCompact["--spacing"]).not.toBe(softSpacious["--spacing"]);
    expect(Number.parseFloat(softCompact["--spacing"] ?? "0")).toBeLessThan(
      Number.parseFloat(softSpacious["--spacing"] ?? "0")
    );
  });

  it("maps Lattice shadow presets onto visible Tailwind shadow utilities", () => {
    const none = toShadcnCssVars(
      generateDesignTokens(createBrandConfig({ shadows: "none" }), false)
        .tokens,
      false
    );
    const subtle = toShadcnCssVars(
      generateDesignTokens(createBrandConfig({ shadows: "subtle" }), false)
        .tokens,
      false
    );
    const dramatic = toShadcnCssVars(
      generateDesignTokens(createBrandConfig({ shadows: "dramatic" }), false)
        .tokens,
      false
    );

    expect(none["--shadow-sm"]).toBe("none");
    expect(none["--shadow-raised"]).toBe("none");
    expect(subtle["--shadow-sm"]).not.toBe("none");
    expect(subtle["--shadow-sm"]).toContain("rgba");
    expect(dramatic["--shadow-sm"]).not.toBe(subtle["--shadow-sm"]);
    expect(isPreviewScopedShadcnVar("--spacing")).toBe(true);
    expect(isPreviewScopedShadcnVar("--primary")).toBe(true);
    expect(isPreviewScopedShadcnVar("--radius")).toBe(true);
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
