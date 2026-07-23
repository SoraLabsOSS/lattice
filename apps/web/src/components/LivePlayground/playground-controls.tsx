import { generateRamp } from "@soralabsoss/generator";
import { Moon, Settings2, Sun, X } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { ColorRampView } from "../Showcase/color-ramp-view";
import { ColorPickerPopover } from "../ui/color-picker-popover";
import { Select } from "../ui/select";
import type { PlaygroundConfig } from "./types";
import { GOOGLE_FONTS } from "./types";

const FONT_OPTIONS = GOOGLE_FONTS.map((font) => ({ label: font, value: font }));

interface PlaygroundControlsProps {
  config: PlaygroundConfig;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
  onClose?: () => void;
  showDarkModeToggle?: boolean;
}

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({
  isDark,
  onToggle,
}) => (
  <button
    className="relative h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-all duration-200 hover:scale-105 active:scale-95"
    onClick={onToggle}
    style={{
      backgroundColor: isDark ? "#374151" : "#e5e7eb",
    }}
    type="button"
  >
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm"
      style={{
        transform: `translateX(${isDark ? 20 : 0}px)`,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {isDark ? (
        <Moon className="text-gray-600" size={10} />
      ) : (
        <Sun className="text-amber-500" size={10} />
      )}
    </div>
  </button>
);

const SWATCH_CLASS =
  "w-10 h-10 rounded-xl shadow-sm border-2 border-white ring-1 ring-charcoal/10 cursor-pointer transition-shadow hover:ring-2 hover:ring-charcoal/20 hover:scale-105 active:scale-95";

interface SegmentedControlProps {
  label: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
  value: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  label,
  value,
  options,
  onChange,
}) => (
  <div className="flex flex-col gap-2">
    <label className="font-medium text-charcoal/80 text-sm">{label}</label>
    <div className="flex rounded-lg bg-charcoal/5 p-0.5">
      {options.map((opt) => (
        <button
          className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 font-medium text-sm transition-all duration-200 ${
            value === opt.id
              ? "bg-white text-charcoal shadow-sm"
              : "text-charcoal/50 hover:text-charcoal/70"
          }`}
          key={opt.id}
          onClick={() => onChange(opt.id)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

interface SliderControlProps {
  label: string;
  max?: number;
  min?: number;
  onChange: (v: number) => void;
  value: number;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-baseline justify-between">
      <label className="font-medium text-charcoal/80 text-sm">{label}</label>
      <span className="font-mono text-charcoal/80 text-xs">{value}%</span>
    </div>
    <input
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-charcoal/10 accent-forest-green [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-forest-green [&::-webkit-slider-thumb]:shadow-sm"
      max={max}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      type="range"
      value={value}
    />
  </div>
);

const PlaygroundControls: React.FC<PlaygroundControlsProps> = ({
  config,
  onChange,
  onClose,
  showDarkModeToggle,
}) => {
  const primaryRamp = useMemo(
    () =>
      generateRamp(
        config.primaryColor,
        config.saturation,
        false,
        config.lightness
      ),
    [config.primaryColor, config.saturation, config.lightness]
  );

  const secondaryRamp = useMemo(
    () =>
      generateRamp(
        config.secondaryColor,
        config.saturation,
        false,
        config.lightness
      ),
    [config.secondaryColor, config.saturation, config.lightness]
  );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-medium text-charcoal/80 text-sm">
          <Settings2 size={16} />
          <span>Appearance</span>
        </div>
        <div className="flex items-center gap-3">
          {showDarkModeToggle && (
            <DarkModeToggle
              isDark={config.isDarkMode}
              onToggle={() => onChange({ isDarkMode: !config.isDarkMode })}
            />
          )}
          {onClose && (
            <button
              className="cursor-pointer rounded-lg p-1.5 text-charcoal/40 transition-colors hover:bg-charcoal/5 hover:text-charcoal/80"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="border-charcoal/10 border-t" />

      {/* Colors */}
      <div className="flex flex-col gap-8">
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <ColorPickerPopover
              color={config.primaryColor}
              label="Primary"
              onChange={(color) => onChange({ primaryColor: color })}
              pickerWidth="180px"
              showHexInput
              swatchClassName={SWATCH_CLASS}
            />
            <ColorRampView className="h-4" compact ramp={primaryRamp} />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <ColorPickerPopover
              color={config.secondaryColor}
              label="Secondary"
              onChange={(color) => onChange({ secondaryColor: color })}
              pickerWidth="180px"
              showHexInput
              swatchClassName={SWATCH_CLASS}
            />
            <ColorRampView className="h-4" compact ramp={secondaryRamp} />
          </div>
        </div>

        <SliderControl
          label="Saturation"
          onChange={(v) => onChange({ saturation: v })}
          value={config.saturation}
        />

        <SliderControl
          label="Lightness"
          max={150}
          min={50}
          onChange={(v) => onChange({ lightness: v })}
          value={config.lightness}
        />
      </div>

      {/* Divider */}
      <div className="border-charcoal/10 border-t" />

      {/* Typography */}
      <Select
        label="Typography"
        onValueChange={(value) => onChange({ fontFamily: value })}
        options={FONT_OPTIONS}
        size="compact"
        triggerClassName="border-charcoal/10"
        value={config.fontFamily}
      />

      {/* Divider */}
      <div className="border-charcoal/10 border-t" />

      {/* Style Controls */}
      <div className="flex flex-col gap-6">
        <SegmentedControl
          label="Rounding"
          onChange={(id) =>
            onChange({ roundness: id as PlaygroundConfig["roundness"] })
          }
          options={[
            { id: "sharp", label: "Sharp" },
            { id: "subtle", label: "Soft" },
            { id: "rounded", label: "Rounded" },
            { id: "pill", label: "Pill" },
          ]}
          value={config.roundness}
        />

        <SegmentedControl
          label="Shadows"
          onChange={(id) =>
            onChange({ shadows: id as PlaygroundConfig["shadows"] })
          }
          options={[
            { id: "none", label: "None" },
            { id: "subtle", label: "Subtle" },
            { id: "dramatic", label: "Dramatic" },
          ]}
          value={config.shadows || "subtle"}
        />

        <SegmentedControl
          label="Spacing"
          onChange={(id) =>
            onChange({ density: id as PlaygroundConfig["density"] })
          }
          options={[
            { id: "compact", label: "Compact" },
            { id: "default", label: "Comfortable" },
            { id: "comfortable", label: "Spacious" },
          ]}
          value={config.density}
        />

        <SegmentedControl
          label="Motion"
          onChange={(id) =>
            onChange({
              expressiveness: id as PlaygroundConfig["expressiveness"],
            })
          }
          options={[
            { id: "minimal", label: "Minimal" },
            { id: "balanced", label: "Balanced" },
            { id: "expressive", label: "Expressive" },
          ]}
          value={config.expressiveness}
        />
      </div>
    </div>
  );
};

export default PlaygroundControls;
