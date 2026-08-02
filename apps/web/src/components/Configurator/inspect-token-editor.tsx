import { useStore } from "@nanostores/react";
import type {
  BrandConfig,
  PrimitiveMapping,
  StyleOverrides,
} from "@soralabsoss/generator";
import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  $brandConfig,
  updateConfig,
  updateRampStep,
} from "../BrandIntake/store";
import { getTokenEditInfo, type TokenEditInfo } from "./inspect-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POPOVER_W = 224; // 200px picker + p-3 * 2
const MARGIN = 12;

const DENSITY_BASE: Record<"compact" | "default" | "comfortable", number> = {
  comfortable: 10,
  compact: 6,
  default: 8,
};

const MOTION_DEFAULTS: Record<
  "minimal" | "balanced" | "expressive",
  { gradual: number; swift: number }
> = {
  balanced: { gradual: 350, swift: 150 },
  expressive: { gradual: 500, swift: 250 },
  minimal: { gradual: 250, swift: 100 },
};

function patchOverrides(
  current: StyleOverrides | undefined,
  patch: StyleOverrides
): StyleOverrides | undefined {
  const next: StyleOverrides = { ...current, ...patch };
  return Object.keys(next).length > 0 ? next : undefined;
}

const RGBA_OPACITY_RE = /rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/;

function readTokenColor(tokenName: string): string {
  const key = `--${tokenName}`;
  const scopes = document.querySelectorAll<HTMLElement>(
    "[data-token-scope], [data-cards-demo-root]"
  );
  for (const el of scopes) {
    const value = getComputedStyle(el).getPropertyValue(key).trim();
    if (value) {
      return value;
    }
  }
  return (
    getComputedStyle(document.documentElement).getPropertyValue(key).trim() ||
    "#000000"
  );
}

