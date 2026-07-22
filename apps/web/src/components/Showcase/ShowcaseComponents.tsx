import { useStore } from "@nanostores/react";
import { generateRamp } from "@sora-lattice/generator";
import {
  FileImage,
  FileJson,
  Folder,
  Layers,
  Moon,
  Sun,
  User,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { $showcaseConfig, updateShowcase } from "./store";

const SHOWCASE_FONT = "Inter, system-ui, sans-serif";

interface ShowcaseState {
  inputValue: string;
  sliderValue: number;
  toggleValue: boolean;
}

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({
  isDark,
  onToggle,
}) => (
  <button
    className="relative h-8 w-14 cursor-pointer rounded-full p-1 transition-all duration-200 hover:scale-105 active:scale-95"
    onClick={onToggle}
    style={{
      backgroundColor: isDark ? "#374151" : "#e5e7eb",
    }}
  >
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
      style={{
        transform: `translateX(${isDark ? 24 : 0}px)`,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {isDark ? (
        <Moon className="text-gray-600" size={12} />
      ) : (
        <Sun className="text-amber-500" size={12} />
      )}
    </div>
  </button>
);

const Artifact: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  colors: any;
}> = ({ icon, label, sublabel, colors }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-3"
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = colors.surfaceHover;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = colors.surface;
    }}
    style={{
      backgroundColor: colors.surface,
      borderColor: colors.border,
      transition:
        "background-color 0.4s ease, border-color 0.4s ease, transform 0.2s ease",
    }}
  >
    <div
      className="rounded-lg p-2"
      style={{
        backgroundColor: colors.bg,
        color: colors.primary,
        transition: "background-color 0.4s ease, color 0.4s ease",
      }}
    >
      {icon}
    </div>
    <div className="flex flex-col items-center justify-center">
      <span className="font-semibold text-xs" style={{ color: colors.text }}>
        {label}
      </span>
      <span className="text-[10px]" style={{ color: colors.textMuted }}>
        {sublabel}
      </span>
    </div>
  </div>
);

