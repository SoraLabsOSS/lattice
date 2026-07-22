import { Input as BaseInput } from "@base-ui/react/input";
import React from "react";

const SIZE_CLASSES = {
  compact: "text-base px-3 py-2 rounded-xl",
  default: "text-xl px-6 py-4 rounded-2xl",
} as const;

export interface InputProps
  extends Omit<React.ComponentPropsWithRef<typeof BaseInput>, "size"> {
  size?: keyof typeof SIZE_CLASSES;
}

export const Input = React.forwardRef<HTMLElement, InputProps>(
  ({ size = "default", className = "", ...rest }, ref) => (
    <BaseInput
      className={`w-full min-w-0 bg-white ${SIZE_CLASSES[size]} border border-charcoal/20 text-charcoal transition-colors placeholder:text-charcoal/50 hover:border-charcoal/30 focus:outline-blue-500 ${className}`}
      ref={ref}
      {...rest}
    />
  )
);

Input.displayName = "Input";
