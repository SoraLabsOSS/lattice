import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ChevronDown } from "lucide-react";
import type React from "react";

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
  displayValue: _displayValue,
}) => (
  <div className={`flex w-full min-w-0 flex-col gap-3 ${className}`}>
    {label && (
      <label className="font-medium text-charcoal text-sm">{label}</label>
    )}

    <BaseCombobox.Root
      items={options}
      onValueChange={(val) => {
        if (val !== null && val !== undefined) {
          onValueChange(val as string);
        }
      }}
      value={value}
    >
      <div className="relative flex items-center">
        <BaseCombobox.Input
          className={`w-full bg-white ${INPUT_SIZES[size]} border border-charcoal/20 text-charcoal transition-colors placeholder:text-charcoal/50 hover:border-charcoal/30 focus:outline-blue-500`}
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

            <BaseCombobox.Empty className="px-4 py-3 text-charcoal/40 text-sm">
              No results found.
            </BaseCombobox.Empty>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  </div>
);
