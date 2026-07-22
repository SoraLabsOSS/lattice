import {
  type ColorSpace,
  type ExportFormat,
  exportTokens,
  type TokenSet,
} from "./exportTokens.js";
import { generateDesignTokens } from "./generateTokens.js";
import { type BrandConfigInput, createBrandConfig } from "./types.js";

export * from "./accessibility.js";
export * from "./colorGeneration.js";
export * from "./colorUtils.js";
export * from "./contrastUtils.js";
export * from "./exportTokens.js";
export * from "./generateTokens.js";
export * from "./skills.js";
export * from "./types.js";

export interface GenerateThemeOptions {
  colorSpace?: ColorSpace;
  formats?: ExportFormat[];
  includeSemantic?: boolean;
}

export interface ThemeArtifact {
  content: string;
  format: ExportFormat;
}

export interface GeneratedTheme {
  artifacts: ThemeArtifact[];
  config: ReturnType<typeof createBrandConfig>;
  tokens: TokenSet;
}

export function generateTheme(
  input: BrandConfigInput = {},
  options: GenerateThemeOptions = {}
): GeneratedTheme {
  const config = createBrandConfig(input);
  const tokens: TokenSet = {
    dark: generateDesignTokens(config, true).tokens,
    light: generateDesignTokens(config, false).tokens,
  };
  const colorSpace = options.colorSpace ?? "oklch";
  const formats = options.formats ?? [];
  const artifacts = formats.map((format) => ({
    content: exportTokens(tokens, format, colorSpace, {
      includeSemantic: options.includeSemantic,
    }),
    format,
  }));

  return { artifacts, config, tokens };
}
