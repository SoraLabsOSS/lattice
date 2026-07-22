import type React from "react";
import { bg, fg, radius, space, transition } from "./tokens";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "critical"
  | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<
  BadgeVariant,
  { color: string; backgroundColor: string }
> = {
  critical: { backgroundColor: bg.criticalSubtle, color: fg.onCriticalSubtle },
  default: { backgroundColor: bg.raisedHover, color: fg.onBaseMuted },
  info: { backgroundColor: bg.infoSubtle, color: fg.onInfoSubtle },
  primary: { backgroundColor: bg.primarySubtle, color: fg.primary },
  success: { backgroundColor: bg.successSubtle, color: fg.onSuccessSubtle },
  warning: { backgroundColor: bg.warningSubtle, color: fg.onWarningSubtle },
};

const Badge: React.FC<BadgeProps> = ({ variant = "default", children }) => (
  <span
    style={{
      borderRadius: radius.badge,
      display: "inline-block",
      fontFamily: "inherit",
      fontSize: "10px",
      fontWeight: 600,
      padding: `3px ${space.lg}`,
      transition: transition.theme,
      ...VARIANT_STYLES[variant],
    }}
  >
    {children}
  </span>
);

export default Badge;
