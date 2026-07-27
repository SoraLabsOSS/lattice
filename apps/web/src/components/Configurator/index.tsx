import { useStore } from "@nanostores/react";
import { generateDesignTokens } from "@soralabsoss/generator";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Moon,
  MousePointerClick,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { decodeBrandConfig, encodeBrandConfig } from "../../lib/config-url";
import { siteImages } from "../../lib/site-images";
import {
  $brandConfig,
  FONT_WEIGHT_OPTIONS,
  type TabId,
  updateConfig,
} from "../BrandIntake/store";
import TabBar from "../BrandIntake/tab-bar";
import TabColor from "../BrandIntake/tab-color";
import TabStyle from "../BrandIntake/tab-style";
import TabTypography from "../BrandIntake/tab-typography";
import PreviewComponents from "../ComponentSampler";
import { ConfiguratorErrorBoundary } from "../error-boundary";
import PlaygroundDashboard from "../LivePlayground/playground-dashboard";
import PreviewTypography from "../LivePlayground/preview-typography";
import type { PlaygroundConfig } from "../LivePlayground/types";
import { Tooltip } from "../ui/tooltip";
import InspectOverlay from "./inspect-overlay";

// ---------------------------------------------------------------------------
// Preview tab bar (Dashboard / Components)
// ---------------------------------------------------------------------------

type PreviewTab = "dashboard" | "components" | "blog";

