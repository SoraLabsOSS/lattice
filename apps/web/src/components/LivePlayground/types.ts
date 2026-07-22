export { GOOGLE_FONTS } from "../../data/googleFonts";

export interface PlaygroundConfig {
  density: "compact" | "default" | "comfortable";
  expressiveness: "minimal" | "balanced" | "expressive";
  fontFamily: string;
  isDarkMode: boolean;
  lightness: number;
  primaryColor: string;
  roundness: "sharp" | "subtle" | "rounded" | "pill";
  saturation: number;
  secondaryColor: string;
  shadows?: "none" | "subtle" | "dramatic";
}

export interface LivePlaygroundProps {
  collapsibleControls?: boolean;
  compact?: boolean;
  config: PlaygroundConfig;
  defaultControlsOpen?: boolean;
  designTokens?: Record<string, string>;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
  showExternalDarkModeToggle?: boolean;
}

export const DEFAULT_PLAYGROUND_CONFIG: PlaygroundConfig = {
  density: "default",
  expressiveness: "balanced",
  fontFamily: "Inter",
  isDarkMode: false,
  lightness: 100,
  primaryColor: "#3B82F6",
  roundness: "rounded",
  saturation: 100,
  secondaryColor: "#8B5CF6",
};
