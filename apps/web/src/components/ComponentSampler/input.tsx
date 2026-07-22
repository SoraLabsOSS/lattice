import type React from "react";
import {
  bg,
  border,
  type ControlSize,
  fg,
  field,
  font,
  radius,
  space,
  transition,
  weight,
} from "./tokens";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: React.FC<{ size?: number; style?: React.CSSProperties }>;
  label?: string;
  size?: ControlSize;
}

const SIZE_STYLES: Record<ControlSize, React.CSSProperties> = {
  lg: {
    fontSize: field.lg.size,
    lineHeight: field.lg.lineHeight,
    padding: `${space.lg}`,
  },
  md: {
    fontSize: field.md.size,
    lineHeight: field.md.lineHeight,
    padding: `${space.md}`,
  },
  sm: {
    fontSize: field.sm.size,
    lineHeight: field.sm.lineHeight,
    padding: `${space.sm}`,
  },
  xs: {
    fontSize: field.xs.size,
    lineHeight: field.xs.lineHeight,
    padding: `${space.sm}`,
  },
};

const ICON_SIZE: Record<ControlSize, number> = {
  lg: 15,
  md: 13,
  sm: 12,
  xs: 11,
};

const Input: React.FC<InputProps> = ({
  label,
  id,
  size = "md",
  style,
  icon: Icon,
  ...rest
}) => {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const sharedTextStyle: React.CSSProperties = {
    color: fg.onBase,
    fontFamily: font.field,
    fontWeight: weight.field,
    ...SIZE_STYLES[size],
  };

  const containerBaseStyle: React.CSSProperties = {
    backgroundColor: bg.base,
    border: `1px solid ${border.neutral}`,
    borderRadius: radius.field,
    boxSizing: "border-box",
    transition: transition.interactive,
    width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            color: fg.onBase,
            fontFamily: "inherit",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      {Icon ? (
        <div
          style={{
            ...containerBaseStyle,
            alignItems: "center",
            display: "flex",
            gap: "8px",
            ...sharedTextStyle,
            ...style,
          }}
        >
          <Icon
            size={ICON_SIZE[size]}
            style={{ color: fg.onBaseFaint, flexShrink: 0 }}
          />
          <input
            id={inputId}
            {...rest}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontFamily: "inherit",
              fontSize: "inherit",
              fontWeight: "inherit",
              lineHeight: "inherit",
              outline: "none",
              padding: 0,
              width: "100%",
            }}
          />
        </div>
      ) : (
        <input
          id={inputId}
          {...rest}
          style={{
            ...sharedTextStyle,
            ...containerBaseStyle,
            outline: "none",
            ...style,
          }}
        />
      )}
    </div>
  );
};

export default Input;
