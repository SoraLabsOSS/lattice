import { useStore } from "@nanostores/react";
import { generateDesignTokens } from "@sora-lattice/generator";
import type React from "react";
import { useMemo, useState } from "react";
import { $brandConfig, updateConfig } from "../BrandIntake/store";
import LivePlayground from "./live-playground";
import type { PlaygroundConfig } from "./types";

const IntakePlayground: React.FC = () => {
  const brand = useStore($brandConfig);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const config: PlaygroundConfig = {
    density: brand.density,
    expressiveness: brand.expressiveness,
    fontFamily: brand.primaryFont,
    isDarkMode,
    lightness: 100,
    primaryColor: brand.primaryColor,
    roundness: brand.roundness === "subtle" ? "rounded" : brand.roundness,
    saturation: 100,
    secondaryColor: brand.secondaryColor || "#8B5CF6",
  };

  const handleChange = (updates: Partial<PlaygroundConfig>) => {
    const brandUpdates: Record<string, unknown> = {};

    if (updates.primaryColor !== undefined) {
      brandUpdates.primaryColor = updates.primaryColor;
    }
    if (updates.secondaryColor !== undefined) {
      brandUpdates.secondaryColor = updates.secondaryColor;
      brandUpdates.useCustomSecondary = true;
    }
    // playground saturation is a different concept; don't map to chromaFalloff

    if (updates.fontFamily !== undefined) {
      brandUpdates.primaryFont = updates.fontFamily;
    }
    if (updates.roundness !== undefined) {
      brandUpdates.roundness = updates.roundness;
    }
    if (updates.density !== undefined) {
      brandUpdates.density = updates.density;
    }
    if (updates.expressiveness !== undefined) {
      brandUpdates.expressiveness = updates.expressiveness;
    }
    if (updates.isDarkMode !== undefined) {
      setIsDarkMode(updates.isDarkMode);
    }

    if (Object.keys(brandUpdates).length > 0) {
      updateConfig(brandUpdates);
    }
  };

  const { tokens: designTokens } = useMemo(
    () => generateDesignTokens(brand, isDarkMode),
    [brand, isDarkMode]
  );

  return (
    <LivePlayground
      collapsibleControls={true}
      compact
      config={config}
      defaultControlsOpen={false}
      designTokens={designTokens}
      onChange={handleChange}
      showExternalDarkModeToggle={false}
    />
  );
};

export default IntakePlayground;
