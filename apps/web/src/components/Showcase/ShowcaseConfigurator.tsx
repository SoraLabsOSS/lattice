import { useStore } from "@nanostores/react";
import { generateRamp } from "@sora-lattice/generator";
import type React from "react";
import { useMemo } from "react";
import { ColorPickerPopover } from "../ui/ColorPickerPopover";
import { ColorRampView } from "./ColorRampView";
import { $showcaseConfig, updateShowcase } from "./store";
import { VisualPicker, type VisualPickerOption } from "./VisualPicker";

const ROUNDNESS_OPTIONS: VisualPickerOption[] = [
  {
    description: "Precise and technical.",
    id: "sharp",
    label: "Sharp",
    preview: <div className="h-10 w-10 border-2 border-charcoal/20" />,
  },
  {
    description: "Modern and balanced.",
    id: "rounded",
    label: "Rounded",
    preview: (
      <div className="h-10 w-10 rounded-xl border-2 border-charcoal/20" />
    ),
  },
  {
    description: "Soft and approachable.",
    id: "pill",
    label: "Pill",
    preview: (
      <div className="h-7 w-14 rounded-full border-2 border-charcoal/20" />
    ),
  },
];

const EXPRESSIVENESS_OPTIONS: VisualPickerOption[] = [
  {
    description: "Clean and understated.",
    id: "minimal",
    label: "Minimal",
    preview: <div className="h-px w-8 bg-charcoal/20" />,
  },
  {
    description: "Strategic accents.",
    id: "balanced",
    label: "Balanced",
    preview: (
      <div className="relative">
        <div className="h-10 w-10 rounded-lg border-2 border-charcoal/20" />
        <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-forest-green" />
      </div>
    ),
  },
  {
    description: "Bold and energetic.",
    id: "expressive",
    label: "Expressive",
    preview: (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            className="w-3 rounded-full bg-forest-green/20"
            key={i}
            style={{ height: `${i * 6 + 12}px` }}
          />
        ))}
      </div>
    ),
  },
];

const SHOWCASE_SWATCH_CLASS =
  "w-14 h-14 rounded-xl shadow-sm border-2 border-white ring-1 ring-charcoal/10 cursor-pointer transition-shadow hover:ring-2 hover:ring-charcoal/20 hover:scale-105 active:scale-95";

const ShowcaseConfigurator: React.FC = () => {
  const config = useStore($showcaseConfig);

  const primaryRamp = useMemo(
    () => generateRamp(config.primaryColor),
    [config.primaryColor]
  );

  const secondaryRamp = useMemo(
    () => generateRamp(config.secondaryColor),
    [config.secondaryColor]
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-charcoal/5 bg-white p-6 shadow-lg md:p-8">
      <div className="space-y-8">
        {/* Colors Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex flex-1 flex-col gap-4">
              <ColorPickerPopover
                color={config.primaryColor}
                label="Primary"
                onChange={(color) => updateShowcase({ primaryColor: color })}
                pickerWidth="200px"
                showHexInput
                swatchClassName={SHOWCASE_SWATCH_CLASS}
              />
              <ColorRampView compact label="Primary Ramp" ramp={primaryRamp} />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <ColorPickerPopover
                color={config.secondaryColor}
                label="Secondary"
                onChange={(color) => updateShowcase({ secondaryColor: color })}
                pickerWidth="200px"
                showHexInput
                swatchClassName={SHOWCASE_SWATCH_CLASS}
              />
              <ColorRampView
                compact
                label="Secondary Ramp"
                ramp={secondaryRamp}
              />
            </div>
          </div>
        </div>

        {/* Typography Display */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] text-charcoal/80">Typography</label>
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <div className="flex items-baseline gap-4">
              <span
                className="font-bold text-2xl text-charcoal"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Inter
              </span>
              <span className="text-charcoal/40 text-sm">Aa Bb Cc 123</span>
            </div>
          </div>
        </div>

        {/* Roundness & Expressiveness */}
        <div className="grid grid-cols-1 gap-6">
          <VisualPicker
            compact
            label="Roundness"
            onChange={(val) =>
              updateShowcase({ roundness: val as "sharp" | "rounded" | "pill" })
            }
            options={ROUNDNESS_OPTIONS}
            value={config.roundness}
          />
        </div>
      </div>

      {/* Decorative element */}
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-forest-green/5 blur-3xl" />
    </div>
  );
};

export default ShowcaseConfigurator;
