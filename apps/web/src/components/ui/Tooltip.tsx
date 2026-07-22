import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type React from "react";

export interface TooltipProps {
  children: React.ReactElement;
  label: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  label,
  side = "right",
  children,
}) => (
  <BaseTooltip.Provider closeDelay={0} delay={0}>
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6}>
          <BaseTooltip.Popup className="origin-[var(--transform-origin)] rounded-lg bg-charcoal px-2.5 py-1.5 text-white text-xs shadow-lg transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[open]:scale-100 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[open]:opacity-100 data-[starting-style]:opacity-0">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  </BaseTooltip.Provider>
);
