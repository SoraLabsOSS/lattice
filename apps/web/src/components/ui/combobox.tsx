import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ChevronDown } from "lucide-react";
import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Size variants (shared tokens with Input & Select)
// ---------------------------------------------------------------------------

const INPUT_SIZES = {
  compact: "text-base px-3 py-2 rounded-xl pr-8",
  default: "text-xl px-6 py-4 rounded-2xl pr-10",
} as const;

const POPUP_SIZES = {
  compact: "rounded-xl p-1.5",
  default: "rounded-2xl p-2",
} as const;

const ITEM_SIZES = {
  compact: "px-3 py-2 rounded-lg text-sm",
  default: "px-4 py-2.5 rounded-xl text-sm",
} as const;

const CHEVRON_SIZE = { compact: 14, default: 16 } as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComboboxProps {
  /** Allow committing a value that is not in `options` (custom font names). */
  allowCustom?: boolean;
  className?: string;
  /** Override the displayed input text (e.g. custom font name) */
  displayValue?: string;
  label?: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  size?: keyof typeof INPUT_SIZES;
  value: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Search…",
  label,
  size = "default",
  className = "",
  displayValue,
  allowCustom = false,
}) => {
  const labelId = useId();
  const [inputValue, setInputValue] = useState(displayValue || value);

  useEffect(() => {
    setInputValue(displayValue || value);
  }, [displayValue, value]);

  // Keep a custom/current value selectable even when it is not in the list.
  const items = useMemo(() => {
    if (value && !options.includes(value)) {
      return [value, ...options];
    }
    return options;
  }, [options, value]);

  const commitCustom = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    onValueChange(trimmed);
    setInputValue(trimmed);
  };

  return (
    <div className={`flex w-full min-w-0 flex-col gap-3 ${className}`}>
      {label ? (
        <label className="font-medium text-charcoal text-sm" id={labelId}>
          {label}
        </label>
      ) : null}

      <BaseCombobox.Root
        inputValue={inputValue}
        items={items}
        onInputValueChange={setInputValue}
        onValueChange={(val) => {
          if (val !== null && val !== undefined) {
            onValueChange(val as string);
          }
        }}
        value={value}
      >
        <div className="relative flex items-center">
          <BaseCombobox.Input
            aria-labelledby={label ? labelId : undefined}
            className={`w-full bg-white ${INPUT_SIZES[size]} border border-charcoal/20 text-charcoal transition-colors placeholder:text-charcoal/50 hover:border-charcoal/30 focus:outline-blue-500`}
            onKeyDown={(e) => {
              if (!(allowCustom && e.key === "Enter")) {
                return;
              }
              const trimmed = inputValue.trim();
              if (
                !trimmed ||
                options.includes(trimmed) ||
                items.includes(trimmed)
              ) {
                return;
              }
              e.preventDefault();
              commitCustom(trimmed);
            }}
            placeholder={placeholder}
          />
          <BaseCombobox.Trigger className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-charcoal/30">
            <ChevronDown
              className="transition-transform data-popup-open:rotate-180"
              size={CHEVRON_SIZE[size]}
            />
          </BaseCombobox.Trigger>
        </div>

        <BaseCombobox.Portal>
          <BaseCombobox.Positioner
            className="z-60"
            side="bottom"
            sideOffset={4}
            style={{ width: "var(--anchor-width)" }}
          >
            <BaseCombobox.Popup
              className={`border border-charcoal/10 bg-white shadow-lg ${POPUP_SIZES[size]} max-h-60 origin-top touch-pan-y overflow-y-auto overscroll-contain outline-none transition-[transform,opacity] duration-100 ease-out data-ending-style:scale-y-[0.96] data-starting-style:scale-y-[0.96] data-ending-style:opacity-0 data-starting-style:opacity-0`}
              data-lenis-prevent
            >
              <BaseCombobox.List>
                {(item: string) => (
                  <BaseCombobox.Item
                    className={`w-full text-left ${ITEM_SIZES[size]} cursor-pointer text-charcoal transition-colors hover:bg-charcoal/5 data-highlighted:bg-charcoal/5 data-selected:font-medium data-selected:text-forest-green`}
                    key={item}
                    value={item}
                  >
                    {item}
                  </BaseCombobox.Item>
                )}
              </BaseCombobox.List>

              <BaseCombobox.Empty className="px-2 py-2 text-charcoal/40 text-sm">
                {allowCustom && inputValue.trim() ? (
                  <button
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-charcoal hover:bg-charcoal/5"
                    onClick={() => commitCustom(inputValue)}
                    type="button"
                  >
                    Use “{inputValue.trim()}”
                  </button>
                ) : (
                  <span className="block px-2 py-1">No results found.</span>
                )}
              </BaseCombobox.Empty>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </div>
  );
};
