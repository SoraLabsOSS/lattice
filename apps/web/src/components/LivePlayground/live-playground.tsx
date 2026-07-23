import { motion } from "framer-motion";
import { Moon, Settings2, Sun } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import PlaygroundControls from "./playground-controls";
import PlaygroundDashboard from "./playground-dashboard";
import type { LivePlaygroundProps } from "./types";

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
    type="button"
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

const LivePlayground: React.FC<LivePlaygroundProps> = ({
  config,
  onChange,
  designTokens,
  compact = false,
  showExternalDarkModeToggle = true,
  collapsibleControls = false,
  defaultControlsOpen = true,
}) => {
  const [isControlsOpen, setIsControlsOpen] = useState(defaultControlsOpen);
  const toggleRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="flex flex-col items-center"
      data-step-animate-children="ignore"
    >
      {/* Dark Mode Toggle - above container */}
      {showExternalDarkModeToggle && (
        <div
          className={
            "relative z-0 mx-auto -mb-6 hidden w-full max-w-xs flex-row items-center justify-between self-center rounded-2xl bg-gray/70 px-4 pt-3 pb-8 transition-all duration-400 ease-out md:flex"
          }
          ref={toggleRef}
        >
          <p className="text-xs">Dark mode included</p>
          <DarkModeToggle
            isDark={config.isDarkMode}
            onToggle={() => onChange({ isDarkMode: !config.isDarkMode })}
          />
        </div>
      )}

      {/* Main Container */}
      <div
        className={`relative z-10 flex w-full flex-col gap-3 overflow-hidden rounded-4xl bg-gray p-3 md:gap-4 md:p-4 lg:flex-row ${
          compact ? "max-h-[650px]" : ""
        }`}
        style={{ minHeight: compact ? "420px" : "520px" }}
      >
        {/* Quick Edit Button */}
        {collapsibleControls && !isControlsOpen && (
          <motion.button
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 z-10 flex cursor-pointer items-center gap-2 rounded-full border border-charcoal/10 bg-white/90 px-4 py-2 font-bold text-charcoal text-sm shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
            initial={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsControlsOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings2 size={16} />
            <span>Quick Edit</span>
          </motion.button>
        )}
        {/* Dashboard Preview */}
        <div
          className="relative min-w-0 flex-1 overflow-hidden rounded-3xl border-2 border-white shadow-sm"
          style={designTokens as React.CSSProperties}
        >
          <PlaygroundDashboard config={config} onChange={onChange} />
        </div>

        {/* Configuration Panel */}
        {collapsibleControls ? (
          <motion.div
            animate={{
              opacity: isControlsOpen ? 1 : 0,
              pointerEvents: isControlsOpen ? "auto" : "none",
              x: isControlsOpen ? 0 : "120%",
            }}
            className="absolute top-4 right-4 bottom-4 z-20 w-[320px] overflow-hidden rounded-3xl bg-white shadow-2xl"
            initial={false}
            transition={{ damping: 25, stiffness: 200, type: "spring" }}
          >
            <PlaygroundControls
              config={config}
              onChange={onChange}
              onClose={() => setIsControlsOpen(false)}
              showDarkModeToggle={!showExternalDarkModeToggle}
            />
          </motion.div>
        ) : (
          <div className="order-first min-w-[300px] shrink-0 overflow-y-auto rounded-3xl bg-white md:order-last">
            <PlaygroundControls
              config={config}
              onChange={onChange}
              showDarkModeToggle={!showExternalDarkModeToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePlayground;
