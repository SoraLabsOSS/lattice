import type React from "react";

/**
 * File-shape SVG icons for the export-page asset cards.
 *
 * Folded-corner page glyph with a colored extension badge. Paper and fold
 * tints are derived from the single `color` prop via OKLCH mixing, so the
 * icon inherits whatever role color the host page resolves from the
 * generated token system (primary / accent / warning / success).
 */

export type FileIconKind = "css" | "json" | "js" | "md";

const LABEL: Record<FileIconKind, string> = {
  css: "CSS",
  js: "JS",
  json: "JSON",
  md: "MD",
};

interface FileIconProps {
  className?: string;
  color: string;
  kind: FileIconKind;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({
  kind,
  color,
  size = 56,
  className,
}) => {
  const label = LABEL[kind];
  const labelLen = label.length;
  // Badge widens for longer extension labels so "JSON" doesn't crowd the corner.
  const badgeWidth = 12 + labelLen * 5;
  const badgeX = 4;
  const badgeY = 36;
  const fontSize = labelLen >= 4 ? 7 : 8;

  const paper = `color-mix(in oklch, ${color} 10%, white)`;
  const fold = `color-mix(in oklch, ${color} 24%, white)`;

  return (
    <svg
      aria-label={`${label} file`}
      className={className}
      fill="none"
      height={size}
      role="img"
      viewBox="0 0 56 56"
      width={size}
    >
      {/* Page body */}
      <path
        d="M10 4 H36 L46 14 V50 A2 2 0 0 1 44 52 H10 A2 2 0 0 1 8 50 V6 A2 2 0 0 1 10 4 Z"
        fill={paper}
        stroke={fold}
        strokeWidth={1.25}
      />
      {/* Folded corner */}
      <path
        d="M36 4 V12 A2 2 0 0 0 38 14 H46"
        fill="none"
        stroke={fold}
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path d="M36 4 L46 14 H38 A2 2 0 0 1 36 12 Z" fill={fold} />
      {/* Filename body lines */}
      <rect fill={fold} height="2" rx="1" width="20" x="14" y="20" />
      <rect fill={fold} height="2" rx="1" width="26" x="14" y="25" />
      <rect fill={fold} height="2" rx="1" width="22" x="14" y="30" />
      {/* Extension badge */}
      <rect
        fill={color}
        height={11}
        rx={2.5}
        width={badgeWidth}
        x={badgeX}
        y={badgeY}
      />
      <text
        fill="#FFFFFF"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={fontSize}
        fontWeight={700}
        letterSpacing="0.5"
        textAnchor="middle"
        x={badgeX + badgeWidth / 2}
        y={badgeY + 8.5}
      >
        {label}
      </text>
    </svg>
  );
};
