// biome-ignore-all lint/performance/noBarrelFile: this is the package's public entry point (see package.json "exports")

import {
  type ColorSpace,
  type ExportFormat,
  exportTokens,
  type TokenSet,
} from "./export-tokens.js";
import { generateDesignTokens } from "./generate-tokens.js";
import { type BrandConfigInput, createBrandConfig } from "./types.js";

export * from "./accessibility.js";
export * from "./color-generation.js";
export * from "./color-utils.js";
export * from "./contrast-utils.js";
export * from "./export-tokens.js";
export * from "./generate-tokens.js";
export * from "./presets.js";
export { generateSkills } from "./skills/index.js";
export type {
  SkillArtifact,
  SkillFile,
  SkillId,
  SystemFacts,
} from "./skills/types.js";
export { flattenSkillFiles, skillEntryMarkdown } from "./skills/types.js";
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
