import { useStore } from "@nanostores/react";
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

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

// ---------------------------------------------------------------------------
// TabStyle
// ---------------------------------------------------------------------------

const TabStyle: React.FC = () => {
  const config = useStore($brandConfig);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PresetSelector
        description="Controls border radius across all components."
        label="Rounding"
        onChange={(val) =>
          updateConfig({ roundness: val as typeof config.roundness })
        }
        options={ROUNDNESS_OPTIONS}
        value={config.roundness}
      />

      <PresetSelector
        description="Elevation and depth across surfaces."
        label="Shadows"
        onChange={(val) =>
          updateConfig({ shadows: val as typeof config.shadows })
        }
        options={SHADOW_OPTIONS}
        value={config.shadows}
      />

      <PresetSelector
        description="Density of content and whitespace."
        label="Spacing"
        onChange={(val) =>
          updateConfig({ density: val as typeof config.density })
        }
        options={DENSITY_OPTIONS}
        value={config.density}
      />

      <PresetSelector
        description="Animation and transition intensity."
        label="Motion"
        onChange={(val) =>
          updateConfig({ expressiveness: val as typeof config.expressiveness })
        }
        options={MOTION_OPTIONS}
        value={config.expressiveness}
      />

      {/* Advanced (placeholder for future fine-grained controls) */}
      <div className="border-charcoal/5 border-t pt-3">
        <button
          className={`flex w-full cursor-pointer items-center justify-between rounded-lg py-2 font-medium text-sm transition-colors ${
            isAdvancedOpen
              ? "text-forest-green"
              : "text-charcoal/80 hover:text-charcoal"
          }`}
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          <span>Advanced</span>
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
              initial={{ height: 0, opacity: 0 }}
              transition={{
                height: EXPAND_TRANSITION,
                opacity: { duration: 0.2, ease: "easeInOut" },
              }}
            >
              <div className="mt-2 rounded-xl bg-charcoal/5 px-4 py-4">
                <p className="text-charcoal/60 text-xs">
                  Fine-grained controls for exact border-radius, shadow,
                  spacing, and transition values coming soon.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabStyle;
