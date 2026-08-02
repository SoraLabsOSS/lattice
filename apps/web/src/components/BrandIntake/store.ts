import {
  type BodyFontWeights,
  type BrandConfig,
  type BrandPreset,
  type ColorRamp,
  createBrandConfig,
  DEFAULT_BODY_WEIGHTS,
  DEFAULT_HEADING_WEIGHT,
  FONT_WEIGHT_OPTIONS,
  type FontWeight,
  getBrandPreset,
  initialConfig,
  type NeutralColorRamp,
} from "@soralabsoss/generator";
import { atom, computed, map } from "nanostores";

export type TabId = "color" | "typography" | "style";

export type {
  BodyFontWeights,
  BrandConfig,
  BrandPreset,
  ColorRamp,
  FontWeight,
  NeutralColorRamp,
};
export {
  DEFAULT_BODY_WEIGHTS,
  DEFAULT_HEADING_WEIGHT,
  FONT_WEIGHT_OPTIONS,
  initialConfig,
};

const STORAGE_KEY = "sora-lattice:brand-config";
const MAX_HISTORY = 30;
const COALESCE_MS = 400;

function cloneConfig(config: BrandConfig): BrandConfig {
  return createBrandConfig(structuredClone(config));
}

function decodeStored(raw: string): BrandConfig {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as BrandConfig).primaryColor !== "string"
    ) {
      return initialConfig;
    }
    return createBrandConfig(parsed as BrandConfig);
  } catch {
    return initialConfig;
  }
}

/**
 * In-memory brand config. Starts as `initialConfig` on both SSR and the first
 * client render so React hydration matches. Persistence is applied after mount
 * via `initBrandConfigPersistence()` (URL `?c=` still wins when present).
 */
export const $brandConfig = map<BrandConfig>(initialConfig);

const $past = atom<BrandConfig[]>([]);
const $future = atom<BrandConfig[]>([]);

export const $canUndo = computed($past, (past) => past.length > 0);
export const $canRedo = computed($future, (future) => future.length > 0);

let applyingHistory = false;
let activeCoalesceKey: string | null = null;
let coalesceTimer: ReturnType<typeof setTimeout> | null = null;
let persistenceInitialized = false;

function pushPast(prev: BrandConfig, coalesceKey?: string) {
  if (applyingHistory) {
    return;
  }

  const shouldPush = !coalesceKey || coalesceKey !== activeCoalesceKey;

  if (shouldPush) {
    const nextPast = [...$past.get(), cloneConfig(prev)];
    if (nextPast.length > MAX_HISTORY) {
      nextPast.shift();
    }
    $past.set(nextPast);
    $future.set([]);
  }

  if (coalesceKey) {
    activeCoalesceKey = coalesceKey;
    if (coalesceTimer !== null) {
      clearTimeout(coalesceTimer);
    }
    coalesceTimer = setTimeout(() => {
      activeCoalesceKey = null;
      coalesceTimer = null;
    }, COALESCE_MS);
  } else {
    activeCoalesceKey = null;
    if (coalesceTimer !== null) {
      clearTimeout(coalesceTimer);
      coalesceTimer = null;
    }
  }
}

function commit(next: BrandConfig, coalesceKey?: string) {
  const prev = $brandConfig.get();
  pushPast(prev, coalesceKey);
  $brandConfig.set(cloneConfig(next));
}

/** Replace config without recording history (URL / localStorage hydrate). */
export function replaceConfig(config: BrandConfig) {
  applyingHistory = true;
  $brandConfig.set(cloneConfig(config));
  $past.set([]);
  $future.set([]);
  activeCoalesceKey = null;
  if (coalesceTimer !== null) {
    clearTimeout(coalesceTimer);
    coalesceTimer = null;
  }
  applyingHistory = false;
}

/**
 * Load localStorage after mount (avoids SSR/client hydration mismatch), then
 * keep writing changes. Call once from the Configurator client effect.
 * URL hydrate should run after this so `?c=` still wins.
 */
export function initBrandConfigPersistence(): void {
  if (typeof window === "undefined" || persistenceInitialized) {
    return;
  }
  persistenceInitialized = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      replaceConfig(decodeStored(raw));
    }
  } catch {
    // Ignore quota / private-mode failures.
  }

  $brandConfig.subscribe((value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore write failures.
    }
  });
}

export function updateConfig(
  updates: Partial<BrandConfig>,
  coalesceKey?: string
) {
  const current = $brandConfig.get();
  commit({ ...current, ...updates }, coalesceKey);
}

export function updateRampStep(rampKey: string, step: number, color: string) {
  const current = $brandConfig.get();
  const existing = current.rampOverrides[rampKey] ?? {};
  commit(
    {
      ...current,
      rampOverrides: {
        ...current.rampOverrides,
        [rampKey]: { ...existing, [step]: color },
      },
    },
    `ramp:${rampKey}:${step}`
  );
}

export function resetConfig() {
  commit(initialConfig);
}

/** Replace the full brand config from a curated preset (clears ramp overrides). */
export function applyBrandPreset(preset: BrandPreset | string) {
  const input =
    typeof preset === "string" ? getBrandPreset(preset)?.config : preset.config;
  if (!input) {
    return;
  }
  commit(createBrandConfig(input));
}

export function undo() {
  const past = $past.get();
  if (past.length === 0) {
    return;
  }
  const previous = past.at(-1);
  if (!previous) {
    return;
  }
  const nextPast = past.slice(0, -1);
  applyingHistory = true;
  $future.set([cloneConfig($brandConfig.get()), ...$future.get()]);
  $past.set(nextPast);
  $brandConfig.set(cloneConfig(previous));
  applyingHistory = false;
}

export function redo() {
  const future = $future.get();
  if (future.length === 0) {
    return;
  }
  const [next, ...rest] = future;
  if (!next) {
    return;
  }
  applyingHistory = true;
  $past.set([...$past.get(), cloneConfig($brandConfig.get())]);
  $future.set(rest);
  $brandConfig.set(cloneConfig(next));
  applyingHistory = false;
}
