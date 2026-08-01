import type { TokenSet } from "../export-tokens.js";
import type { BrandConfig } from "../types.js";
import { buildAccessibilitySkill } from "./accessibility.js";
import { buildComponentsSkill } from "./components.js";
import { buildTokensSkill } from "./tokens.js";
import type { SkillArtifact } from "./types.js";

/**
 * Generate Agent Skills packages (agentskills.io layout) for this brand:
 * `skills/<name>/SKILL.md` + `references/` (+ scripts where useful).
 */
export function generateSkills(
  config: BrandConfig,
  set: TokenSet
): SkillArtifact[] {
  return [
    buildTokensSkill(config, set),
    buildComponentsSkill(config, set),
    buildAccessibilitySkill(config, set),
  ];
}
