import { useStore } from "@nanostores/react";
import type { ColorRamp, GenerationMode } from "@soralabsoss/generator";
import {
  BRAND_PRESETS,
  generateOklchRamp,
  getGeneratedColor,
  matchBrandPreset,
  maxChromaForLH,
  NEUTRAL_STEPS,
  SEMANTIC_HUES,
  toOklch,
} from "@soralabsoss/generator";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SwatchBook } from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { ColorRampView } from "../Showcase/color-ramp-view";
import { ColorPickerPopover } from "../ui/color-picker-popover";
import { Select, type SelectOption } from "../ui/select";
import {
  GenerationModeSelector,
  HexColorInput,
  NeutralTintSelector,
  RampSliders,
} from "./color-row";
import { StatusColorRow } from "./status-color-row";
import {
  $brandConfig,
  applyBrandPreset,
  updateConfig,
  updateRampStep,
} from "./store";
import { type ColorSlot, useColorRamps } from "./use-color-ramps";

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

function rampFromHex(hex: string, isDark: boolean): ColorRamp {
  const oklch = toOklch(hex);
  const h = oklch?.h || 0;
  const l = oklch?.l ?? 0.5;
  const c = oklch?.c ?? 0;
  const maxC = maxChromaForLH(l, h);
  const satRatio = maxC > 0 ? c / maxC : 0;
  return generateOklchRamp(h, c, l, 0.8, {
    mode: isDark ? "dark" : "light",
    satRatio,
  });
}

const CUSTOM_PRESET_VALUE = "custom";

const PRESET_OPTIONS: SelectOption[] = [
  {
    icon: <SwatchBook size={14} />,
    label: "Custom",
    value: CUSTOM_PRESET_VALUE,
  },
  ...BRAND_PRESETS.map((preset) => ({
    icon: (
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/10"
        style={{ backgroundColor: preset.color }}
      />
    ),
    label: preset.label,
    value: preset.id,
  })),
];

const AdditionalColorRow: React.FC<
  ColorSlot & { onStepChange: (step: number, color: string) => void }
> = ({ name, ramp, onStepChange }) => {
  const isSemantic = SEMANTIC_HUES.includes(name);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-charcoal/70 text-sm">{name}</span>
        {isSemantic && (
          <span className="rounded bg-charcoal/5 px-1.5 py-0.5 font-medium text-[10px] text-charcoal/50">
            core
          </span>
        )}
      </div>
      <ColorRampView
        className="h-6 rounded-lg"
        onStepChange={onStepChange}
        ramp={ramp}
      />
    </div>
  );
};

