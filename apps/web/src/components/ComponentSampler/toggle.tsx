import type React from "react";
import { bg, fg, transition } from "./tokens";

interface ToggleProps {
  checked: boolean;
  id?: string;
  label?: string;
  onChange: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, id }) => {
  const toggleId =
    id ||
    (label ? `toggle-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div style={{ alignItems: "center", display: "flex", gap: "8px" }}>
      <button
        aria-checked={checked}
        aria-label={label}
        id={toggleId}
        onClick={() => onChange(!checked)}
        role="switch"
        style={{
          backgroundColor: checked ? bg.primary : bg.sunkenStrong,
          border: "none",
          borderRadius: "999px",
          cursor: "pointer",
          flexShrink: 0,
          height: "18px",
          padding: 0,
          position: "relative",
          transition: transition.interactive,
          width: "32px",
        }}
      >
        <span
          style={{
            backgroundColor: bg.base,
            borderRadius: "50%",
            height: "14px",
            left: checked ? "16px" : "2px",
            position: "absolute",
            top: "2px",
            transition: transition.interactive,
            width: "14px",
          }}
        />
      </button>
      {label && (
        <label
          htmlFor={toggleId}
          style={{
            color: fg.onBase,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "11px",
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Toggle;
