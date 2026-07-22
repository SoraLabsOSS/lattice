import { motion } from "framer-motion";
import { Palette, Sparkles, Type } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import type { TabId } from "./store";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { icon: <Palette size={15} />, id: "color", label: "Color" },
  { icon: <Type size={15} />, id: "typography", label: "Typography" },
  { icon: <Sparkles size={15} />, id: "style", label: "Style" },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    color: null,
    style: null,
    typography: null,
  });

  const focusTab = (nextTab: TabId) => {
    onTabChange(nextTab);
    requestAnimationFrame(() => tabRefs.current[nextTab]?.focus());
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    current: TabId
  ) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === current);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(TABS[(currentIndex + 1) % TABS.length].id);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(TABS[(currentIndex - 1 + TABS.length) % TABS.length].id);
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusTab(TABS[0].id);
    }
    if (event.key === "End") {
      event.preventDefault();
      focusTab(TABS[TABS.length - 1].id);
    }
  };

  return (
    <div
      aria-label="Theme configuration sections"
      className="mx-auto flex w-full shrink-0 border-charcoal/10 border-b px-6 md:w-auto md:px-0"
      role="tablist"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            aria-controls={`theme-tab-panel-${tab.id}`}
            aria-selected={isActive}
            className={`relative flex cursor-pointer items-center gap-1.5 px-4 py-3 font-medium text-sm transition-colors ${
              isActive
                ? "text-charcoal"
                : "text-charcoal/70 hover:text-charcoal"
            }`}
            id={`theme-tab-${tab.id}`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, tab.id)}
            ref={(node) => {
              tabRefs.current[tab.id] = node;
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {tab.icon}
            {tab.label}
            {isActive && (
              <motion.div
                className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-forest-green"
                layoutId="tab-underline"
                transition={{ damping: 30, stiffness: 300, type: "spring" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
