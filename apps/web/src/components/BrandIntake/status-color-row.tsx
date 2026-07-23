import type { ColorRamp } from "@sora-lattice/generator";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { ColorRampView } from "../Showcase/color-ramp-view";
import { ColorPickerPopover } from "../ui/color-picker-popover";

export interface StatusColorRowProps {
  baseColor: string;
  description?: string;
  label: string;
  onChange: (color: string) => void;
  ramp: ColorRamp;
}

export const StatusColorRow: React.FC<StatusColorRowProps> = ({
  label,
  ramp,
  baseColor,
  onChange,
  description: _description,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <label className="text-base text-charcoal/80">{label}</label>
        </div>
        <button
          className={`text-sm transition-colors ${
            isOpen
              ? "text-forest-green"
              : "text-charcoal/20 hover:text-charcoal/80"
          }`}
          onClick={toggleOpen}
          type="button"
        >
          {isOpen ? "Close" : "Edit Base"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            animate={{ height: "auto", marginBottom: 16, opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, marginBottom: 0, opacity: 0 }}
            initial={{ height: 0, marginBottom: 0, opacity: 0 }}
          >
            <div className="flex items-center gap-4 rounded-xl bg-charcoal/5 p-4">
              <ColorPickerPopover color={baseColor} onChange={onChange} />
              <div className="flex flex-col">
                <span className="font-mono text-charcoal text-xs">
                  {baseColor.toUpperCase()}
                </span>
                <span className="text-[10px] text-charcoal/80">Base Hex</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ColorRampView className="h-12 rounded-xl" ramp={ramp} />
    </div>
  );
};
