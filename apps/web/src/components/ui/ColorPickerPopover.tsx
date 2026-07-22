import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { createPortal } from "react-dom";

export interface ColorPickerPopoverProps {
  /** aria-label for the swatch button (defaults to label or "Pick color") */
  ariaLabel?: string;
  color: string;
  /** Optional label rendered above the swatch */
  label?: string;
  onChange: (color: string) => void;
  /** Fixed width for the HexColorPicker (e.g. '200px') */
  pickerWidth?: string;
  /** Show hex input inside the popover */
  showHexInput?: boolean;
  /** CSS class for the swatch button (defaults to a sensible size) */
  swatchClassName?: string;
}

const DEFAULT_SWATCH_CLASS =
  "w-12 h-12 rounded-xl shadow-sm border-2 border-white cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shrink-0";

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  label,
  ariaLabel,
  showHexInput = false,
  swatchClassName = DEFAULT_SWATCH_CLASS,
  pickerWidth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update popover position when opened or on scroll/resize (fixed = viewport coords)
  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        left: rect.left,
        top: rect.bottom + 8,
      });
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
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
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
    requestAnimationFrame(() => {
      popoverRef.current?.focus();
    });
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className={label ? "flex flex-col gap-2" : ""}>
      {label && <label className="text-[12px] text-charcoal/80">{label}</label>}
      <button
        aria-controls={isOpen ? popoverId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel || label || "Pick color"}
        className={swatchClassName}
        onClick={() => {
          if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({ left: rect.left, top: rect.bottom + 8 });
          }
          setIsOpen(!isOpen);
        }}
        ref={triggerRef}
        style={{ backgroundColor: color }}
        type="button"
      />
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                aria-label={ariaLabel || label || "Color picker"}
                className="fixed z-[9999] rounded-xl border border-charcoal/10 bg-white p-3 shadow-xl"
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                id={popoverId}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                ref={popoverRef}
                role="dialog"
                style={{
                  left: position.left,
                  top: position.top,
                }}
                tabIndex={-1}
                transition={{ duration: 0.2 }}
              >
                <HexColorPicker
                  color={color}
                  onChange={onChange}
                  {...(pickerWidth ? { style: { width: pickerWidth } } : {})}
                />
                {showHexInput && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-mono text-charcoal/40 text-xs">
                      #
                    </span>
                    <HexColorInput
                      aria-label={`${ariaLabel || label || "Color"} hex value`}
                      className="flex-1 rounded-md border border-charcoal/10 bg-charcoal/5 px-2 py-1.5 font-mono text-charcoal/80 text-xs uppercase outline-none focus:border-forest-green/40"
                      color={color}
                      onChange={onChange}
                      prefixed={false}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default ColorPickerPopover;
