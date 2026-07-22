import type { ColorRamp, GenerationMode } from "@sora-lattice/generator";
import {
  ArrowLeftRight,
  Circle,
  Flame,
  GitFork,
  Grid2x2,
  Palette,
  Snowflake,
  Triangle,
  Waves,
} from "lucide-react";
import type React from "react";
import { ColorRampView } from "../Showcase/color-ramp-view";
import { ColorPickerPopover } from "../ui/color-picker-popover";
import { Input } from "../ui/input";
import { Select, type SelectOption } from "../ui/select";

// ---------------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------------

export const HexColorInput: React.FC<{
  color: string;
  onChange: (color: string) => void;
}> = ({ color, onChange }) => (
  <div className="relative">
    <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-charcoal/70 text-sm">
      #
    </span>
    <Input
      aria-label="Hex color value"
      className="w-26 pl-6 font-mono"
      maxLength={6}
      onChange={(e) => onChange(`#${(e.target as HTMLInputElement).value}`)}
      size="compact"
      value={color.replace("#", "")}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Generation mode options (monochromatic excluded)
// ---------------------------------------------------------------------------

const SECONDARY_MODE_OPTIONS: SelectOption[] = [
  {
    icon: <ArrowLeftRight size={14} />,
    label: "Complementary",
    value: "complementary",
  },
  {
    icon: <GitFork size={14} />,
    label: "Split Complementary",
    value: "split-complementary",
  },
  { icon: <Triangle size={14} />, label: "Triadic", value: "triadic" },
  { icon: <Waves size={14} />, label: "Analogous", value: "analogous" },
  { icon: <Grid2x2 size={14} />, label: "Tetradic", value: "tetradic" },
];

export const GenerationModeSelector: React.FC<{
  value?: GenerationMode;
  onChange: (mode: GenerationMode) => void;
}> = ({ value, onChange }) => (
  <Select
    label="Generation Mode"
    onValueChange={(v) => onChange(v as GenerationMode)}
    options={SECONDARY_MODE_OPTIONS}
    size="compact"
    value={value ?? "complementary"}
  />
);

export const RampSliders: React.FC<{
  chromaFalloff: number;
  onChromaFalloffChange: (value: number) => void;
}> = ({ chromaFalloff, onChromaFalloffChange }) => (
  <div className="flex flex-col gap-4" data-step-animate-children="ignore">
    <div className="flex justify-between">
      <label className="font-medium text-charcoal text-sm">
        Chroma Falloff
      </label>
      <span className="font-mono text-charcoal text-xs">{chromaFalloff}%</span>
    </div>
    <input
      aria-label="Chroma Falloff"
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-charcoal/10 accent-forest-green"
      max="100"
      min="0"
      onChange={(e) =>
        onChromaFalloffChange(Number.parseInt(e.target.value, 10))
      }
      type="range"
      value={chromaFalloff}
    />
    <p className="text-charcoal/60 text-xs">
      How much color intensity fades in lighter and darker shades. Your chosen
      color is always preserved.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Neutral tint options
// ---------------------------------------------------------------------------

type NeutralTint = "pure" | "cool" | "warm" | "brand-tinted";

const NEUTRAL_TINT_OPTIONS: SelectOption[] = [
  { icon: <Circle size={14} />, label: "Pure", value: "pure" },
  { icon: <Snowflake size={14} />, label: "Cool", value: "cool" },
  { icon: <Flame size={14} />, label: "Warm", value: "warm" },
  { icon: <Palette size={14} />, label: "Brand Tinted", value: "brand-tinted" },
];

export const NeutralTintSelector: React.FC<{
  value: NeutralTint;
  onChange: (tint: NeutralTint) => void;
}> = ({ value, onChange }) => (
  <Select
    label="Tint Strategy"
    onValueChange={(v) => onChange(v as NeutralTint)}
    options={NEUTRAL_TINT_OPTIONS}
    size="compact"
    value={value}
  />
);

// ---------------------------------------------------------------------------
// PrimaryColorRow — dedicated layout for the primary color
// ---------------------------------------------------------------------------

export interface PrimaryColorRowProps {
  advancedContent: React.ReactNode;
  color: string;
  description?: string;
  label: string;
  onChange: (color: string) => void;
  ramp: ColorRamp;
}

export const PrimaryColorRow: React.FC<PrimaryColorRowProps> = ({
  label,
  description,
  color,
  onChange,
  ramp,
  advancedContent,
}) => (
  <div className="flex w-full flex-col items-stretch gap-8 md:flex-row">
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-bold text-base text-charcoal">{label}</label>
          {description && (
            <p className="mb-2 text-charcoal/80 text-sm">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ColorPickerPopover color={color} onChange={onChange} />
          <HexColorInput color={color} onChange={onChange} />
        </div>
      </div>
      <ColorRampView className="h-full min-h-[64px] rounded-xl" ramp={ramp} />
    </div>

    <div className="flex w-full shrink-0 flex-col justify-start rounded-xl bg-charcoal/5 p-6 md:w-72">
      {advancedContent}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ColorRow — standard row for secondary / neutral
// ---------------------------------------------------------------------------

export interface ColorRowProps {
  advancedContent?: React.ReactNode;
  color: string;
  description?: string;
  generationMode?: GenerationMode;
  label: string;
  onChange: (color: string) => void;
  onGenerationChange?: (mode: GenerationMode) => void;
  ramp: ColorRamp;
  showInput?: boolean;
}

export const ColorRow: React.FC<ColorRowProps> = ({
  label,
  description,
  color,
  onChange,
  ramp,
  onGenerationChange,
  generationMode,
  advancedContent,
  showInput = true,
}) => {
  const hasSettings = Boolean(onGenerationChange || advancedContent);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="font-bold text-base text-charcoal">{label}</label>
        {description && (
          <p className="text-charcoal/80 text-sm">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ColorPickerPopover color={color} onChange={onChange} />
        {showInput && <HexColorInput color={color} onChange={onChange} />}
      </div>

      <ColorRampView className="h-16 rounded-xl" ramp={ramp} />

      {hasSettings && (
        <div
          aria-label={`${label} settings`}
          className="space-y-4 rounded-xl bg-charcoal/5 p-4"
          role="group"
        >
          {onGenerationChange && (
            <GenerationModeSelector
              onChange={onGenerationChange}
              value={generationMode}
            />
          )}
          {advancedContent}
        </div>
      )}
    </div>
  );
};
