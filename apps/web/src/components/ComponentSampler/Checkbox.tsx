import { Check } from "lucide-react";
import type React from "react";
import { bg, border, fg, radius, transition } from "./tokens";

interface CheckboxProps {
  checked: boolean;
  id?: string;
  label?: React.ReactNode;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  id,
}) => {
  const checkId = id || `checkbox-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div style={{ alignItems: "flex-start", display: "flex", gap: "8px" }}>
      <button
        aria-checked={checked}
        id={checkId}
        onClick={() => onChange(!checked)}
        role="checkbox"
        style={{
          alignItems: "center",
          backgroundColor: checked ? bg.primary : "transparent",
          border: checked ? "none" : `1.5px solid ${border.strong}`,
          borderRadius: radius.badge,
          cursor: "pointer",
          display: "flex",
          flexShrink: 0,
          height: "16px",
          justifyContent: "center",
          marginTop: "1px",
          padding: 0,
          transition: transition.interactive,
          width: "16px",
        }}
      >
        {checked && <Check size={10} style={{ color: fg.onPrimary }} />}
      </button>
      {label && (
        <label
          htmlFor={checkId}
          style={{
            color: checked ? fg.onBaseMuted : fg.onBase,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "12px",
            lineHeight: 1.4,
            textDecoration: checked ? "line-through" : "none",
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
