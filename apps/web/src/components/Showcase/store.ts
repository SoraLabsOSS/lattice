import { map } from "nanostores";

export interface ShowcaseConfig {
  // Panel 1: Design System Configurator
  brandName: string;
  density: "compact" | "default" | "comfortable";
  expressiveness: "minimal" | "balanced" | "expressive";
  fontFamily: string;

  // Panel 2: Component Showcase
  isDarkMode: boolean;
  lightness: number;
  primaryColor: string;
  roundness: "sharp" | "subtle" | "rounded" | "pill";
  saturation: number;
  secondaryColor: string;
  shadows: "none" | "subtle" | "dramatic";
  systemName: string;
}

const defaultShowcaseConfig: ShowcaseConfig = {
  brandName: "Acme",
  density: "default",
  expressiveness: "balanced",
  fontFamily: "Inter",
  isDarkMode: false,
  lightness: 100,
  primaryColor: "#3B82F6",
  roundness: "rounded",
  saturation: 100,
  secondaryColor: "#8B5CF6",
  shadows: "subtle",
  systemName: "Atlas",
};

export const $showcaseConfig = map<ShowcaseConfig>(defaultShowcaseConfig);

export function updateShowcase(updates: Partial<ShowcaseConfig>) {
  $showcaseConfig.set({ ...$showcaseConfig.get(), ...updates });
}

export function resetShowcase() {
  $showcaseConfig.set({ ...defaultShowcaseConfig });
}
