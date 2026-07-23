import { useStore } from "@nanostores/react";
import { generateDesignTokens } from "@soralabsoss/generator";
import { Moon, Sun } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { appendGoogleFontStylesheet } from "../../data/google-fonts";
import { $brandConfig, updateConfig } from "../BrandIntake/store";
import { GOOGLE_FONTS } from "../BrandIntake/tab-typography";
import { useColorRamps } from "../BrandIntake/use-color-ramps";
import PreviewComponents from "../ComponentSampler";
import { ColorRampView } from "../Showcase/color-ramp-view";
import { ColorPickerPopover } from "../ui/color-picker-popover";
import { Combobox } from "../ui/combobox";

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({
  isDark,
  onToggle,
}) => (
  <button
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    className="relative h-8 w-14 cursor-pointer rounded-full p-1 transition-all duration-200 hover:scale-105 active:scale-95"
    onClick={onToggle}
    style={{ backgroundColor: isDark ? "#374151" : "#e5e7eb" }}
    type="button"
  >
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
      style={{
        transform: `translateX(${isDark ? 24 : 0}px)`,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {isDark ? (
        <Moon className="text-gray-600" size={12} />
      ) : (
        <Sun className="text-amber-500" size={12} />
      )}
    </div>
  </button>
);

type PlaygroundPanel = "configure" | "preview";

const PlaygroundSegmentedControl: React.FC<{
  active: PlaygroundPanel;
  onChange: (panel: PlaygroundPanel) => void;
}> = ({ active, onChange }) => (
  <div className="mb-3 flex w-full gap-1 rounded-lg bg-charcoal/5 p-0.5 lg:hidden">
    {(["configure", "preview"] as const).map((panel) => (
      <button
        className={`flex-1 cursor-pointer rounded-md px-3 py-2 font-medium text-sm capitalize transition-all ${
          active === panel
            ? "bg-white text-charcoal shadow-sm"
            : "text-charcoal/50 hover:text-charcoal/80"
        }`}
        key={panel}
        onClick={() => onChange(panel)}
        type="button"
      >
        {panel}
      </button>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Preset selector (compressed, shared style from TabStyle)
// ---------------------------------------------------------------------------

interface PresetOption {
  hint?: React.ReactNode;
  id: string;
  label: string;
}

const PresetSelector: React.FC<{
  label: string;
  value: string;
  options: PresetOption[];
  onChange: (id: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="font-medium text-charcoal/80 text-xs">{label}</label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
            value === opt.id
              ? "border-forest-green bg-forest-green/5 font-bold text-forest-green"
              : "border-charcoal/10 text-charcoal/80 hover:border-charcoal/20"
          }`}
          key={opt.id}
          onClick={() => onChange(opt.id)}
          type="button"
        >
          {opt.hint && <span className="shrink-0">{opt.hint}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const ROUNDNESS_OPTIONS: PresetOption[] = [
  {
    hint: <div className="h-2.5 w-2.5 border border-current" />,
    id: "sharp",
    label: "Sharp",
  },
  {
    hint: <div className="h-2.5 w-2.5 rounded-[2px] border border-current" />,
    id: "subtle",
    label: "Soft",
  },
  {
    hint: <div className="h-2.5 w-2.5 rounded-md border border-current" />,
    id: "rounded",
    label: "Rounded",
  },
  {
    hint: <div className="h-2.5 w-3.5 rounded-full border border-current" />,
    id: "pill",
    label: "Pill",
  },
];

const SHADOW_OPTIONS: PresetOption[] = [
  { id: "none", label: "None" },
  { id: "subtle", label: "Subtle" },
  { id: "dramatic", label: "Dramatic" },
];

const DENSITY_OPTIONS: PresetOption[] = [
  { id: "compact", label: "Compact" },
  { id: "default", label: "Comfortable" },
  { id: "comfortable", label: "Spacious" },
];

// ---------------------------------------------------------------------------
// Compressed color slot: swatch + mini ramp underneath
// ---------------------------------------------------------------------------

const ColorSlot: React.FC<{
  label: string;
  color: string;
  onChange: (c: string) => void;
  ramp: Record<number, string> | Parameters<typeof ColorRampView>[0]["ramp"];
}> = ({ label, color, onChange, ramp }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <label className="font-medium text-charcoal/80 text-xs">{label}</label>
    <ColorPickerPopover
      ariaLabel={`${label} color`}
      color={color}
      onChange={onChange}
      showHexInput
      swatchClassName="w-12 aspect-[1/1] rounded-xl shadow-sm border-2 border-white cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    />
    <ColorRampView className="h-4 rounded-md" ramp={ramp as never} />
  </div>
);

// ---------------------------------------------------------------------------
// LandingPlayground — compressed Configurator controls + ComponentSampler
// ---------------------------------------------------------------------------

const LandingPlayground: React.FC = () => {
  const config = useStore($brandConfig);
  const derived = useColorRamps(config);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activePanel, setActivePanel] = useState<PlaygroundPanel>("configure");

  // Load Google Fonts for both heading and body typefaces
  useEffect(() => {
    for (const [family, role] of [
      [config.headingFont, "heading"],
      [config.primaryFont, "body"],
    ] as const) {
      const id = `playground-font-${role}-${family.replace(/\s+/g, "+")}`;
      appendGoogleFontStylesheet(family, id);
    }
  }, [config.primaryFont, config.headingFont]);

  const { tokens: designTokens } = useMemo(
    () => generateDesignTokens(config, isDarkMode),
    [config, isDarkMode]
  );

  return (
    <div
      className="flex flex-col items-center"
      data-step-animate-children="ignore"
    >
      {/* Dark Mode Toggle - above container */}
      <div className="relative z-0 mx-auto -mb-6 hidden w-full max-w-xs flex-row items-center justify-between self-center rounded-2xl bg-gray/70 px-4 pt-3 pb-8 md:flex">
        <p className="text-xs">Dark mode included</p>
        <DarkModeToggle
          isDark={isDarkMode}
          onToggle={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      <PlaygroundSegmentedControl
        active={activePanel}
        onChange={setActivePanel}
      />

      {/* Main Container */}
      <div className="relative z-10 flex h-[620px] w-full flex-col gap-3 overflow-hidden rounded-4xl bg-gray p-3 sm:h-[660px] md:h-[680px] md:gap-4 md:p-4 lg:h-[min(720px,85vh)] lg:flex-row">
        {/* Component Sampler */}
        <div
          className={`relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border-2 border-white shadow-sm lg:block ${
            activePanel === "configure" ? "hidden" : "block"
          }`}
          style={designTokens as React.CSSProperties}
        >
          <PreviewComponents />
        </div>

        {/* Compressed controls */}
        <div
          className={`order-first min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-3xl bg-white lg:order-last lg:flex lg:w-[320px] lg:flex-none ${
            activePanel === "preview" ? "hidden" : "flex"
          }`}
        >
          <div className="flex flex-col gap-6 p-5">
            {/* Color */}
            <section className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <ColorSlot
                  color={config.primaryColor}
                  label="Primary"
                  onChange={(c) =>
                    updateConfig({ primaryColor: c, rampOverrides: {} })
                  }
                  ramp={derived.primaryRamp}
                />
                <ColorSlot
                  color={derived.secondaryColor}
                  label="Secondary"
                  onChange={(c) =>
                    updateConfig({
                      secondaryColor: c,
                      useCustomSecondary: true,
                    })
                  }
                  ramp={derived.secondaryRamp}
                />
              </div>
            </section>

            {/* Typography */}
            <section className="flex flex-col gap-3 border-charcoal/10 border-t pt-5">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-charcoal/80 text-xs">
                  Heading
                </label>
                <Combobox
                  displayValue={config.customHeadingFontName}
                  onValueChange={(f) =>
                    updateConfig({
                      customHeadingFontName: undefined,
                      headingFont: f,
                    })
                  }
                  options={GOOGLE_FONTS}
                  placeholder="Search Google Fonts..."
                  size="compact"
                  value={config.headingFont}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-charcoal/80 text-xs">
                  Body
                </label>
                <Combobox
                  displayValue={config.customBodyFontName}
                  onValueChange={(f) =>
                    updateConfig({
                      customBodyFontName: undefined,
                      primaryFont: f,
                    })
                  }
                  options={GOOGLE_FONTS}
                  placeholder="Search Google Fonts..."
                  size="compact"
                  value={config.primaryFont}
                />
              </div>
            </section>

            {/* Style */}
            <section className="flex flex-col gap-4 border-charcoal/10 border-t pt-5">
              <PresetSelector
                label="Rounding"
                onChange={(val) =>
                  updateConfig({ roundness: val as typeof config.roundness })
                }
                options={ROUNDNESS_OPTIONS}
                value={config.roundness}
              />
              <PresetSelector
                label="Shadows"
                onChange={(val) =>
                  updateConfig({ shadows: val as typeof config.shadows })
                }
                options={SHADOW_OPTIONS}
                value={config.shadows}
              />
              <PresetSelector
                label="Spacing"
                onChange={(val) =>
                  updateConfig({ density: val as typeof config.density })
                }
                options={DENSITY_OPTIONS}
                value={config.density}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPlayground;
