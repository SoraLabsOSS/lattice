import { converter, parse } from "culori";
import { NAMED_HUES } from "../color-generation.js";
import type { TokenSet } from "../export-tokens.js";
import type { BrandConfig } from "../types.js";

export type SkillId = "tokens" | "components" | "accessibility";

/** One file inside an Agent Skill folder (agentskills.io). */
export interface SkillFile {
  content: string;
  /** Path relative to the skill root, e.g. `SKILL.md` or `references/THEMING.md`. */
  path: string;
}

/**
 * Generated Agent Skill package for a brand's token set.
 * Layout: `{rootDir}/SKILL.md` + optional `references/` (+ scripts).
 */
export interface SkillArtifact {
  description: string;
  files: SkillFile[];
  id: SkillId;
  /** Folder name — must match frontmatter `name`. */
  name: string;
  /** Zip / install root, e.g. `skills/tokens-and-theming`. */
  rootDir: string;
  title: string;
}

export interface SystemFacts {
  bgBase: string;
  bgOverlay: string;
  bgPrimary: string;
  bgRaised: string;
  bgSunken: string;
  bodyMd: string;
  borderTok: string;
  densityBase: string;
  fgMuted: string;
  fgOnBase: string;
  fgOnPri: string;
  fgPrimary: string;
  heading2xl: string;
  primaryHueAngle: number;
  primaryHueName: string;
  radiusAction: string;
  radiusContainer: string;
  supportingHues: string[];
  tokenCount: number;
}

const toOklch = converter("oklch");
const VAR_REF_RE = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;
const EMITTED_HUE_PATTERN = /^--color-([a-z]+)-\d+$/;

function findNearestNamedHue(hue: number): { name: string; hue: number } {
  const normalized = ((hue % 360) + 360) % 360;
  const [firstHue] = NAMED_HUES;
  let best = firstHue;
  let bestDist = 360;
  for (const nh of NAMED_HUES) {
    const diff = Math.abs(normalized - nh.hue);
    const dist = Math.min(diff, 360 - diff);
    if (dist < bestDist) {
      bestDist = dist;
      best = nh;
    }
  }
  return best;
}

function extractEmittedHues(tokens: Record<string, string>): string[] {
  const hues = new Set<string>();
  for (const prop of Object.keys(tokens)) {
    const m = prop.match(EMITTED_HUE_PATTERN);
    if (m) {
      hues.add(m[1]);
    }
  }
  return Array.from(hues);
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function pickToken(
  tokens: Record<string, string>,
  candidates: string[],
  fallback: string
): string {
  for (const name of candidates) {
    if (name in tokens) {
      return name;
    }
  }
  return fallback;
}

export function resolvePx(
  tokens: Record<string, string>,
  name: string
): string {
  const raw = tokens[name];
  if (!raw) {
    return "?";
  }
  const m = raw.match(VAR_REF_RE);
  const value = m ? (tokens[m[1]] ?? raw) : raw;
  return value.trim();
}

export function padRight(s: string, width: number): string {
  return s.length >= width ? s : s + " ".repeat(width - s.length);
}

export function deriveFacts(config: BrandConfig, set: TokenSet): SystemFacts {
  const oklch = toOklch(parse(config.primaryColor) ?? config.primaryColor);
  const angle = oklch ? (((oklch.h ?? 0) % 360) + 360) % 360 : 0;
  const named = findNearestNamedHue(angle);
  const primaryHueKey = named.name.toLowerCase();
  const emitted = extractEmittedHues(set.light);
  const supporting = emitted
    .filter((h) => h !== "neutral" && h !== primaryHueKey)
    .map(capitalize);

  return {
    bgBase: pickToken(
      set.light,
      ["--color-background-base"],
      "--color-background-base"
    ),
    bgOverlay: pickToken(
      set.light,
      ["--color-background-overlay"],
      "--color-background-overlay"
    ),
    bgPrimary: pickToken(
      set.light,
      ["--color-background-primary"],
      "--color-background-primary"
    ),
    bgRaised: pickToken(
      set.light,
      ["--color-background-raised"],
      "--color-background-raised"
    ),
    bgSunken: pickToken(
      set.light,
      ["--color-background-sunken"],
      "--color-background-sunken"
    ),
    bodyMd: resolvePx(set.light, "--typography-size-200"),
    borderTok: pickToken(
      set.light,
      ["--color-border-neutral", "--color-border-strong"],
      "--color-border-neutral"
    ),
    densityBase: resolvePx(set.light, "--dimension-100"),
    fgMuted: pickToken(
      set.light,
      ["--color-foreground-onBaseMuted"],
      "--color-foreground-onBaseMuted"
    ),
    fgOnBase: pickToken(
      set.light,
      ["--color-foreground-onBase"],
      "--color-foreground-onBase"
    ),
    fgOnPri: pickToken(
      set.light,
      ["--color-foreground-onPrimary"],
      "--color-foreground-onPrimary"
    ),
    fgPrimary: pickToken(
      set.light,
      ["--color-foreground-primary"],
      "--color-foreground-primary"
    ),
    heading2xl: resolvePx(set.light, "--typography-size-500"),
    primaryHueAngle: angle,
    primaryHueName: named.name,
    radiusAction: pickToken(
      set.light,
      ["--shape-radius-action"],
      "--shape-radius-action"
    ),
    radiusContainer: pickToken(
      set.light,
      ["--shape-radius-container"],
      "--shape-radius-container"
    ),
    supportingHues: supporting,
    tokenCount: Object.keys(set.light).length,
  };
}

/** YAML frontmatter; description should cover WHAT + WHEN (+ useful NOT). */
export function frontmatter(name: string, description: string): string {
  const indented = description
    .trim()
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  return `---\nname: ${name}\ndescription: >-\n${indented}\n---\n`;
}

export function skillFile(path: string, content: string): SkillFile {
  return { content: content.trimStart(), path };
}

/** Entry markdown for preview / single-file copy. */
export function skillEntryMarkdown(artifact: SkillArtifact): string {
  return (
    artifact.files.find((f) => f.path === "SKILL.md")?.content ??
    artifact.files[0]?.content ??
    ""
  );
}

/** Flatten skill packages for zip install under `.claude/skills` or `skills/`. */
export function flattenSkillFiles(
  artifacts: SkillArtifact[]
): { content: string; path: string }[] {
  return artifacts.flatMap((artifact) =>
    artifact.files.map((file) => ({
      content: file.content,
      path: `${artifact.rootDir}/${file.path}`,
    }))
  );
}
