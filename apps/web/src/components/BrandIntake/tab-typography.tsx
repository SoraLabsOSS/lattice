import { useStore } from "@nanostores/react";
import type React from "react";
import { useCallback, useEffect } from "react";
import {
  appendGoogleFontStylesheet,
  GOOGLE_FONTS,
} from "../../data/google-fonts";
import { Combobox } from "../ui/combobox";
import {
  $brandConfig,
  type BodyFontWeights,
  FONT_WEIGHT_OPTIONS,
  type FontWeight,
  updateConfig,
} from "./store";

export { GOOGLE_FONTS };

interface WeightPillsProps {
  fontFamily: string;
  onSelect: (w: FontWeight) => void;
  selected: FontWeight;
}

const WeightPills: React.FC<WeightPillsProps> = ({
  selected,
  onSelect,
  fontFamily,
}) => (
  <div className="flex flex-wrap gap-1.5">
    {FONT_WEIGHT_OPTIONS.map((w) => {
      const active = selected === w;
      return (
        <button
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs transition-all ${
            active
              ? "border-forest-green bg-forest-green/5 text-forest-green"
              : "border-charcoal/10 text-charcoal/80 hover:border-charcoal/20"
          }`}
          key={w}
          onClick={() => onSelect(w)}
          style={{
            fontFamily: `'${fontFamily}', system-ui, sans-serif`,
            fontWeight: w,
          }}
          type="button"
        >
          {w}
        </button>
      );
    })}
  </div>
);

const TabTypography: React.FC = () => {
  const config = useStore($brandConfig);

  useEffect(() => {
    const loadFont = (family: string, role: "heading" | "body") => {
      const id = `tab-typo-font-${role}-${family.replace(/\s+/g, "+")}`;
      appendGoogleFontStylesheet(family, id);
    };
    loadFont(config.headingFont, "heading");
    loadFont(config.primaryFont, "body");
  }, [config.headingFont, config.primaryFont]);

  const handleBodyFontChange = useCallback((font: string) => {
    updateConfig({ customBodyFontName: undefined, primaryFont: font });
  }, []);

  const handleHeadingFontChange = useCallback((font: string) => {
    updateConfig({ customHeadingFontName: undefined, headingFont: font });
  }, []);

  const setBodyWeight = useCallback(
    (slot: keyof BodyFontWeights, weight: FontWeight) => {
      updateConfig({ bodyWeights: { ...config.bodyWeights, [slot]: weight } });
    },
    [config.bodyWeights]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Heading typeface + weight */}
      <div className="flex flex-col gap-6">
        <Combobox
          displayValue={config.customHeadingFontName}
          label="Heading Typeface"
          onValueChange={handleHeadingFontChange}
          options={GOOGLE_FONTS}
          placeholder="Search Google Fonts..."
          size="compact"
          value={config.headingFont}
        />
        <div className="flex flex-col gap-2">
          <span className="text-charcoal/80 text-xs">Weight</span>
          <WeightPills
            fontFamily={config.headingFont}
            onSelect={(w) => updateConfig({ headingWeight: w })}
            selected={config.headingWeight}
          />
        </div>
      </div>

      {/* Body typeface + weights */}
      <div className="flex flex-col gap-6 border-charcoal/5 border-t pt-4">
        <Combobox
          displayValue={config.customBodyFontName}
          label="Body Typeface"
          onValueChange={handleBodyFontChange}
          options={GOOGLE_FONTS}
          placeholder="Search Google Fonts..."
          size="compact"
          value={config.primaryFont}
        />
        <div className="flex flex-col gap-6">
          {(["light", "regular", "bold"] as const).map((slot) => (
            <div className="flex flex-col gap-2" key={slot}>
              <span className="text-charcoal/80 text-xs capitalize">
                Weight – {slot}
              </span>
              <WeightPills
                fontFamily={config.primaryFont}
                onSelect={(w) => setBodyWeight(slot, w)}
                selected={config.bodyWeights[slot]}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabTypography;