const PreviewTabBar: React.FC<{
  active: PreviewTab;
  onChange: (t: PreviewTab) => void;
}> = ({ active, onChange }) => (
  <div
    aria-label="Preview type"
    className="flex w-full justify-between gap-1 rounded-lg bg-charcoal/5 p-0.5 md:w-auto md:justify-start"
    role="tablist"
  >
    {(["dashboard", "components", "blog"] as const).map((tab) => (
      <button
        aria-selected={active === tab}
        className={`w-full cursor-pointer rounded-md px-3 py-1.5 font-medium text-xs capitalize transition-all md:w-auto ${
          active === tab
            ? "bg-white text-charcoal shadow-sm"
            : "text-charcoal/80 hover:text-charcoal"
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
    style={{ backgroundColor: isDark ? "#374151" : "#d7d9dc" }}
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
// Mobile segmented controller
// ---------------------------------------------------------------------------

type MobileSegment = "configure" | "preview";

const MobileSegmentedController: React.FC<{
  active: MobileSegment;
  onChange: (v: MobileSegment) => void;
}> = ({ active, onChange }) => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-charcoal/5 border-t bg-white/95 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
    <div
      aria-label="Mobile workspace view"
      className="mx-auto flex max-w-md gap-1 rounded-lg bg-charcoal/5 p-0.5"
      role="tablist"
    >
      {(["configure", "preview"] as const).map((segment) => (
        <button
          aria-selected={active === segment}
          className={`flex-1 cursor-pointer rounded-md px-3 py-2 font-medium text-sm capitalize transition-all ${
            active === segment
              ? "bg-white text-charcoal shadow-sm"
              : "text-charcoal/50 hover:text-charcoal/80"
          }`}
          key={segment}
          onClick={() => onChange(segment)}
          role="tab"
          type="button"
        >
          {segment}
        </button>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Configurator component
// ---------------------------------------------------------------------------

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 768px)").matches
  );
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
};

// Hydrate the shared BrandConfig store from a `?c=` URL param if present, then
// strip the param so the configurator URL stays clean. This is the back-edge
// of the export-page round-trip — the configurator itself never encodes its
// state into the URL during normal use. Must run in a post-hydration effect
// (not during render): the SSR pass has no URL access and emits defaults, so
// touching the store before hydration completes would cause attribute
// mismatches that React 19 refuses to patch up.
const hydrateFromUrlIfPresent = () => {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("c");
  if (!raw) {
    return;
  }
  const decoded = decodeBrandConfig(raw);
  if (decoded) {
    $brandConfig.set(decoded);
  }
  params.delete("c");
  const search = params.toString();
  const url =
    window.location.pathname +
    (search ? `?${search}` : "") +
    window.location.hash;
  window.history.replaceState(null, "", url);
};

const Configurator: React.FC = () => {
  const config = useStore($brandConfig);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    hydrateFromUrlIfPresent();
  }, []);

  // Local UI state
  const [activeTab, setActiveTab] = useState<TabId>("color");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("dashboard");
  const [mobileSegment, setMobileSegment] =
    useState<MobileSegment>("configure");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);

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

  // Load Google Fonts for both body and heading typefaces
  useEffect(() => {
    const weightsQuery = `wght@${FONT_WEIGHT_OPTIONS.join(";")}`;
    for (const [family, role] of [
      [config.headingFont, "heading"],
      [config.primaryFont, "body"],
    ] as const) {
      const id = `playground-font-${role}-${family.replace(/\s+/g, "+")}`;
      if (document.getElementById(id)) {
        continue;
      }
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:${weightsQuery}&display=swap`;
      document.head.appendChild(link);
    }
  }, [config.primaryFont, config.headingFont]);

  // Generate design tokens as CSS custom properties
  const {
    tokens: designTokens,
    semanticMap,
    swatches,
  } = useMemo(
    () => generateDesignTokens(config, isDarkMode),
    [config, isDarkMode]
  );

  // The export page receives the entire BrandConfig via a URL-encoded param;
  // it regenerates tokens on its own, so we don't pre-compute the paired
  // light+dark TokenSet here anymore.
  // `encodeURIComponent` wraps the LZ payload because its alphabet includes
  // `+`, which URLSearchParams would otherwise decode as a space on the way back.
  const exportHref = useMemo(
    () => `/generate/export?c=${encodeURIComponent(encodeBrandConfig(config))}`,
    [config]
  );

  // Bridge: BrandConfig → PlaygroundConfig (kept for font-loading side effect)
  const playgroundConfig: PlaygroundConfig = {
    density: config.density,
    expressiveness: config.expressiveness,
    fontFamily: config.primaryFont,
    isDarkMode,
    lightness: 100,
    primaryColor: config.primaryColor,
    roundness: config.roundness,
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

  return (
    <div
      className="flex min-h-dvh flex-col md:h-full md:min-h-0"
      data-lenis-prevent="true"
    >
      {/* Two-panel layout */}
      <div className="flex flex-1 flex-col bg-gray pb-[calc(4rem+env(safe-area-inset-bottom))] md:min-h-0 md:flex-row md:pb-0">
        {/* Left Panel — Configuration */}
        <motion.aside
          animate={isDesktop ? { width: isCollapsed ? 72 : 360 } : undefined}
          className={`flex min-h-0 shrink-0 flex-col md:p-4 md:pr-0 ${
            mobileSegment === "preview" ? "hidden md:flex" : "flex"
          } ${isCollapsed && isDesktop ? "" : "w-full md:w-[360px]"}`}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:rounded-3xl">
            <AnimatePresence initial={false} mode="popLayout">
              {isCollapsed ? (
                /* ── Collapsed sidebar ── */
                <motion.div
                  animate={{
                    opacity: 1,
                    transition: { delay: 0.25, duration: 0.2 },
                  }}
                  className="flex flex-col items-center gap-4 px-2 pt-6 pb-4"
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  initial={{ opacity: 0 }}
                  key="collapsed"
                >
                  <Tooltip label="Back to home page" side="right">
                    <a className="transition-opacity hover:opacity-70" href="/">
                      <img
                        alt="Sora Lattice"
                        className="h-5 w-5"
                        src={siteImages.logoIcon}
                      />
                    </a>
                  </Tooltip>

                  <Tooltip label="Expand" side="right">
                    <button
                      aria-label="Expand sidebar"
                      className="cursor-pointer text-charcoal/40 transition-colors hover:text-charcoal/70"
                      onClick={() => setIsCollapsed(false)}
                      type="button"
                    >
                      <PanelLeftOpen size={18} />
                    </button>
                  </Tooltip>

                  <div className="h-px w-6 bg-charcoal/10" />

                  {/* Color swatches */}
                  {(
                    [
                      ["Primary", swatches.primary],
                      ["Secondary", swatches.secondary],
                      ["Neutral", swatches.neutral],
                    ] as const
                  ).map(([name, value]) => (
                    <Tooltip
                      key={name}
                      label={`${name}: ${value}`}
                      side="right"
                    >
                      <button
                        aria-label={`${name}: ${value}`}
                        className="h-6 w-6 cursor-default rounded-md border border-charcoal/10 shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: value }}
                        type="button"
                      />
                    </Tooltip>
                  ))}
                </motion.div>
              ) : (
                /* ── Expanded sidebar ── */
                <motion.div
                  animate={{
                    opacity: 1,
                    transition: { delay: 0.25, duration: 0.2 },
                  }}
                  className="flex min-h-0 flex-1 flex-col"
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  initial={{ opacity: 0 }}
                  key="expanded"
                >
                  {/* Header: logo + collapse */}
                  <div className="flex shrink-0 items-center justify-between p-6">
                    <Tooltip label="Back to home page" side="bottom">
                      <a
                        className="transition-opacity hover:opacity-70"
                        href="/"
                      >
                        <img
                          alt="Sora Lattice"
                          className="h-7 w-7"
                          src={siteImages.logoIcon}
                        />
                      </a>
                    </Tooltip>
                    <button
                      aria-label="Collapse sidebar"
                      className="hidden cursor-pointer text-charcoal/40 transition-colors hover:text-charcoal/70 md:block"
                      onClick={() => setIsCollapsed(true)}
                      type="button"
                    >
                      <PanelLeftClose size={18} />
                    </button>
                  </div>

                  <LayoutGroup>
                    <TabBar
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                    />
                  </LayoutGroup>

                  <div
                    className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
                    ref={scrollContainerRef}
                  >
                    <AnimatePresence initial={false} mode="wait">
                      <motion.div
                        animate={{ opacity: 1 }}
                        aria-labelledby={`theme-tab-${activeTab}`}
                        exit={{ opacity: 0 }}
                        id={`theme-tab-panel-${activeTab}`}
                        initial={{ opacity: 0 }}
                        key={activeTab}
                        role="tabpanel"
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      >
                        {activeTab === "color" && (
                          <TabColor isDarkMode={isDarkMode} />
                        )}
                        {activeTab === "typography" && <TabTypography />}
                        {activeTab === "style" && <TabStyle />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* Right Panel — Live Preview */}
        <main
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            mobileSegment === "configure" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <PreviewTabBar active={previewTab} onChange={setPreviewTab} />
            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-start">
              <DarkModeToggle
                isDark={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
              <div className="flex items-center gap-2">
                <button
                  aria-pressed={isInspecting}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-3 font-medium text-xs transition-all duration-250 hover:scale-105 active:scale-95 ${
                    isInspecting
                      ? "border-forest-green/50 bg-forest-green/10 text-forest-green"
                      : "border-transparent text-charcoal/80 hover:bg-forest-green/10 hover:text-charcoal"
                  }`}
                  onClick={() => setIsInspecting(!isInspecting)}
                  type="button"
                >
                  <MousePointerClick size={13} />
                  Inspect{isInspecting && ": On"}
                </button>
                <a
                  className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-none"
                  href={exportHref}
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="13"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="13"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  Export
                </a>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-8">
            <div
              className="relative mx-auto h-full max-h-[1200px] min-h-[500px] max-w-[1600px] overflow-hidden rounded-3xl border-2 border-white shadow-sm"
              ref={previewContainerRef}
              style={designTokens as React.CSSProperties}
            >
              {previewTab === "dashboard" && (
                <PlaygroundDashboard
                  config={playgroundConfig}
                  onChange={handlePlaygroundChange}
                />
              )}
              {previewTab === "components" && <PreviewComponents />}
              {previewTab === "blog" && (
                <PreviewTypography
                  bodyFont={config.primaryFont}
                  fontScale={config.fontScale}
                  headingFont={config.headingFont}
                />
              )}
              <InspectOverlay
                containerRef={previewContainerRef}
                isActive={
                  isInspecting &&
                  (previewTab === "dashboard" ||
                    previewTab === "components" ||
                    previewTab === "blog")
                }
                isDarkMode={isDarkMode}
                semanticMap={semanticMap}
              />
            </div>
          </div>
        </main>
      </div>
      {/* Mobile segmented controller */}
      <MobileSegmentedController
        active={mobileSegment}
        onChange={setMobileSegment}
      />
    </div>
  );
};

const ConfiguratorWithBoundary: React.FC = () => (
  <ConfiguratorErrorBoundary>
    <Configurator />
  </ConfiguratorErrorBoundary>
);

export default ConfiguratorWithBoundary;
