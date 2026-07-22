import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import type React from "react";
import { bg, fg, radius, space, transition } from "./tokens";

export type AlertVariant = "info" | "success" | "warning" | "critical";

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
}

const ICON_MAP = {
  critical: XCircle,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

const Alert: React.FC<AlertProps> = ({ variant = "info", children }) => {
  const Icon = ICON_MAP[variant];

  return (
    <div
      role="alert"
      style={{
        alignItems: "flex-start",
        backgroundColor: bg.primarySubtle,
        borderRadius: radius.container,
        color: fg.onBase,
        display: "flex",
        fontFamily: "inherit",
        fontSize: "12px",
        gap: space.md,
        lineHeight: 1.5,
        padding: space.lg,
        transition: transition.theme,
      }}
    >
      <Icon size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
      <div>{children}</div>
    </div>
  );
};

export default Alert;