const TabColor: React.FC<{ isDarkMode?: boolean }> = ({
  isDarkMode = false,
}) => {
  const config = useStore($brandConfig);
  const derived = useColorRamps(config, isDarkMode);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const accentColor = useMemo(() => {
    if (config.useCustomAccent && config.accentColor) {
      return config.accentColor;
    }
    return getGeneratedColor(
      config.primaryColor,
      config.accentGenerationMode || "triadic"
    );
  }, [
    config.accentColor,
    config.accentGenerationMode,
    config.primaryColor,
    config.useCustomAccent,
  ]);

  const tertiaryColor = useMemo(() => {
    if (config.useCustomTertiary && config.tertiaryColor) {
      return config.tertiaryColor;
    }
    return getGeneratedColor(
      config.primaryColor,
      config.tertiaryGenerationMode || "analogous"
    );
  }, [
    config.primaryColor,
    config.tertiaryColor,
    config.tertiaryGenerationMode,
    config.useCustomTertiary,
  ]);

  const accentRamp = useMemo(
    () => rampFromHex(accentColor, isDarkMode),
    [accentColor, isDarkMode]
  );
  const tertiaryRamp = useMemo(
    () => rampFromHex(tertiaryColor, isDarkMode),
    [isDarkMode, tertiaryColor]
  );

  const statusRamps = useMemo(
    () => ({
      error: rampFromHex(config.statusColors.error, isDarkMode),
      info: rampFromHex(config.statusColors.info, isDarkMode),
      success: rampFromHex(config.statusColors.success, isDarkMode),
      warning: rampFromHex(config.statusColors.warning, isDarkMode),
    }),
    [config.statusColors, isDarkMode]
  );

  const handlePrimaryChange = useCallback(
    (c: string) => updateConfig({ primaryColor: c, rampOverrides: {} }),
    []
  );

  const handleSecondaryChange = useCallback(
    (c: string) =>
      updateConfig({ secondaryColor: c, useCustomSecondary: true }),
    []
  );

  const handleSecondaryGeneration = useCallback(
    (mode: GenerationMode) =>
      updateConfig({
        secondaryGenerationMode: mode,
        useCustomSecondary: false,
      }),
    []
  );

  const handleAccentChange = useCallback((c: string) => {
    updateConfig({
      accentColor: c,
      rampOverrides: {},
      useAccent: true,
      useCustomAccent: true,
    });
  }, []);

  const handleAccentGeneration = useCallback((mode: GenerationMode) => {
    updateConfig({
      accentGenerationMode: mode,
      useAccent: true,
      useCustomAccent: false,
    });
  }, []);

  const handleTertiaryChange = useCallback((c: string) => {
    updateConfig({
      rampOverrides: {},
      tertiaryColor: c,
      useCustomTertiary: true,
      useTertiary: true,
    });
  }, []);

  const handleTertiaryGeneration = useCallback((mode: GenerationMode) => {
    updateConfig({
      tertiaryGenerationMode: mode,
      useCustomTertiary: false,
      useTertiary: true,
    });
  }, []);

  const handleStatusChange = useCallback(
    (key: keyof typeof config.statusColors) => (color: string) => {
      updateConfig({
        statusColors: { ...config.statusColors, [key]: color },
      });
    },
    [config.statusColors]
  );

  const handleNeutralTintChange = useCallback(
    (tint: "pure" | "cool" | "warm" | "brand-tinted") =>
      updateConfig({ neutralTint: tint }),
    []
  );

  const handleChromaFalloffChange = useCallback(
    (value: number) => updateConfig({ chromaFalloff: value }, "chromaFalloff"),
    []
  );

  const handleRampStep = useCallback(
    (rampKey: string) => (step: number, color: string) =>
      updateRampStep(rampKey, step, color),
    []
  );

  const activePreset = matchBrandPreset(config.primaryColor);
  const presetValue = activePreset?.id ?? CUSTOM_PRESET_VALUE;

  const handlePresetChange = useCallback((id: string) => {
    if (id === CUSTOM_PRESET_VALUE) {
      return;
    }
    applyBrandPreset(id);
  }, []);

  const presetHint = useMemo(() => {
    if (!activePreset) {
      return "Pick a seed brand, or keep editing custom colors below.";
    }
    return activePreset.description;
  }, [activePreset]);

  return (
    <div className="flex flex-col gap-8">
      {/* Brand presets */}
      <div className="flex flex-col gap-1.5">
        <Select
          label="Preset"
          onValueChange={handlePresetChange}
          options={PRESET_OPTIONS}
          placeholder="Choose a preset…"
          size="compact"
          value={presetValue}
        />
        <p className="text-charcoal/80 text-xs">{presetHint}</p>
      </div>

      {/* Primary color picker */}
      <div className="flex flex-col gap-3">
        <label className="font-medium text-charcoal text-sm">
          Primary Color
        </label>
        <div className="flex items-center gap-3">
          <ColorPickerPopover
            color={config.primaryColor}
            onChange={handlePrimaryChange}
          />
          <HexColorInput
            color={config.primaryColor}
            onChange={handlePrimaryChange}
          />
        </div>
        <ColorRampView
          className="h-8 rounded-lg"
          onStepChange={handleRampStep("primary")}
          ramp={derived.primaryRamp}
        />
        <div>
          <button
            aria-controls="primary-advanced-settings"
            aria-expanded={isAdvancedOpen}
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg py-2 font-medium text-sm transition-colors ${
              isAdvancedOpen
                ? "text-forest-green"
                : "text-charcoal/70 hover:text-charcoal"
            }`}
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            type="button"
          >
            <span>Advanced Settings</span>
            <ChevronDown
              className={`transition-transform duration-200 ${isAdvancedOpen ? "rotate-180" : ""}`}
              size={16}
            />
          </button>

          <AnimatePresence initial={false}>
            {isAdvancedOpen && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                id="primary-advanced-settings"
                initial={{ height: 0, opacity: 0 }}
                transition={{
                  height: EXPAND_TRANSITION,
                  opacity: { duration: 0.2, ease: "easeInOut" },
                }}
              >
                <div className="mt-2 rounded-xl bg-charcoal/5 p-4">
                  <RampSliders
                    chromaFalloff={config.chromaFalloff}
                    onChromaFalloffChange={handleChromaFalloffChange}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Secondary color */}
      <div className="flex flex-col gap-5 border-charcoal/10 border-t pt-6">
        <div className="flex flex-col gap-3">
          <label className="font-medium text-charcoal text-sm">Secondary</label>
          <div className="flex items-center gap-3">
            <ColorPickerPopover
              color={derived.secondaryColor}
              onChange={handleSecondaryChange}
            />
            <HexColorInput
              color={derived.secondaryColor}
              onChange={handleSecondaryChange}
            />
          </div>
          <ColorRampView
            className="h-8 rounded-lg"
            onStepChange={handleRampStep("secondary")}
            ramp={derived.secondaryRamp}
          />
        </div>
        <GenerationModeSelector
          onChange={handleSecondaryGeneration}
          value={config.secondaryGenerationMode}
        />
      </div>

      {/* Accent */}
      <div className="flex flex-col gap-4 border-charcoal/10 border-t pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <label
              className="font-medium text-charcoal text-sm"
              htmlFor="use-accent"
            >
              Accent
            </label>
            <p className="text-charcoal/80 text-xs">
              Independent accent surfaces (buttons, chips). Off = follows
              secondary.
            </p>
          </div>
          <button
            aria-checked={config.useAccent}
            aria-label="Enable accent color"
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              config.useAccent ? "bg-forest-green" : "bg-charcoal/15"
            }`}
            id="use-accent"
            onClick={() => updateConfig({ useAccent: !config.useAccent })}
            role="switch"
            type="button"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                config.useAccent ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {config.useAccent && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <ColorPickerPopover
                  color={accentColor}
                  onChange={handleAccentChange}
                />
                <HexColorInput
                  color={accentColor}
                  onChange={handleAccentChange}
                />
              </div>
              <ColorRampView
                className="h-8 rounded-lg"
                onStepChange={handleRampStep("accent")}
                ramp={accentRamp}
              />
            </div>
            <GenerationModeSelector
              onChange={handleAccentGeneration}
              value={config.accentGenerationMode}
            />
          </div>
        )}
      </div>

      {/* Tertiary */}
      <div className="flex flex-col gap-4 border-charcoal/10 border-t pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <label
              className="font-medium text-charcoal text-sm"
              htmlFor="use-tertiary"
            >
              Tertiary
            </label>
            <p className="text-charcoal/80 text-xs">
              Optional third brand hue for charts and accents.
            </p>
          </div>
          <button
            aria-checked={config.useTertiary}
            aria-label="Enable tertiary color"
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              config.useTertiary ? "bg-forest-green" : "bg-charcoal/15"
            }`}
            id="use-tertiary"
            onClick={() => updateConfig({ useTertiary: !config.useTertiary })}
            role="switch"
            type="button"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                config.useTertiary ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {config.useTertiary && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <ColorPickerPopover
                  color={tertiaryColor}
                  onChange={handleTertiaryChange}
                />
                <HexColorInput
                  color={tertiaryColor}
                  onChange={handleTertiaryChange}
                />
              </div>
              <ColorRampView
                className="h-8 rounded-lg"
                onStepChange={handleRampStep("tertiary")}
                ramp={tertiaryRamp}
              />
            </div>
            <GenerationModeSelector
              onChange={handleTertiaryGeneration}
              value={config.tertiaryGenerationMode}
            />
          </div>
        )}
      </div>

      {/* Neutral tint */}
      <div className="flex flex-col gap-3 border-charcoal/10 border-t pt-6">
        <label className="font-medium text-charcoal text-sm">Neutral</label>
        <ColorRampView
          className="h-8 rounded-lg"
          onStepChange={handleRampStep("neutral")}
          ramp={derived.neutralRamp}
          steps={NEUTRAL_STEPS}
        />
        <NeutralTintSelector
          onChange={handleNeutralTintChange}
          value={config.neutralTint}
        />
      </div>

      {/* Status colors */}
      <div className="border-charcoal/10 border-t pt-6">
        <button
          aria-controls="status-color-ramps"
          aria-expanded={isStatusOpen}
          className={`flex w-full cursor-pointer items-center justify-between rounded-lg py-2 font-medium text-sm transition-colors ${
            isStatusOpen
              ? "text-forest-green"
              : "text-charcoal/70 hover:text-charcoal"
          }`}
          onClick={() => setIsStatusOpen(!isStatusOpen)}
          type="button"
        >
          <span>Status Colors</span>
          <ChevronDown
            className={`transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`}
            size={16}
          />
        </button>

        <AnimatePresence initial={false}>
          {isStatusOpen && (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              id="status-color-ramps"
              initial={{ height: 0, opacity: 0 }}
              transition={{
                height: EXPAND_TRANSITION,
                opacity: { duration: 0.2, ease: "easeInOut" },
              }}
            >
              <div className="flex flex-col gap-6 py-4">
                <StatusColorRow
                  baseColor={config.statusColors.success}
                  label="Success"
                  onChange={handleStatusChange("success")}
                  ramp={statusRamps.success}
                />
                <StatusColorRow
                  baseColor={config.statusColors.warning}
                  label="Warning"
                  onChange={handleStatusChange("warning")}
                  ramp={statusRamps.warning}
                />
                <StatusColorRow
                  baseColor={config.statusColors.error}
                  label="Error"
                  onChange={handleStatusChange("error")}
                  ramp={statusRamps.error}
                />
                <StatusColorRow
                  baseColor={config.statusColors.info}
                  label="Info"
                  onChange={handleStatusChange("info")}
                  ramp={statusRamps.info}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Additional colors */}
      <div className="border-charcoal/10 border-t pt-6">
        <button
          aria-controls="additional-color-ramps"
          aria-expanded={isAdditionalOpen}
          className={`flex w-full cursor-pointer items-center justify-between rounded-lg py-2 font-medium text-sm transition-colors ${
            isAdditionalOpen
              ? "text-forest-green"
              : "text-charcoal/70 hover:text-charcoal"
          }`}
          onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
          type="button"
        >
          <span>Additional Colors</span>
          <ChevronDown
            className={`transition-transform duration-200 ${isAdditionalOpen ? "rotate-180" : ""}`}
            size={16}
          />
        </button>

        <AnimatePresence initial={false}>
          {isAdditionalOpen && (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              id="additional-color-ramps"
              initial={{ height: 0, opacity: 0 }}
              transition={{
                height: EXPAND_TRANSITION,
                opacity: { duration: 0.2, ease: "easeInOut" },
              }}
            >
              <div className="flex flex-col gap-6 py-4">
                {derived.additionalColors.map((slot) => (
                  <AdditionalColorRow
                    key={slot.name}
                    {...slot}
                    onStepChange={handleRampStep(slot.name)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabColor;
