import type { EChartsOption } from "echarts";
import ReactEChartsImport from "echarts-for-react/lib/index.js";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileBarChart,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  Plus,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaygroundConfig } from "./types";

// ---------------------------------------------------------------------------
// Scoped interaction styles — CSS variables make these reactive to token
// changes. Hover/active are a translucent scrim rather than a color swap: the
// `pg-interactive` rule floods the border-box with an inset box-shadow that
// sits above the element's background but below its label, so a single pair of
// rules drives every button regardless of its own fill. Table rows can't carry
// an inset box-shadow reliably, so they take the scrim as a background instead
// (their base background is transparent, so the translucent token reads the
// same way).
// ---------------------------------------------------------------------------

const PLAYGROUND_STYLES = `
  .pg-interactive:hover { box-shadow: inset 0 0 0 999px var(--color-interactive-background-hover); }
  .pg-interactive:active { box-shadow: inset 0 0 0 999px var(--color-interactive-background-active); }
  .pg-row:hover { background-color: var(--color-interactive-background-hover); }
  .pg-row:active { background-color: var(--color-interactive-background-active); }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const V = (token: string) => `var(--${token})`;
const t = (token: string) => V(token);
const ReactECharts =
  (ReactEChartsImport as unknown as { default?: React.ComponentType<any> })
    .default ?? (ReactEChartsImport as unknown as React.ComponentType<any>);

/**
 * Resolve a CSS custom property to a concrete color string against an element
 * inside the token cascade. Walks one or two levels of `var()` indirection in
 * case the browser does not substitute nested vars within custom-property
 * computed values.
 */
const readCssVar = (el: Element, name: string, fallback: string): string => {
  const styles = getComputedStyle(el);
  let value = styles.getPropertyValue(name).trim();
  for (let depth = 0; depth < 4 && value.startsWith("var("); depth++) {
    const m = value.match(/^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/);
    if (!m) {
      break;
    }
    value = styles.getPropertyValue(m[1]).trim();
  }
  return value || fallback;
};

// Shorthand accessors for commonly used token groups
const bg = {
  accent: t("color-background-accent"),
  accentSubtle: t("color-background-accentSubtle"),
  base: t("color-background-base"),
  critical: t("color-background-critical"),
  criticalSubtle: t("color-background-criticalSubtle"),
  gradientSoft: t("color-background-gradientSoft"),
  info: t("color-background-info"),
  infoSubtle: t("color-background-infoSubtle"),
  primary: t("color-background-primary"),
  primaryHover: t("color-background-primaryHover"),
  primarySubtle: t("color-background-primarySubtle"),
  raised: t("color-background-raised"),
  raisedHover: t("color-background-raisedHover"),
  success: t("color-background-success"),
  successSubtle: t("color-background-successSubtle"),
  sunken: t("color-background-sunken"),
  sunkenStrong: t("color-background-sunkenStrong"),
  warning: t("color-background-warning"),
  warningSubtle: t("color-background-warningSubtle"),
};
const fg = {
  accent: t("color-foreground-accent"),
  critical: t("color-foreground-critical"),
  info: t("color-foreground-info"),
  onBase: t("color-foreground-onBase"),
  onBaseFaint: t("color-foreground-onBaseFaint"),
  onBaseMuted: t("color-foreground-onBaseMuted"),
  onCriticalSubtle: t("color-foreground-onCriticalSubtle"),
  onGradient: t("color-foreground-onGradient"),
  onGradientMuted: t("color-foreground-onGradientMuted"),
  onInfoSubtle: t("color-foreground-onInfoSubtle"),
  onPrimary: t("color-foreground-onPrimary"),
  onSuccessSubtle: t("color-foreground-onSuccessSubtle"),
  onSunken: t("color-foreground-onSunken"),
  onSunkenMuted: t("color-foreground-onSunkenMuted"),
  onWarningSubtle: t("color-foreground-onWarningSubtle"),
  primary: t("color-foreground-primary"),
  success: t("color-foreground-success"),
  warning: t("color-foreground-warning"),
};
const border = {
  neutral: t("color-border-neutral"),
  primary: t("color-border-primary"),
  strong: t("color-border-strong"),
};
const radius = {
  action: t("shape-radius-action"),
  badge: t("shape-radius-badge"),
  container: t("shape-radius-container"),
  field: t("shape-radius-field"),
  sub: t("shape-radius-subcontainer"),
};
const space = {
  "2xl": t("space-2xl"),
  "3xl": t("space-3xl"),
  "4xl": t("space-4xl"),
  "5xl": t("space-5xl"),
  "6xl": t("space-6xl"),
  lg: t("space-lg"),
  md: t("space-md"),
  sm: t("space-sm"),
  xl: t("space-xl"),
  xs: t("space-xs"),
};
const shadow = {
  overlay: t("shadow-overlay"),
  raised: t("shadow-raised"),
};
const transition = {
  chart: t("transition-chart"),
  interactive: t("transition-interactive"),
  theme: t("transition-theme"),
};
const font = {
  primary: t("font-body-family"),
  secondary: t("font-heading-family"),
};
const weight = {
  bodyRegular: t("font-body-weight-regular"),
  heading: t("font-heading-weight"),
};

const gradient = t("gradient-primary");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PlaygroundDashboardProps {
  config: PlaygroundConfig;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
}

interface ChartPalette {
  grid: string;
  primary: string;
  primarySubtle: string;
  raised: string;
  textFaint: string;
  textMuted: string;
}

const CHART_PALETTE_FALLBACK: ChartPalette = {
  grid: "#e5e7eb",
  primary: "#2f6d5c",
  primarySubtle: "#d4e6de",
  raised: "#ffffff",
  textFaint: "#9ca3af",
  textMuted: "#6b7280",
};

const REVENUE_CHART_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REVENUE_CHART_REVENUE_SERIES = [1820, 2240, 2090, 2985, 2650, 3120, 3390];
const REVENUE_CHART_ORDER_SERIES = [38, 48, 44, 67, 59, 72, 78];

const PlaygroundDashboard: React.FC<PlaygroundDashboardProps> = ({
  config,
  onChange,
}) => {
  const [activeNav, setActiveNav] = useState("dashboard");
  void onChange;

  // Refs/state to resolve cascading CSS vars from inside the dashboard subtree
  // (the design tokens are inline-styled on a parent in Configurator, not on
  // documentElement, so a global lookup misses).
  const rootRef = useRef<HTMLDivElement>(null);
  const [chartPalette, setChartPalette] = useState<ChartPalette>(
    CHART_PALETTE_FALLBACK
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: config isn't read directly, but its identity change is the signal that the parent finished applying new design tokens as CSS vars, which is what we re-read here.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const next: ChartPalette = {
      grid: readCssVar(el, "--color-chart-grid", CHART_PALETTE_FALLBACK.grid),
      primary: readCssVar(
        el,
        "--color-background-primary",
        CHART_PALETTE_FALLBACK.primary
      ),
      primarySubtle: readCssVar(
        el,
        "--color-background-primarySubtle",
        CHART_PALETTE_FALLBACK.primarySubtle
      ),
      raised: readCssVar(
        el,
        "--color-background-raised",
        CHART_PALETTE_FALLBACK.raised
      ),
      textFaint: readCssVar(
        el,
        "--color-foreground-onBaseFaint",
        CHART_PALETTE_FALLBACK.textFaint
      ),
      textMuted: readCssVar(
        el,
        "--color-foreground-onBaseMuted",
        CHART_PALETTE_FALLBACK.textMuted
      ),
    };
    // Bail out via same-reference return to avoid an update loop, since the
    // parent passes a fresh `config` object each render.
    setChartPalette((prev) =>
      (Object.keys(next) as (keyof ChartPalette)[]).every(
        (k) => prev[k] === next[k]
      )
        ? prev
        : next
    );
  }, [config]);

  // --- Static data ---

  const navSections: {
    title: string;
    items: { id: string; label: string; icon: typeof LayoutDashboard }[];
  }[] = [
    {
      items: [
        { icon: LayoutDashboard, id: "dashboard", label: "Dashboard" },
        { icon: Mail, id: "inbox", label: "Inbox" },
        { icon: Calendar, id: "calendar", label: "Calendar" },
        { icon: FolderKanban, id: "projects", label: "Projects" },
      ],
      title: "Overview",
    },
    {
      items: [
        { icon: Package, id: "orders", label: "Orders" },
        { icon: CreditCard, id: "billing", label: "Billing" },
      ],
      title: "Commerce",
    },
    {
      items: [
        { icon: BarChart3, id: "analytics", label: "Analytics" },
        { icon: FileBarChart, id: "reports", label: "Reports" },
        { icon: Megaphone, id: "campaigns", label: "Campaigns" },
      ],
      title: "Insights",
    },
  ];

  const metrics = [
    {
      change: "+14.5%",
      icon: DollarSign,
      label: "Monthly Revenue",
      up: true,
      value: "$124,563",
    },
    {
      change: "+4.2%",
      icon: Users,
      label: "Active Users",
      up: true,
      value: "8,234",
    },
    {
      change: "-1.4%",
      icon: ShoppingCart,
      label: "New Orders",
      up: false,
      value: "1,482",
    },
    {
      change: "+2.1%",
      icon: Activity,
      label: "Live Sessions",
      up: true,
      value: "1,492",
    },
  ];

  const tableRows = [
    {
      amount: "$3,200.00",
      customer: "Acme Corporation",
      date: "Oct 24, 2023",
      email: "contact@acme.co",
      status: "Paid" as const,
    },
    {
      amount: "$850.00",
      customer: "Global Media Ltd",
      date: "Oct 23, 2023",
      email: "billing@global.net",
      status: "Pending" as const,
    },
    {
      amount: "$12,450.00",
      customer: "Stark Industries",
      date: "Oct 21, 2023",
      email: "tony@stark.com",
      status: "Failed" as const,
    },
    {
      amount: "$150.00",
      customer: "Vanguard Inc",
      date: "Oct 20, 2023",
      email: "hello@vanguard.io",
      status: "Draft" as const,
    },
  ];

  const statusStyles: Record<string, { fg: string; bg: string }> = {
    Draft: { bg: bg.sunken, fg: fg.onSunken },
    Failed: { bg: bg.criticalSubtle, fg: fg.onCriticalSubtle },
    Paid: { bg: bg.successSubtle, fg: fg.onSuccessSubtle },
    Pending: { bg: bg.warningSubtle, fg: fg.onWarningSubtle },
  };

  const revenueDays = REVENUE_CHART_DAYS;
  const revenueSeries = REVENUE_CHART_REVENUE_SERIES;
  const orderSeries = REVENUE_CHART_ORDER_SERIES;

  const revenueChartOption = useMemo<EChartsOption>(() => {
    const { primary, primarySubtle, raised, grid, textMuted, textFaint } =
      chartPalette;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return {
      animation: !reduceMotion,
      animationDuration: reduceMotion ? 0 : 700,
      animationDurationUpdate: reduceMotion ? 0 : 420,
      animationEasing: "cubicOut",
      animationEasingUpdate: "cubicOut",
      grid: {
        bottom: 22,
        containLabel: true,
        left: 10,
        right: 10,
        top: 16,
      },
      series: [
        {
          barMaxWidth: 16,
          data: orderSeries,
          emphasis: {
            itemStyle: {
              color: primary,
            },
          },
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: primarySubtle,
          },
          name: "Orders",
          type: "bar",
          yAxisIndex: 1,
        },
        {
          data: revenueSeries,
          lineStyle: {
            color: primary,
            width: 2.8,
          },
          name: "Revenue",
          showSymbol: false,
          smooth: 0.42,
          type: "line",
          z: 3,
        },
      ],
      tooltip: {
        axisPointer: {
          lineStyle: {
            color: primary,
            type: "dashed",
            width: 1,
          },
          type: "line",
        },
        backgroundColor: raised,
        borderColor: grid,
        borderWidth: 1,
        extraCssText: `border-radius:${radius.sub}; box-shadow:${shadow.overlay};`,
        textStyle: {
          color: textMuted,
          fontFamily: font.primary,
          fontSize: 11,
        },
        trigger: "axis",
      },
      xAxis: {
        axisLabel: {
          color: textFaint,
          fontSize: 10,
          margin: 10,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        boundaryGap: true,
        data: revenueDays,
        type: "category",
      },
      yAxis: [
        {
          axisLabel: {
            color: textFaint,
            fontSize: 10,
            formatter: "${value}",
          },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: {
            lineStyle: { color: grid },
          },
          splitNumber: 4,
          type: "value",
        },
        {
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          type: "value",
        },
      ],
    };
  }, [chartPalette]);

  const trafficSources = [
    { color: bg.primary, label: "Direct", share: 45 },
    { color: bg.success, label: "Organic Search", share: 32 },
    { color: bg.warning, label: "Referral", share: 18 },
    { color: bg.info, label: "Social", share: 5 },
  ];

  const avatarColors = [
    bg.primarySubtle,
    bg.accentSubtle,
    bg.successSubtle,
    bg.warningSubtle,
  ];
  const initials = ["A", "GM", "S", "V"];
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        weekday: "long",
      }).format(new Date()),
    []
  );

  return (
    <>
      <style>{PLAYGROUND_STYLES}</style>
      <div
        className="flex h-full select-none overflow-hidden"
        ref={rootRef}
        style={{
          backgroundColor: bg.sunken,
          borderRadius: radius.container,
          fontFamily: font.primary,
          transition: transition.theme,
        }}
      >
        {/* Sidebar */}
        <div
          className="hidden h-full min-h-0 shrink-0 flex-col md:flex"
          style={{
            paddingBottom: space.lg,
            paddingTop: space.lg,
            transition: transition.theme,
            width: "196px",
          }}
        >
          <div className="mb-6 flex shrink-0 items-center gap-2 px-4">
            <div
              className="flex h-6 w-6 items-center justify-center font-bold text-[10px] text-white"
              style={{
                background: bg.accent,
                borderRadius: radius.badge,
                transition: transition.theme,
              }}
            >
              A
            </div>
            <span
              className="font-semibold text-sm"
              style={{ color: fg.onBase }}
            >
              Acme
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <nav className="flex flex-col gap-4 px-2 pb-2">
              {navSections.map((section) => (
                <div key={section.title}>
                  <div
                    className="mb-2 px-2 font-semibold text-[11px]"
                    style={{ color: fg.onBaseFaint }}
                  >
                    {section.title}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.id;
                      return (
                        <button
                          className="pg-interactive flex cursor-pointer items-center gap-2.5 px-3 py-2 font-medium text-xs"
                          key={item.id}
                          onClick={() => setActiveNav(item.id)}
                          style={{
                            backgroundColor: isActive
                              ? bg.sunkenStrong
                              : "transparent",
                            borderRadius: radius.badge,
                            color: isActive ? fg.onBase : fg.onBaseMuted,
                            fontFamily: "inherit",
                            transition: transition.interactive,
                          }}
                          type="button"
                        >
                          <Icon size={14} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div
            className="mt-auto shrink-0 px-3 pt-4"
            style={{ transition: transition.theme }}
          >
            <div
              style={{
                backgroundColor: bg.raised,
                borderRadius: radius.container,
                padding: space.lg,
                transition: transition.theme,
              }}
            >
              <div
                className="font-semibold text-[10px]"
                style={{ color: fg.onBase }}
              >
                Pro Workspace
              </div>
              <div
                className="mt-1 text-[10px]"
                style={{ color: fg.onBaseMuted }}
              >
                80% quota used
              </div>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden"
                style={{
                  backgroundColor: bg.raisedHover,
                  borderRadius: radius.action,
                  transition: transition.theme,
                }}
              >
                <div
                  className="h-full"
                  style={{
                    backgroundColor: bg.primary,
                    borderRadius: radius.action,
                    transition: transition.theme,
                    width: "80%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content — inset panel */}
        <div
          className="my-2 mr-2 ml-2 flex min-w-0 flex-1 flex-col overflow-hidden md:ml-0"
          style={{
            backgroundColor: bg.base,
            borderRadius: radius.container,
            boxShadow: shadow.raised,
            transition: transition.theme,
          }}
        >
          {/* Top Bar */}
          <div
            className="flex shrink-0 flex-wrap items-center"
            style={{
              borderBottom: `1px solid ${border.neutral}`,
              gap: space.md,
              padding: `${space.md} ${space.lg}`,
              transition: transition.theme,
            }}
          >
            <div className="min-w-[120px] flex-1">
              <div
                className="flex items-center gap-2"
                style={{
                  borderRadius: radius.field,
                  padding: `${space.sm}`,
                  transition: transition.theme,
                }}
              >
                <Search size={14} style={{ color: fg.onBaseMuted }} />
                <input
                  aria-label="Search dashboard data"
                  className="bordder-none w-full bg-transparent text-xs outline-none"
                  placeholder="Search components, users, or settings..."
                  style={{ color: fg.onBase, fontFamily: "inherit" }}
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Ghost icon button */}
              <button
                aria-label="Notifications"
                className="pg-interactive flex h-8 w-8 cursor-pointer items-center justify-center"
                style={{
                  backgroundColor: "transparent",
                  border: `1px solid ${border.neutral}`,
                  borderRadius: radius.action,
                  color: fg.onBaseMuted,
                  transition: transition.interactive,
                }}
                type="button"
              >
                <Bell size={13} />
              </button>
              {/* Primary button */}
              <button
                className="pg-interactive flex h-8 cursor-pointer items-center gap-1.5 px-3 font-semibold text-[11px]"
                style={{
                  backgroundColor: bg.primary,
                  borderRadius: radius.action,
                  color: fg.onPrimary,
                  transition: transition.interactive,
                }}
                type="button"
              >
                <Plus size={12} />
                New Project
              </button>
            </div>
          </div>

          {/* Content area */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{
              paddingBottom: space.xl,
              paddingLeft: space["2xl"],
              paddingRight: space["2xl"],
              paddingTop: space.xl,
              transition: transition.theme,
            }}
          >
            <div
              className="mb-4"
              style={{ marginBottom: space.xl, transition: transition.theme }}
            >
              <span
                className="block text-[11px]"
                style={{
                  color: fg.onBaseMuted,
                  fontFamily: font.primary,
                  fontWeight: weight.bodyRegular as unknown as number,
                  letterSpacing: "0.01em",
                  marginBottom: space.xs,
                  transition: transition.theme,
                }}
              >
                {todayLabel}
              </span>
              <h2
                className="leading-tight"
                style={{
                  color: fg.onBase,
                  fontFamily: font.secondary,
                  fontSize: "1.5rem",
                  fontWeight: weight.heading as unknown as number,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  margin: 0,
                  transition: transition.theme,
                }}
              >
                Good morning, Dave
              </h2>
            </div>

            {/* Metric Cards */}
            <div
              className="mb-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
              style={{ gap: space.md, transition: transition.theme }}
            >
              {metrics.map((m) => (
                <div
                  className="flex flex-col"
                  key={m.label}
                  style={{
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.raised,
                    padding: space.lg,
                    transition: transition.theme,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="mb-1 font-medium text-[9px] uppercase tracking-wider"
                      style={{ color: fg.onBaseMuted }}
                    >
                      {m.label}
                    </span>
                    <div
                      className="flex h-6 w-6 items-center justify-center"
                      style={{
                        backgroundColor: bg.sunken,
                        borderRadius: radius.badge,
                        color: fg.onSunken,
                        transition: transition.theme,
                      }}
                    >
                      <m.icon size={12} />
                    </div>
                  </div>
                  <span
                    className="text-2xl leading-tight"
                    style={{
                      color: fg.onBase,
                      fontFamily: font.secondary,
                      fontWeight:
                        "var(--font-heading-weight)" as unknown as number,
                    }}
                  >
                    {m.value}
                  </span>
                  <span
                    className="mt-1 flex items-center gap-0.5 font-medium text-[10px]"
                    style={{
                      color: m.up ? fg.success : fg.critical,
                      transition: transition.theme,
                    }}
                  >
                    {m.up ? (
                      <TrendingUp size={10} />
                    ) : (
                      <TrendingDown size={10} />
                    )}
                    {m.change} vs last month
                  </span>
                </div>
              ))}
            </div>

            <div
              className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
              style={{ gap: space.md, transition: transition.theme }}
            >
              <div
                className="flex flex-col"
                style={{ gap: space.md, transition: transition.theme }}
              >
                {/* Chart Area */}
                <div
                  style={{
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.raised,
                    padding: space.lg,
                    transition: transition.theme,
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <span
                        className="block font-semibold text-xs"
                        style={{ color: fg.onBase }}
                      >
                        Revenue Analytics
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: fg.onBaseMuted }}
                      >
                        Daily income over the last 7 days
                      </span>
                    </div>
                    {/* Ghost button */}
                    <button
                      className="pg-interactive flex cursor-pointer items-center gap-1 px-2 py-1 font-medium text-[10px]"
                      style={{
                        backgroundColor: bg.raisedHover,
                        borderRadius: radius.badge,
                        color: fg.onBaseMuted,
                        transition: transition.interactive,
                      }}
                      type="button"
                    >
                      Last 7 days <ChevronDown size={10} />
                    </button>
                  </div>
                  <ReactECharts
                    lazyUpdate
                    notMerge
                    option={revenueChartOption}
                    opts={{ renderer: "canvas" }}
                    style={{ height: 210, width: "100%" }}
                  />
                </div>

                {/* Transactions */}
                <div
                  style={{
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.raised,
                    overflow: "hidden",
                    transition: transition.theme,
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{
                      padding: `${space.lg} ${space.lg} 10px`,
                      transition: transition.theme,
                    }}
                  >
                    <div>
                      <span
                        className="block font-semibold text-xs"
                        style={{ color: fg.onBase }}
                      >
                        Recent Transactions
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: fg.onBaseMuted }}
                      >
                        Latest payments processed across all projects
                      </span>
                    </div>
                    {/* Link button */}
                    <button
                      className="pg-interactive flex cursor-pointer items-center gap-1 px-2 py-1 font-medium text-[10px]"
                      style={{
                        borderRadius: radius.badge,
                        color: fg.primary,
                        transition: transition.interactive,
                      }}
                      type="button"
                    >
                      View all <ExternalLink size={9} />
                    </button>
                  </div>

                  <div
                    className="overflow-x-auto"
                    style={{ transition: transition.theme }}
                  >
                    <table className="w-full min-w-[560px] text-[11px]">
                      <thead>
                        <tr
                          style={{
                            borderBottom: `1px solid ${border.neutral}`,
                            transition: transition.theme,
                          }}
                        >
                          {["Customer", "Status", "Date", "Amount"].map((h) => (
                            <th
                              className="text-left font-medium"
                              key={h}
                              style={{
                                color: fg.onBaseMuted,
                                padding: `${space.sm} ${space.md}`,
                                transition: transition.theme,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, index) => {
                          const tone =
                            statusStyles[row.status] ?? statusStyles.Draft;
                          return (
                            <tr
                              className="pg-row"
                              key={row.customer}
                              style={{
                                borderBottom: `1px solid ${border.neutral}`,
                                transition: transition.theme,
                              }}
                            >
                              <td
                                style={{ padding: `${space.sm} ${space.md}` }}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-6 w-6 items-center justify-center font-semibold text-[9px]"
                                    style={{
                                      backgroundColor: avatarColors[index],
                                      borderRadius: radius.action,
                                      color: fg.onBase,
                                      transition: transition.theme,
                                    }}
                                  >
                                    {initials[index]}
                                  </div>
                                  <div>
                                    <div
                                      className="font-medium"
                                      style={{ color: fg.onBase }}
                                    >
                                      {row.customer}
                                    </div>
                                    <div
                                      className="text-[10px]"
                                      style={{ color: fg.onBaseMuted }}
                                    >
                                      {row.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td
                                style={{ padding: `${space.sm} ${space.md}` }}
                              >
                                <span
                                  className="inline-block px-2 py-0.5 font-semibold text-[9px]"
                                  style={{
                                    backgroundColor: tone.bg,
                                    borderRadius: radius.badge,
                                    color: tone.fg,
                                    transition: transition.theme,
                                  }}
                                >
                                  {row.status}
                                </span>
                              </td>
                              <td
                                style={{
                                  color: fg.onBaseMuted,
                                  padding: `${space.sm} ${space.md}`,
                                  transition: transition.theme,
                                }}
                              >
                                {row.date}
                              </td>
                              <td
                                style={{
                                  color: fg.onBase,
                                  fontWeight: 600,
                                  padding: `${space.sm} ${space.md}`,
                                  transition: transition.theme,
                                }}
                              >
                                {row.amount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div
                className="flex flex-col"
                style={{ gap: space.md, transition: transition.theme }}
              >
                {/* Traffic Sources */}
                <div
                  style={{
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.raised,
                    padding: space.lg,
                    transition: transition.theme,
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className="font-semibold text-xs"
                      style={{ color: fg.onBase }}
                    >
                      Traffic Sources
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: fg.onBaseMuted }}
                    >
                      Where visitors come from
                    </span>
                  </div>
                  <div
                    className="flex flex-col"
                    style={{ gap: space.md, transition: transition.theme }}
                  >
                    {trafficSources.map((source) => (
                      <div key={source.label}>
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                          <span style={{ color: fg.onBase }}>
                            {source.label}
                          </span>
                          <span style={{ color: fg.onBaseMuted }}>
                            {source.share}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 w-full overflow-hidden"
                          style={{
                            backgroundColor: bg.sunkenStrong,
                            borderRadius: radius.action,
                            transition: transition.theme,
                          }}
                        >
                          <div
                            className="h-full"
                            style={{
                              backgroundColor: bg.primary,
                              borderRadius: radius.action,
                              transition: transition.theme,
                              width: `${source.share}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferences */}
                <div
                  style={{
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.raised,
                    padding: space.lg,
                    transition: transition.theme,
                  }}
                >
                  <span
                    className="mb-1 block font-semibold text-xs"
                    style={{ color: fg.onBase }}
                  >
                    Preferences
                  </span>
                  <span
                    className="mb-3 block text-[10px]"
                    style={{ color: fg.onBaseMuted }}
                  >
                    Configure visual and functional elements.
                  </span>
                  <div
                    className="flex flex-col"
                    style={{ gap: space.md, transition: transition.theme }}
                  >
                    {[
                      ["Display Name", "Acme Design Team"],
                      ["Default Role", "Viewer (Read-only)"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div
                          className="mb-1 text-[10px]"
                          style={{ color: fg.onBaseMuted }}
                        >
                          {label}
                        </div>
                        <div
                          className="flex items-center justify-between text-[10px]"
                          style={{
                            backgroundColor: bg.base,
                            border: `1px solid ${border.neutral}`,
                            borderRadius: radius.field,
                            color: fg.onBase,
                            padding: `${space.sm} ${space.lg}`,
                            transition: transition.theme,
                          }}
                        >
                          <span>{value}</span>
                          <ChevronDown
                            size={11}
                            style={{ color: fg.onBaseFaint }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {/* Primary button */}
                    <button
                      className="pg-interactive flex-1 cursor-pointer py-2 font-semibold text-[10px]"
                      style={{
                        backgroundColor: bg.primary,
                        borderRadius: radius.action,
                        color: fg.onPrimary,
                        transition: transition.interactive,
                      }}
                      type="button"
                    >
                      Save Preferences
                    </button>
                    {/* Secondary (outlined) button */}
                    <button
                      className="pg-interactive cursor-pointer px-3 py-2 font-semibold text-[10px]"
                      style={{
                        backgroundColor: "transparent",
                        border: `1px solid ${border.neutral}`,
                        borderRadius: radius.action,
                        color: fg.onBase,
                        transition: transition.interactive,
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* CTA Card */}
                <div
                  style={{
                    background: gradient,
                    borderRadius: radius.container,
                    boxShadow: shadow.raised,
                    padding: space.lg,
                    transition: transition.theme,
                  }}
                >
                  <div
                    className="font-semibold text-xs"
                    style={{
                      color: fg.onGradient,
                      transition: transition.theme,
                    }}
                  >
                    Unleash the new API v2.0
                  </div>
                  <div
                    className="mt-1 text-[10px]"
                    style={{
                      color: fg.onGradientMuted,
                      transition: transition.theme,
                    }}
                  >
                    Faster response times and realtime event streams.
                  </div>
                  {/* Ghost-on-gradient button */}
                  <button
                    className="pg-interactive mt-3 cursor-pointer px-2.5 py-1 text-[10px]"
                    style={{
                      backgroundColor: bg.gradientSoft,
                      borderRadius: radius.badge,
                      color: fg.onGradientSoft,
                      transition: transition.interactive,
                    }}
                    type="button"
                  >
                    Read Docs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaygroundDashboard;
