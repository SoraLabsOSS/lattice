import type { PrimitiveMapping } from "@sora-lattice/generator";
import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { updateConfig, updateRampStep } from "../BrandIntake/store";
import { getTokenEditInfo } from "./inspectUtils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POPOVER_W = 224; // 200px picker + p-3 * 2
const MARGIN = 12;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InspectTokenEditorProps {
  anchorRect: DOMRect;
  isDarkMode: boolean;
  onClose: () => void;
  /** Same as inspect flyout — keeps highlight alive when `relatedTarget` is missing on leave */
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  semanticMap: Record<string, PrimitiveMapping>;
  tokenName: string;
}

export const InspectTokenEditor: React.FC<InspectTokenEditorProps> = ({
  tokenName,
  isDarkMode,
  semanticMap,
  anchorRect,
  onClose,
  onMouseEnter,
}) => {
  const info = getTokenEditInfo(tokenName, isDarkMode, semanticMap);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  // Get current resolved value from the DOM
  const initialColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--${tokenName}`)
      .trim() || "#000000";

  const [color, setColor] = useState(initialColor);

  // Position next to the anchor (edit button)
  useLayoutEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchorRect.top;
    let left = anchorRect.right + 8;

    // Flip left if not enough room to the right
    if (left + POPOVER_W > vw - MARGIN) {
      left = anchorRect.left - POPOVER_W - 8;
    }
    if (left < MARGIN) {
      left = MARGIN;
    }

    // Keep vertically in viewport
    const estimatedH = 280;
    if (top + estimatedH > vh - MARGIN) {
      top = vh - estimatedH - MARGIN;
    }
    if (top < MARGIN) {
      top = MARGIN;
    }

    setPosition({ left, top });
  }, [anchorRect]);

  // Click-outside detection
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    };
    // Delay to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!info) {
    return null;
  }

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (info.kind === "primaryColor") {
      updateConfig({ primaryColor: newColor });
    } else {
      updateRampStep(info.rampKey, info.step, newColor);
    }
  };

  const handleHexInput = (raw: string) => {
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    if (cleaned.length === 6) {
      handleColorChange(`#${cleaned}`);
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-[10000] rounded-xl border border-charcoal/10 bg-white p-3 shadow-xl"
      data-inspect-overlay
      exit={{ opacity: 0, scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={onMouseEnter}
      ref={popoverRef}
      style={{ left: position.left, top: position.top }}
      transition={{ duration: 0.12 }}
    >
      {/* Label */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-charcoal/60">
          {info.displayRamp} &middot;{" "}
          {info.kind === "primaryColor" ? "base" : info.step}
        </span>
      </div>

      {/* Color picker */}
      <HexColorPicker
        color={color}
        onChange={handleColorChange}
        style={{ width: "200px" }}
      />

      {/* Hex input + done */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="relative flex items-center">
          <span className="absolute left-1.5 font-mono text-charcoal/40 text-xs">
            #
          </span>
          <input
            aria-label="Hex color value"
            className="w-22 rounded-md border border-charcoal/10 bg-charcoal/5 py-1 pr-1.5 pl-5 font-mono text-xs outline-none focus:border-forest-green"
            maxLength={6}
            onChange={(e) => handleHexInput(e.target.value)}
            value={color.replace("#", "").toUpperCase()}
          />
        </div>
        <button
          className="cursor-pointer font-bold text-forest-green text-xs hover:underline"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </motion.div>
  );
};
