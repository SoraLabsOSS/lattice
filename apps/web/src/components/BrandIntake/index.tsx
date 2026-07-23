import { useStore } from "@nanostores/react";
import { generateDesignTokens } from "@soralabsoss/generator";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Download, Moon, Sun } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { siteImages } from "../../lib/site-images";
import PlaygroundDashboard from "../LivePlayground/playground-dashboard";
import type { PlaygroundConfig } from "../LivePlayground/types";
import BrandHeader from "./brand-header";
import { $brandConfig, resetConfig, type TabId, updateConfig } from "./store";
import TabBar from "./tab-bar";
import TabColor from "./tab-color";
import TabStyle from "./tab-style";
import TabTypography from "./tab-typography";

// ---------------------------------------------------------------------------
// Preview tab bar (Dashboard / Components)
// ---------------------------------------------------------------------------

type PreviewTab = "dashboard" | "components";

const PreviewTabBar: React.FC<{
  active: PreviewTab;
  onChange: (t: PreviewTab) => void;
}> = ({ active, onChange }) => (
  <div
    aria-label="Preview type"
    className="flex gap-1 rounded-lg bg-charcoal/5 p-0.5"
    role="tablist"
  >
    {(["dashboard", "components"] as const).map((tab) => (
      <button
        aria-selected={active === tab}
        className={`cursor-pointer rounded-md px-3 py-1.5 font-medium text-xs capitalize transition-all ${
          active === tab
            ? "bg-white text-charcoal shadow-sm"
            : "text-charcoal/50 hover:text-charcoal/80"
        }`}
        key={tab}
        onClick={() => onChange(tab)}
        role="tab"
        type="button"
      >
        {tab}
      </button>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Dark mode toggle
// ---------------------------------------------------------------------------

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({
  isDark,
  onToggle,
}) => (
  <button
    aria-checked={isDark}
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    className="relative h-7 w-12 cursor-pointer rounded-full p-0.5 transition-all duration-200 hover:scale-105 active:scale-95"
    onClick={onToggle}
    role="switch"
    style={{ backgroundColor: isDark ? "#374151" : "#e5e7eb" }}
    type="button"
  >
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
      style={{
        transform: `translateX(${isDark ? 20 : 0}px)`,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {isDark ? (
        <Moon className="text-gray-600" size={11} />
      ) : (
        <Sun className="text-amber-500" size={11} />
      )}
    </div>
  </button>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const isDev = import.meta.env.DEV;

const BrandIntake: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const config = useStore($brandConfig);

  // Local UI state
  const [activeTab, setActiveTab] = useState<TabId>("color");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("dashboard");

  // Scroll preservation per tab
  const scrollRefs = useRef<Record<TabId, number>>({
    color: 0,
    style: 0,
    typography: 0,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      // Save current scroll position
      if (scrollContainerRef.current) {
        scrollRefs.current[activeTab] = scrollContainerRef.current.scrollTop;
      }
      setActiveTab(tab);
      // Restore scroll position for new tab
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollRefs.current[tab] || 0;
        }
      });
    },
    [activeTab]
  );

  // Generate design tokens as CSS custom properties
  const { tokens: designTokens } = useMemo(
    () => generateDesignTokens(config, isDarkMode),
    [config, isDarkMode]
  );

  // Bridge: BrandConfig → PlaygroundConfig
  const playgroundConfig: PlaygroundConfig = {
    density: config.density,
    expressiveness: config.expressiveness,
    fontFamily: config.primaryFont,
    isDarkMode,
    lightness: 100,
    primaryColor: config.primaryColor,
    roundness: config.roundness === "subtle" ? "rounded" : config.roundness,
    saturation: 100,
    secondaryColor: config.secondaryColor || "#8B5CF6",
    shadows: config.shadows,
  };

  const handlePlaygroundChange = useCallback(
    (updates: Partial<PlaygroundConfig>) => {
      const brandUpdates: Record<string, unknown> = {};
      if (updates.primaryColor !== undefined) {
        brandUpdates.primaryColor = updates.primaryColor;
      }
      if (updates.secondaryColor !== undefined) {
        brandUpdates.secondaryColor = updates.secondaryColor;
        brandUpdates.useCustomSecondary = true;
      }
      // playground saturation is a different concept (scales base chroma); don't map to chromaFalloff

      if (updates.fontFamily !== undefined) {
        brandUpdates.primaryFont = updates.fontFamily;
      }
      if (updates.roundness !== undefined) {
        brandUpdates.roundness = updates.roundness;
      }
      if (updates.density !== undefined) {
        brandUpdates.density = updates.density;
      }
      if (updates.expressiveness !== undefined) {
        brandUpdates.expressiveness = updates.expressiveness;
      }
      if (updates.shadows !== undefined) {
        brandUpdates.shadows = updates.shadows;
      }
      if (updates.isDarkMode !== undefined) {
        setIsDarkMode(updates.isDarkMode);
      }

      if (Object.keys(brandUpdates).length > 0) {
        updateConfig(brandUpdates);
      }
    },
    []
  );

  // Open/close handlers
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      document.body.classList.add("modal-open");
      (window as any).lenis?.stop();
    };
    window.addEventListener("openBrandIntake", handleOpen);
    return () => window.removeEventListener("openBrandIntake", handleOpen);
  }, []);

  useEffect(
    () => () => {
      if (isOpen) {
        (window as any).lenis?.start();
      }
    },
    [isOpen]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    document.body.classList.remove("modal-open");
    (window as any).lenis?.start();
  }, []);

  // ESC to close
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ y: 0 }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
          data-lenis-prevent="true"
          exit={{ y: "100%" }}
          initial={{ y: "100%" }}
          transition={{ duration: 1, ease: [0.32, 0.72, 0, 1], type: "tween" }}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-charcoal/5 border-b px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <img
                alt="Sora Lattice"
                className="h-7 w-7"
                src={siteImages.logoIcon}
              />
              {isDev && (
                <button
                  className="cursor-pointer font-mono text-[10px] text-red-500/60 transition-colors hover:text-red-500"
                  onClick={() => {
                    if (confirm("Reset all config?")) {
                      resetConfig();
                    }
                  }}
                  type="button"
                >
                  [DEV] Reset
                </button>
              )}
            </div>
            <button
              aria-label="Close"
              className="flex cursor-pointer items-center justify-center rounded-lg bg-gray p-2 transition-colors hover:bg-gray-200"
              onClick={handleClose}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            </button>
          </header>

          {/* Two-panel layout */}
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* Left Panel — Configuration */}
            <aside className="flex max-h-[50vh] min-h-0 w-full shrink-0 flex-col border-charcoal/5 border-r md:max-h-full md:w-[400px]">
              <BrandHeader />
              <LayoutGroup>
                <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
              </LayoutGroup>

              <div
                aria-labelledby={`theme-tab-${activeTab}`}
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
                id={`theme-tab-panel-${activeTab}`}
                ref={scrollContainerRef}
                role="tabpanel"
              >
                {activeTab === "color" && <TabColor isDarkMode={isDarkMode} />}
                {activeTab === "typography" && <TabTypography />}
                {activeTab === "style" && <TabStyle />}
              </div>

              {/* Sticky download button */}
              <div className="shrink-0 border-charcoal/5 border-t bg-white px-4 py-3">
                <button
                  className="btn btn-primary flex w-full items-center justify-center gap-2"
                  onClick={() => {
                    // No-op for now — export pipeline not yet built
                  }}
                  type="button"
                >
                  <Download size={16} />
                  Download tokens
                </button>
              </div>
            </aside>

            {/* Right Panel — Live Preview */}
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray">
              <div className="flex shrink-0 items-center justify-between px-4 py-3 md:px-6">
                <PreviewTabBar active={previewTab} onChange={setPreviewTab} />
                <DarkModeToggle
                  isDark={isDarkMode}
                  onToggle={() => setIsDarkMode(!isDarkMode)}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 md:px-5">
                <div
                  className="h-full min-h-[500px] overflow-hidden rounded-2xl shadow-sm"
                  style={designTokens as React.CSSProperties}
                >
                  {previewTab === "dashboard" ? (
                    <PlaygroundDashboard
                      config={playgroundConfig}
                      onChange={handlePlaygroundChange}
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{
                        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                        color: isDarkMode ? "#94a3b8" : "#64748b",
                        fontFamily: `'${config.primaryFont}', system-ui, sans-serif`,
                      }}
                    >
                      <p className="text-sm">Component sampler coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandIntake;
