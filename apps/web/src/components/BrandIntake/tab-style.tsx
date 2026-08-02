import { useStore } from "@nanostores/react";
import type { BrandConfig, StyleOverrides } from "@soralabsoss/generator";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { $brandConfig, updateConfig } from "./store";

// ---------------------------------------------------------------------------
// Compact segmented control for style presets
// ---------------------------------------------------------------------------

interface PresetOption {
  hint?: React.ReactNode;
  id: string;
  label: string;
}

interface PresetSelectorProps {
  description?: string;
  label: string;
  onChange: (id: string) => void;
  options: PresetOption[];
  value: string;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  label,
  description,
  value,
  options,
  onChange,
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-col gap-0.5">
      <label className="font-medium text-charcoal text-sm">{label}</label>
      {description && <p className="text-charcoal/80 text-xs">{description}</p>}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
            value === opt.id
              ? "border-forest-green bg-forest-green/5 font-bold text-forest-green"
              : "border-charcoal/10 text-charcoal/80 hover:border-charcoal/20 hover:text-charcoal/80"
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

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

const ROUNDNESS_OPTIONS: PresetOption[] = [
  {
    hint: <div className="h-3 w-3 border border-current" />,
    id: "sharp",
    label: "Sharp",
  },
  {
    hint: <div className="h-3 w-3 rounded-[3px] border border-current" />,
    id: "subtle",
    label: "Soft",
  },
  {
    hint: <div className="h-3 w-3 rounded-md border border-current" />,
    id: "rounded",
    label: "Rounded",
  },
  {
    hint: <div className="h-3 w-4 rounded-full border border-current" />,
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
  {
    hint: (
      <div className="flex w-3 flex-col gap-0.5">
        <div className="h-[2px] w-full rounded-full bg-current" />
        <div className="h-[2px] w-2/3 rounded-full bg-current" />
      </div>
    ),
    id: "compact",
    label: "Compact",
  },
  {
    hint: (
      <div className="flex w-3 flex-col gap-1">
        <div className="h-[2px] w-full rounded-full bg-current" />
        <div className="h-[2px] w-2/3 rounded-full bg-current" />
      </div>
    ),
    id: "default",
    label: "Comfortable",
  },
  {
    hint: (
      <div className="flex w-3 flex-col gap-1.5">
        <div className="h-[2px] w-full rounded-full bg-current" />
        <div className="h-[2px] w-2/3 rounded-full bg-current" />
      </div>
    ),
    id: "comfortable",
    label: "Spacious",
  },
];

const MOTION_OPTIONS: PresetOption[] = [
  { id: "minimal", label: "Minimal" },
  { id: "balanced", label: "Balanced" },
  { id: "expressive", label: "Expressive" },
];

const DENSITY_BASE: Record<BrandConfig["density"], number> = {
  comfortable: 10,
  compact: 6,
  default: 8,
};

const MOTION_DEFAULTS: Record<
  BrandConfig["expressiveness"],
  { gradual: number; swift: number }
> = {
  balanced: { gradual: 350, swift: 150 },
  expressive: { gradual: 500, swift: 250 },
  minimal: { gradual: 250, swift: 100 },
};

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

function patchOverrides(
  current: StyleOverrides | undefined,
  patch: StyleOverrides,
  clearKeys?: (keyof StyleOverrides)[]
): StyleOverrides | undefined {
  const next: StyleOverrides = { ...current, ...patch };
  for (const key of clearKeys ?? []) {
    delete next[key];
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

interface AdvancedSliderProps {
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  suffix?: string;
  value: number;
}

const AdvancedSlider: React.FC<AdvancedSliderProps> = ({
  id,
  label,
  max,
  min,
  onChange,
  step,
  suffix = "",
  value,
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <label className="text-charcoal text-xs" htmlFor={id}>
        {label}
      </label>
      <span className="font-mono text-charcoal/80 text-xs">
        {Number.isInteger(step) ? value : value.toFixed(2)}
        {suffix}
      </span>
    </div>
    <input
      className="w-full accent-forest-green"
      id={id}
      max={max}
      min={min}
      onChange={(e) => onChange(Number.parseFloat(e.target.value))}
      step={step}
      type="range"
      value={value}
    />
  </div>
);

// ---------------------------------------------------------------------------
// TabStyle
// ---------------------------------------------------------------------------

const TabStyle: React.FC = () => {
  const config = useStore($brandConfig);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const overrides = config.styleOverrides ?? {};

  const spacingBase = overrides.dimensionBasePx ?? DENSITY_BASE[config.density];
  const radiusScale = overrides.radiusScale ?? 1;
  const motionDefaults = MOTION_DEFAULTS[config.expressiveness];
  const swiftMs = overrides.transitionSwiftMs ?? motionDefaults.swift;
  const gradualMs = overrides.transitionGradualMs ?? motionDefaults.gradual;
  const raisedOpacity =
    overrides.shadowRaised === "none"
      ? 0
      : overrides.shadowRaised
        ? Number.parseFloat(
            overrides.shadowRaised.match(
              /rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/
            )?.[1] ?? "0.06"
          )
        : config.shadows === "none"
          ? 0
          : 0.06;
  const overlayOpacity = overrides.shadowOverlay
    ? Number.parseFloat(
        overrides.shadowOverlay.match(
          /rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/
        )?.[1] ?? "0.1"
      )
    : config.shadows === "none"
      ? 0.05
      : 0.1;

  const writeOverrides = (
    patch: StyleOverrides,
    coalesceKey?: string,
    clearKeys?: (keyof StyleOverrides)[]
  ) => {
    updateConfig(
      {
        styleOverrides: patchOverrides(config.styleOverrides, patch, clearKeys),
      },
      coalesceKey
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PresetSelector
        description="Controls border radius across all components."
        label="Rounding"
        onChange={(val) =>
          updateConfig({
            roundness: val as typeof config.roundness,
            styleOverrides: patchOverrides(config.styleOverrides, {}, [
              "radii",
              "radiusScale",
            ]),
          })
        }
        options={ROUNDNESS_OPTIONS}
        value={config.roundness}
      />

      <PresetSelector
        description="Elevation and depth across surfaces."
        label="Shadows"
        onChange={(val) =>
          updateConfig({
            shadows: val as typeof config.shadows,
            styleOverrides: patchOverrides(config.styleOverrides, {}, [
              "shadowRaised",
              "shadowOverlay",
            ]),
          })
        }
        options={SHADOW_OPTIONS}
        value={config.shadows}
      />

      <PresetSelector
        description="Density of content and whitespace."
        label="Spacing"
        onChange={(val) =>
          updateConfig({
            density: val as typeof config.density,
            styleOverrides: patchOverrides(config.styleOverrides, {}, [
              "dimensionBasePx",
            ]),
          })
        }
        options={DENSITY_OPTIONS}
        value={config.density}
      />

      <PresetSelector
        description="Animation and transition intensity."
        label="Motion"
        onChange={(val) =>
          updateConfig({
            expressiveness: val as typeof config.expressiveness,
            styleOverrides: patchOverrides(config.styleOverrides, {}, [
              "transitionSwiftMs",
              "transitionGradualMs",
            ]),
          })
        }
        options={MOTION_OPTIONS}
        value={config.expressiveness}
      />

      <div className="border-charcoal/5 border-t pt-3">
        <button
          className={`flex w-full cursor-pointer items-center justify-between rounded-lg py-2 font-medium text-sm transition-colors ${
            isAdvancedOpen
              ? "text-forest-green"
              : "text-charcoal/80 hover:text-charcoal"
          }`}
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          type="button"
        >
          <span>Advanced</span>
          <ChevronDown
            className={`transition-transform duration-200 ${isAdvancedOpen ? "rotate-180" : ""}`}
            size={16}
          />
        </button>

        <AnimatePresence initial={false}>
          {isAdvancedOpen ? (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{
                height: EXPAND_TRANSITION,
                opacity: { duration: 0.2, ease: "easeInOut" },
              }}
            >
              <div className="mt-2 flex flex-col gap-4 rounded-xl bg-charcoal/5 px-4 py-4">
                <AdvancedSlider
                  id="style-spacing-base"
                  label="Spacing base"
                  max={14}
                  min={4}
                  onChange={(value) =>
                    writeOverrides(
                      { dimensionBasePx: value },
                      "style:dimensionBasePx"
                    )
                  }
                  step={1}
                  suffix="px"
                  value={spacingBase}
                />
                <AdvancedSlider
                  id="style-radius-scale"
                  label="Radius intensity"
                  max={1.5}
                  min={0.5}
                  onChange={(value) =>
                    writeOverrides({ radiusScale: value }, "style:radiusScale")
                  }
                  step={0.05}
                  suffix="×"
                  value={radiusScale}
                />
                <AdvancedSlider
                  id="style-shadow-raised"
                  label="Raised shadow opacity"
                  max={0.3}
                  min={0}
                  onChange={(value) => {
                    if (value <= 0) {
                      writeOverrides(
                        { shadowRaised: "none" },
                        "style:shadowRaised"
                      );
                      return;
                    }
                    writeOverrides(
                      {
                        shadowRaised: `0 1px 3px rgba(15,23,42,${value})`,
                      },
                      "style:shadowRaised"
                    );
                  }}
                  step={0.01}
                  value={raisedOpacity}
                />
                <AdvancedSlider
                  id="style-shadow-overlay"
                  label="Overlay shadow opacity"
                  max={0.4}
                  min={0}
                  onChange={(value) =>
                    writeOverrides(
                      {
                        shadowOverlay: `0 10px 25px rgba(15,23,42,${value}), 0 4px 10px rgba(15,23,42,${value * 0.6})`,
                      },
                      "style:shadowOverlay"
                    )
                  }
                  step={0.01}
                  value={overlayOpacity}
                />
                <AdvancedSlider
                  id="style-motion-swift"
                  label="Swift duration"
                  max={400}
                  min={50}
                  onChange={(value) =>
                    writeOverrides(
                      { transitionSwiftMs: value },
                      "style:transitionSwiftMs"
                    )
                  }
                  step={10}
                  suffix="ms"
                  value={swiftMs}
                />
                <AdvancedSlider
                  id="style-motion-gradual"
                  label="Gradual duration"
                  max={800}
                  min={100}
                  onChange={(value) =>
                    writeOverrides(
                      { transitionGradualMs: value },
                      "style:transitionGradualMs"
                    )
                  }
                  step={10}
                  suffix="ms"
                  value={gradualMs}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabStyle;
