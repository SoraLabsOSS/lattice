import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type React from "react";

// ---------------------------------------------------------------------------
// Trigger size variants (match Input sizing)
// ---------------------------------------------------------------------------

const TRIGGER_SIZES = {
  compact: "text-base px-3 py-2 rounded-xl",
  default: "text-xl px-6 py-4 rounded-2xl",
} as const;

const POPUP_SIZES = {
  compact: "rounded-xl p-1.5",
  default: "rounded-2xl p-2",
} as const;

const ITEM_SIZES = {
  compact: "px-3 py-2 rounded-lg text-sm",
  default: "px-4 py-2.5 rounded-xl text-sm",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectOption {
  icon?: React.ReactNode;
  label: string;
  value: string;
}

export interface SelectProps {
  className?: string;
  disabled?: boolean;
  label?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: keyof typeof TRIGGER_SIZES;
  triggerClassName?: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  label,
  size = "default",
  className = "",
  triggerClassName = "",
  disabled,
}) => {
  const items = options.map((o) => ({ label: o.label, value: o.value }));

  return (
    <div className={`flex w-full min-w-0 flex-col gap-3 ${className}`}>
      {label && (
        <span className="font-medium text-charcoal text-sm">{label}</span>
      )}

      <BaseSelect.Root
        disabled={disabled}
        items={items}
        modal={false}
        onValueChange={(val) => {
          if (val !== null && val !== undefined) {
            onValueChange(val as string);
          }
        }}
        value={value}
      >
        <BaseSelect.Trigger
          className={`flex w-full cursor-pointer items-center gap-2 border border-charcoal/20 bg-white text-charcoal transition-colors hover:border-charcoal/30 focus:outline-blue-500 ${TRIGGER_SIZES[size]} ${triggerClassName}`}
        >
          {/* Render selected option's icon if present */}
          <SelectedIcon options={options} value={value} />
          <BaseSelect.Value
            className="flex-1 truncate text-left"
            placeholder={placeholder}
          />
          <BaseSelect.Icon className="text-charcoal/50 transition-transform data-popup-open:rotate-180">
            <ChevronDown size={size === "compact" ? 14 : 16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner
            alignItemWithTrigger={false}
            className="z-60"
            side="bottom"
            sideOffset={4}
          >
            <BaseSelect.Popup
              className={`w-(--anchor-width) min-w-(--anchor-width) border border-charcoal/10 bg-white shadow-lg ${POPUP_SIZES[size]} max-h-60 origin-top touch-pan-y overflow-y-auto overscroll-contain outline-none transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-[0.95] data-starting-style:scale-[0.95] data-ending-style:opacity-0 data-starting-style:opacity-0`}
              data-lenis-prevent
            >
              {options.map((option) => (
                <BaseSelect.Item
                  className={`flex w-full cursor-pointer items-center gap-2 text-left transition-colors hover:bg-charcoal/5 data-highlighted:bg-charcoal/5 data-selected:font-medium data-selected:text-forest-green ${ITEM_SIZES[size]}`}
                  key={option.value}
                  value={option.value}
                >
                  {option.icon}
                  <BaseSelect.ItemText className="flex-1">
                    {option.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator>
                    <Check size={14} strokeWidth={2.5} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper: renders icon of the currently selected option in the trigger
// ---------------------------------------------------------------------------

const SelectedIcon: React.FC<{ options: SelectOption[]; value: string }> = ({
  options,
  value,
}) => {
  const selected = options.find((o) => o.value === value);
  if (!selected?.icon) {
    return null;
  }
  return <>{selected.icon}</>;
};
