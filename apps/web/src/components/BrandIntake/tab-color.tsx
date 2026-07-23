import { useStore } from "@nanostores/react";
import type { GenerationMode } from "@soralabsoss/generator";
import { NEUTRAL_STEPS, SEMANTIC_HUES } from "@soralabsoss/generator";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { ColorRampView } from "../Showcase/color-ramp-view";
import { ColorPickerPopover } from "../ui/color-picker-popover";
import {
  GenerationModeSelector,
  HexColorInput,
  NeutralTintSelector,
  RampSliders,
} from "./color-row";
import { $brandConfig, updateConfig, updateRampStep } from "./store";
import { type ColorSlot, useColorRamps } from "./use-color-ramps";

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

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

  const handleNeutralTintChange = useCallback(
    (tint: "pure" | "cool" | "warm" | "brand-tinted") =>
      updateConfig({ neutralTint: tint }),
    []
  );

  const handleChromaFalloffChange = useCallback(
    (value: number) => updateConfig({ chromaFalloff: value }),
    []
  );

  const handleRampStep = useCallback(
    (rampKey: string) => (step: number, color: string) =>
      updateRampStep(rampKey, step, color),
    []
  );

  return (
    <div className="flex flex-col gap-8">
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
        {false}
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