const ShowcaseComponents: React.FC = () => {
  const config = useStore($showcaseConfig);
  const [state, setState] = useState<ShowcaseState>({
    inputValue: "",
    sliderValue: 65,
    toggleValue: true,
  });

  const primaryRamp = useMemo(
    () => generateRamp(config.primaryColor),
    [config.primaryColor]
  );
  const secondaryRamp = useMemo(
    () => generateRamp(config.secondaryColor),
    [config.secondaryColor]
  );

  // Dynamic colors based on mode
  const colors = useMemo(() => {
    const isDark = config.isDarkMode;
    return {
      bg: isDark ? "#0f172a" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      primary: isDark ? primaryRamp[400] : primaryRamp[500],
      primaryHover: isDark ? primaryRamp[300] : primaryRamp[600],
      primaryPastel: isDark ? `${primaryRamp[400]}` : `${primaryRamp[50]}`,
      secondary: isDark ? secondaryRamp[400] : secondaryRamp[500],
      secondaryPastel: isDark
        ? `${secondaryRamp[50]}`
        : `${secondaryRamp[300]}`,
      surface: isDark ? "#1e293b" : "#f8fafc",
      surfaceHover: isDark ? "#334155" : "#f1f5f9",
      text: isDark ? "#f8fafc" : "#0f172a",
      textMuted: isDark ? "rgba(248,250,252,0.6)" : "rgba(15,23,42,0.6)",
    };
  }, [config.isDarkMode, primaryRamp, secondaryRamp]);

  // Dynamic border radius based on config
  const radiuses = useMemo(() => {
    switch (config.roundness) {
      case "sharp":
        return {
          button: "2px",
          card: "2px",
          container: "4px",
          input: "2px",
          tag: "2px",
        };
      case "pill":
        return {
          button: "9999px",
          card: "24px",
          container: "24px",
          input: "9999px",
          tag: "6px",
        };
      case "rounded":
      default:
        return {
          button: "8px",
          card: "12px",
          container: "16px",
          input: "8px",
          tag: "9999px",
        };
    }
  }, [config.roundness]);

  return (
    <>
      <div className="mx-auto -mb-6 flex max-w-xs flex-row items-center justify-between self-center rounded-2xl bg-gray/70 px-4 pt-3 pb-8">
        <p className="text-xs">Dark mode included</p>
        <DarkModeToggle
          isDark={config.isDarkMode}
          onToggle={() => updateShowcase({ isDarkMode: !config.isDarkMode })}
        />
      </div>
      <div
        className="relative flex h-full flex-col rounded-3xl border border-charcoal/5 bg-white p-6 shadow-lg md:p-8"
        style={{
          backgroundColor: colors.bg,
          fontFamily: SHOWCASE_FONT,
          transition: "background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Deliverables Section */}
        <div className="mb-8">
          <div
            className="mb-4 flex items-center gap-2 text-[12px] text-charcoal/80"
            style={{ color: colors.textMuted }}
          >
            Deliverables
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Artifact
              colors={colors}
              icon={<FileJson size={18} />}
              label="tokens.json"
              sublabel="Design Tokens"
            />
            <Artifact
              colors={colors}
              icon={<FileImage size={18} />}
              label="base.fig"
              sublabel="Figma Library"
            />
            <Artifact
              colors={colors}
              icon={<Folder size={18} />}
              label="docs/"
              sublabel="Documentation"
            />
            <Artifact
              colors={colors}
              icon={<Layers size={18} />}
              label="components/"
              sublabel="React Source"
            />
          </div>
        </div>

        {/* Component Grid */}
        <div
          className="mb-4 flex items-center gap-2 text-[12px] text-charcoal/80"
          style={{ color: colors.textMuted }}
        >
          Components
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Card 1: Buttons & Actions */}
          <div
            className="flex flex-col justify-between gap-4 border p-5"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderRadius: radiuses.card,
              transition:
                "background-color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease",
            }}
          >
            <div className="flex flex-col gap-3">
              <button
                className="w-full cursor-pointer px-4 py-2.5 font-medium text-sm text-white shadow-sm"
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: radiuses.button,
                  transition:
                    "background-color 0.4s ease, border-radius 0.4s ease, transform 0.15s ease",
                }}
              >
                Primary Action
              </button>
              <button
                className="w-full cursor-pointer border px-4 py-2.5 font-medium text-sm"
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primary}1a`;
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primary}10`;
                  e.currentTarget.style.transform = "scale(1)";
                }}
                style={{
                  backgroundColor: "transparent",
                  borderColor: colors.primary,
                  borderRadius: radiuses.button,
                  color: colors.primary,
                  transition:
                    "color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease, background-color 0.15s ease, transform 0.15s ease",
                }}
              >
                Secondary Action
              </button>
              <button
                className="w-full cursor-pointer px-4 py-2.5 font-medium text-sm"
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                style={{
                  backgroundColor: "transparent",
                  borderRadius: radiuses.button,
                  color: colors.textMuted,
                  transition:
                    "color 0.4s ease, border-radius 0.4s ease, background-color 0.15s ease, transform 0.15s ease",
                }}
              >
                Ghost Action
              </button>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {["All", "Active", "Draft", "Archived"].map((label, i) => (
                  <button
                    className="cursor-pointer px-3 py-1 font-medium text-xs"
                    key={label}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = "scale(0.95)";
                    }}
                    onMouseEnter={(e) => {
                      if (i === 0) {
                        e.currentTarget.style.backgroundColor =
                          colors.primaryHover;
                        e.currentTarget.style.borderColor = colors.primaryHover;
                      } else {
                        e.currentTarget.style.backgroundColor =
                          colors.surfaceHover;
                        e.currentTarget.style.color = colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (i === 0) {
                        e.currentTarget.style.backgroundColor = colors.primary;
                        e.currentTarget.style.borderColor = colors.primary;
                      } else {
                        e.currentTarget.style.backgroundColor = colors.surface;
                        e.currentTarget.style.color = colors.textMuted;
                      }
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    style={{
                      backgroundColor:
                        i === 0 ? colors.primary : colors.surface,
                      border: `1px solid ${i === 0 ? colors.primary : colors.border}`,
                      borderRadius: radiuses.tag,
                      color: i === 0 ? "#ffffff" : colors.textMuted,
                      transition:
                        "background-color 0.15s ease, color 0.15s ease, border-color 0.4s ease, border-radius 0.4s ease, transform 0.15s ease",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {/* Toggles */}
              <div className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                <div className="flex flex-col gap-0.5">
                  <span
                    className="font-medium text-xs"
                    style={{ color: colors.text }}
                  >
                    Notifications
                  </span>
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    Push alerts
                  </span>
                </div>
                <button
                  className="relative h-6 w-10 cursor-pointer rounded-full p-0.5"
                  onClick={() =>
                    setState((s) => ({ ...s, toggleValue: !s.toggleValue }))
                  }
                  style={{
                    backgroundColor: state.toggleValue
                      ? colors.primary
                      : colors.border,
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <div
                    className="h-5 w-5 rounded-full bg-white shadow-sm"
                    style={{
                      transform: `translateX(${state.toggleValue ? 16 : 0}px)`,
                      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
          <div
            className="flex h-full flex-col justify-between gap-4 border p-4"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderRadius: radiuses.card,
              transition:
                "background-color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease, transform 0.2s ease",
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    transition: "background-color 0.4s ease",
                  }}
                >
                  <Layers size={20} style={{ color: colors.primary }} />
                </div>
                <span
                  className="px-2 py-0.5 font-medium text-[10px]"
                  style={{
                    backgroundColor: colors.surfaceHover,
                    borderRadius: radiuses.tag,
                    color: colors.textMuted,
                    transition:
                      "background-color 0.4s ease, color 0.4s ease, border-radius 0.4s ease",
                  }}
                >
                  Featured
                </span>
              </div>
              <div>
                <div
                  className="mb-1 font-bold text-sm"
                  style={{ color: colors.text }}
                >
                  System Component
                </div>
                <div
                  className="text-xs leading-relaxed"
                  style={{ color: colors.textMuted }}
                >
                  Flexible content containers that adapt to your brand's unique
                  style and constraints.
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-medium text-xs"
                  style={{ color: colors.text }}
                >
                  Email Address
                </label>
                <input
                  className="w-full px-3 py-2 text-sm outline-none"
                  onChange={(e) =>
                    setState((s) => ({ ...s, inputValue: e.target.value }))
                  }
                  placeholder="name@example.com"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radiuses.input,
                    color: colors.text,
                    transition:
                      "background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease",
                  }}
                  type="text"
                  value={state.inputValue}
                />
              </div>
            </div>
            <div className="flex items-center gap-[-8px]">
              <div
                className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border first:ml-0"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transition: "background-color 0.4s ease",
                }}
              >
                <User
                  className="text-white"
                  size={12}
                  style={{ color: colors.text }}
                />
              </div>
              <div
                className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border first:ml-0"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transition: "background-color 0.4s ease",
                }}
              >
                <User
                  className="text-white"
                  size={12}
                  style={{ color: colors.text }}
                />
              </div>
              <div
                className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border first:ml-0"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transition: "background-color 0.4s ease",
                }}
              >
                <User
                  className="text-white"
                  size={12}
                  style={{ color: colors.text }}
                />
              </div>
              <span
                className="ml-2 font-medium text-xs"
                style={{ color: colors.textMuted }}
              >
                +4
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShowcaseComponents;
