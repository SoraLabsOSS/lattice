import {
  type ColorRamp,
  type NeutralColorRamp,
  STEPS,
} from "@sora-lattice/generator";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { createPortal } from "react-dom";
import { Tooltip } from "../ui/tooltip";

interface ColorRampViewProps {
  className?: string;
  compact?: boolean;
  label?: string;
  /** When provided, each swatch becomes editable on click. Called with (step, newColor). */
  onStepChange?: (step: number, color: string) => void;
  ramp: ColorRamp | NeutralColorRamp;
  /** Override which step keys to render. Defaults to STEPS (standard 12-step ramp). */
  steps?: readonly number[];
}

const EditableSwatch: React.FC<{
  step: number;
  color: string;
  onStepChange: (step: number, color: string) => void;
}> = ({ step, color, onStepChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const POPOVER_OUTER_W = 200 + 24; // picker width + p-3 * 2
  const MARGIN = 8;

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - POPOVER_OUTER_W / 2;
      left = Math.max(
        MARGIN,
        Math.min(left, window.innerWidth - POPOVER_OUTER_W - MARGIN)
      );
      setPosition({ left, top: rect.bottom + 8 });
    }
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <Tooltip
        label={
          <span className="flex flex-col items-center gap-0.5">
            <span className="font-bold font-mono">{color.toUpperCase()}</span>
            <span className="text-white/70">click to edit</span>
          </span>
        }
        side="top"
      >
        <motion.button
          animate={{ backgroundColor: color }}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`Edit color step ${step}, current value ${color.toUpperCase()}`}
          className="group relative flex-1 cursor-pointer transition-transform hover:z-10 hover:scale-y-110"
          onClick={() => {
            if (!isOpen && triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              let left = rect.left + rect.width / 2 - POPOVER_OUTER_W / 2;
              left = Math.max(
                MARGIN,
                Math.min(left, window.innerWidth - POPOVER_OUTER_W - MARGIN)
              );
              setPosition({ left, top: rect.bottom + 8 });
            }
            setIsOpen(!isOpen);
          }}
          ref={triggerRef}
          style={{ backgroundColor: color }}
          transition={{ duration: 0.3 }}
          type="button"
        />
      </Tooltip>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                aria-label={`Edit color step ${step}`}
                className="fixed z-9999 rounded-xl border border-charcoal/10 bg-white p-3 shadow-xl"
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                ref={popoverRef}
                role="dialog"
                style={{ left: position.left, top: position.top }}
                tabIndex={-1}
                transition={{ duration: 0.15 }}
              >
                <HexColorPicker
                  color={color}
                  onChange={(c) => onStepChange(step, c)}
                  style={{ width: "200px" }}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-1.5 font-mono text-charcoal/40 text-xs">
                      #
                    </span>
                    <input
                      aria-label="Hex color value"
                      className="w-22 rounded-md border border-charcoal/10 bg-charcoal/5 py-1 pr-1.5 pl-5 font-mono text-xs outline-none focus:border-forest-green"
                      maxLength={6}
                      onChange={(e) => {
                        const raw = e.target.value
                          .replace(/[^0-9a-fA-F]/g, "")
                          .slice(0, 6);
                        if (raw.length === 6) {
                          onStepChange(step, `#${raw}`);
                        }
                      }}
                      value={color.replace("#", "").toUpperCase()}
                    />
                  </div>
                  <button
                    className="cursor-pointer font-bold text-forest-green text-xs hover:underline"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export const ColorRampView: React.FC<ColorRampViewProps> = ({
  ramp,
  steps: stepsProp,
  label,
  compact = false,
  className = "",
  onStepChange,
}) => {
  const stepsToRender = stepsProp ?? STEPS;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[12px] text-charcoal/80">{label}</label>
          <span className="font-mono text-[8px] text-charcoal/20">OKLCH</span>
        </div>
      )}
      <div
        aria-label={label ? `${label} color ramp` : "Color ramp"}
        className={`flex w-full overflow-hidden rounded-lg border border-charcoal/5 shadow-sm ${
          className ? className : compact ? "h-6" : "h-8"
        }`}
      >
        {stepsToRender.map((step) => {
          const color = (ramp as Record<number, string>)[step];
          return onStepChange ? (
            <EditableSwatch
              color={color}
              key={step}
              onStepChange={onStepChange}
              step={step}
            />
          ) : (
            <motion.div
              animate={{ backgroundColor: color }}
              className="group relative flex-1"
              key={step}
              style={{ backgroundColor: color }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorRampView;
