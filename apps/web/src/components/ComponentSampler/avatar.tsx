import type React from "react";
import { bg, fg, radius, transition } from "./tokens";

export type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  colorIndex?: number;
  initials: string;
  size?: AvatarSize;
}

const SIZE_MAP: Record<AvatarSize, number> = { lg: 40, md: 32, sm: 24 };
const FONT_MAP: Record<AvatarSize, string> = {
  lg: "13px",
  md: "11px",
  sm: "9px",
};

const BG_CYCLE = [
  bg.primarySubtle,
  bg.accentSubtle,
  bg.successSubtle,
  bg.warningSubtle,
  bg.infoSubtle,
  bg.criticalSubtle,
];

const Avatar: React.FC<AvatarProps> = ({
  initials,
  size = "md",
  colorIndex = 0,
}) => {
  const px = SIZE_MAP[size];
  return (
    <div
      aria-label={initials}
      style={{
        alignItems: "center",
        backgroundColor: BG_CYCLE[colorIndex % BG_CYCLE.length],
        borderRadius: radius.action,
        color: fg.onBase,
        display: "flex",
        flexShrink: 0,
        fontFamily: "inherit",
        fontSize: FONT_MAP[size],
        fontWeight: 700,
        height: `${px}px`,
        justifyContent: "center",
        transition: transition.theme,
        width: `${px}px`,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