function parseShadowOpacity(
  value: string | undefined,
  fallback: number
): number {
  if (!value || value === "none") {
    return 0;
  }
  const match = RGBA_OPACITY_RE.exec(value);
  if (!match?.[1]) {
    return fallback;
  }
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function editHeaderLabel(info: TokenEditInfo): string {
  if (info.kind === "primaryColor") {
    return `${info.displayRamp} · base`;
  }
  if (info.kind === "ramp") {
    return `${info.displayRamp} · ${info.step}`;
  }
  return info.label;
}

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
  const config = useStore($brandConfig);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [color, setColor] = useState(() => readTokenColor(tokenName));

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

  const isColor = info.kind === "primaryColor" || info.kind === "ramp";

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (info.kind === "primaryColor") {
      updateConfig({ primaryColor: newColor });
    } else if (info.kind === "ramp") {
      updateRampStep(info.rampKey, info.step, newColor);
    }
  };

  const handleHexInput = (raw: string) => {
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    if (cleaned.length === 6) {
      handleColorChange(`#${cleaned}`);
    }
  };

  const writeOverrides = (patch: StyleOverrides, coalesceKey: string) => {
    updateConfig(
      {
        styleOverrides: patchOverrides(config.styleOverrides, patch),
      },
      coalesceKey
    );
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
      style={{ left: position.left, top: position.top, width: POPOVER_W }}
      transition={{ duration: 0.12 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-charcoal/60">
          {editHeaderLabel(info)}
        </span>
      </div>

      {isColor ? (
        <>
          <HexColorPicker
            color={color}
            onChange={handleColorChange}
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
                onChange={(e) => handleHexInput(e.target.value)}
                value={color.replace("#", "").toUpperCase()}
              />
            </div>
            <button
              className="cursor-pointer font-bold text-forest-green text-xs hover:underline"
              onClick={onClose}
              type="button"
            >
              Done
            </button>
          </div>
        </>
      ) : (
        <StyleTokenControls
          config={config}
          info={info}
          onClose={onClose}
          writeOverrides={writeOverrides}
        />
      )}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Style sliders
// ---------------------------------------------------------------------------

const StyleTokenControls: React.FC<{
  config: BrandConfig;
  info: Exclude<TokenEditInfo, { kind: "ramp" } | { kind: "primaryColor" }>;
  onClose: () => void;
  writeOverrides: (patch: StyleOverrides, coalesceKey: string) => void;
}> = ({ config, info, onClose, writeOverrides }) => {
  const overrides = config.styleOverrides ?? {};
  const motionDefaults = MOTION_DEFAULTS[config.expressiveness];

  if (info.kind === "dimensionBase") {
    const value = overrides.dimensionBasePx ?? DENSITY_BASE[config.density];
    return (
      <SliderField
        format={(v) => `${Math.round(v)}px`}
        id="inspect-dimension-base"
        label="Base"
        max={14}
        min={4}
        onChange={(v) =>
          writeOverrides({ dimensionBasePx: v }, "inspect:dimensionBasePx")
        }
        onDone={onClose}
        step={1}
        value={value}
      />
    );
  }

  if (info.kind === "radiusScale") {
    const value = overrides.radiusScale ?? 1;
    return (
      <SliderField
        format={(v) => `${v.toFixed(2)}×`}
        id="inspect-radius-scale"
        label="Scale"
        max={1.5}
        min={0.5}
        onChange={(v) =>
          writeOverrides({ radiusScale: v }, "inspect:radiusScale")
        }
        onDone={onClose}
        step={0.05}
        value={value}
      />
    );
  }

  if (info.kind === "shadowOpacity") {
    const value =
      info.which === "raised"
        ? parseShadowOpacity(
            overrides.shadowRaised,
            config.shadows === "none" ? 0 : 0.06
          )
        : parseShadowOpacity(
            overrides.shadowOverlay,
            config.shadows === "none" ? 0.05 : 0.1
          );
    return (
      <SliderField
        format={(v) => v.toFixed(2)}
        id={`inspect-shadow-${info.which}`}
        label="Opacity"
        max={info.which === "raised" ? 0.3 : 0.4}
        min={0}
        onChange={(v) => {
          if (info.which === "raised") {
            if (v <= 0) {
              writeOverrides({ shadowRaised: "none" }, "inspect:shadowRaised");
              return;
            }
            writeOverrides(
              { shadowRaised: `0 1px 3px rgba(15,23,42,${v})` },
              "inspect:shadowRaised"
            );
            return;
          }
          writeOverrides(
            {
              shadowOverlay: `0 10px 25px rgba(15,23,42,${v}), 0 4px 10px rgba(15,23,42,${v * 0.6})`,
            },
            "inspect:shadowOverlay"
          );
        }}
        onDone={onClose}
        step={0.01}
        value={value}
      />
    );
  }

  // transitionMs
  const value =
    info.which === "swift"
      ? (overrides.transitionSwiftMs ?? motionDefaults.swift)
      : (overrides.transitionGradualMs ?? motionDefaults.gradual);
  return (
    <SliderField
      format={(v) => `${Math.round(v)}ms`}
      id={`inspect-transition-${info.which}`}
      label="Duration"
      max={info.which === "swift" ? 400 : 800}
      min={info.which === "swift" ? 50 : 100}
      onChange={(v) => {
        if (info.which === "swift") {
          writeOverrides({ transitionSwiftMs: v }, "inspect:transitionSwiftMs");
          return;
        }
        writeOverrides(
          { transitionGradualMs: v },
          "inspect:transitionGradualMs"
        );
      }}
      onDone={onClose}
      step={10}
      value={value}
    />
  );
};

const SliderField: React.FC<{
  format: (value: number) => string;
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  onDone: () => void;
  step: number;
  value: number;
}> = ({ id, label, min, max, step, value, format, onChange, onDone }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <label className="text-charcoal text-xs" htmlFor={id}>
        {label}
      </label>
      <span className="font-mono text-charcoal/80 text-xs">
        {format(value)}
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
    <button
      className="cursor-pointer self-end font-bold text-forest-green text-xs hover:underline"
      onClick={onDone}
      type="button"
    >
      Done
    </button>
  </div>
);
