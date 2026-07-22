import type React from "react";
import { useState } from "react";
import {
  action,
  bg,
  border,
  type ControlSize,
  fg,
  font,
  interactive,
  radius,
  space,
  transition,
  weight,
} from "./tokens";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "critical";
export type ButtonSize = ControlSize;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

// Every variant carries a 1px border (even transparent ones) so all buttons —
// and the sibling Input component, which is also 1px-bordered — resolve to the
// same outer height at a given size. Drop the border and primary/critical would
// render 2px shorter than outline/secondary/input at the same size.
const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  critical: {
    backgroundColor: bg.critical,
    border: "1px solid transparent",
    color: fg.onCritical,
  },
  ghost: {
    backgroundColor: "transparent",
    border: "1px solid transparent",
    color: fg.onBaseMuted,
  },
  outline: {
    backgroundColor: "transparent",
    border: `1px solid ${border.neutral}`,
    color: fg.onBase,
  },
  primary: {
    backgroundColor: bg.primary,
    border: "1px solid transparent",
    color: fg.onPrimary,
  },
  secondary: {
    backgroundColor: bg.raised,
    border: `1px solid ${border.neutral}`,
    color: fg.onBase,
  },
};

// Padding scales alongside the type ladder. Line-height already pins the
// control's inner height to the matching icon size (14/16/20/24px), so we
// only need padding to breathe proportionally at each tier.
const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  lg: {
    fontSize: action.lg.size,
    gap: space.sm,
    lineHeight: action.lg.lineHeight,
    padding: `${space.lg} ${space["2xl"]}`,
  },
  md: {
    fontSize: action.md.size,
    gap: space.xs,
    lineHeight: action.md.lineHeight,
    padding: `${space.md} ${space.xl}`,
  },
  sm: {
    fontSize: action.sm.size,
    gap: space.xs,
    lineHeight: action.sm.lineHeight,
    padding: `${space.sm} ${space.lg}`,
  },
  xs: {
    fontSize: action.xs.size,
    gap: space.xs,
    lineHeight: action.xs.lineHeight,
    padding: `${space.xs} ${space.sm}`,
  },
};

// Hover/active are expressed as a translucent scrim rather than a color swap.
// An inset box-shadow with a huge spread floods the border-box with the
// interactive token: it sits above the background but below the label, respects
// the border radius, and works the same on solid and transparent variants.
const scrimShadow = (token: string) => `inset 0 0 0 999px ${token}`;

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}) => {
  const [scrim, setScrim] = useState<"none" | "hover" | "active">("none");
  return (
    <button
      {...rest}
      onMouseDown={(e) => {
        setScrim("active");
        onMouseDown?.(e);
      }}
      onMouseEnter={(e) => {
        setScrim("hover");
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setScrim("none");
        onMouseLeave?.(e);
      }}
      onMouseUp={(e) => {
        setScrim("hover");
        onMouseUp?.(e);
      }}
      style={{
        alignItems: "center",
        borderRadius: radius.action,
        cursor: "pointer",
        display: "inline-flex",
        fontFamily: font.action,
        fontWeight: weight.action,
        justifyContent: "center",
        transition: transition.interactive,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
        ...(scrim === "none"
          ? null
          : {
              boxShadow: scrimShadow(
                scrim === "active" ? interactive.active : interactive.hover
              ),
            }),
      }}
    >
      {children}
    </button>
  );
};

export default Button;
