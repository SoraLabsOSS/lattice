// Shared, typed accessors for the CSS custom properties emitted by
// `generateDesignTokens()` (see `@soralabsoss/generator`).

const t = (token: string) => `var(--${token})`;

export const bg = {
  accent: t("color-background-accent"),
  accentSubtle: t("color-background-accentSubtle"),
  base: t("color-background-base"),
  critical: t("color-background-critical"),
  criticalSubtle: t("color-background-criticalSubtle"),
  gradientSoft: t("color-background-gradientSoft"),
  info: t("color-background-info"),
  infoSubtle: t("color-background-infoSubtle"),
  overlay: t("color-background-overlay"),
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
} as const;

export const fg = {
  accent: t("color-foreground-accent"),
  critical: t("color-foreground-critical"),
  info: t("color-foreground-info"),
  onAccent: t("color-foreground-onAccent"),
  onAccentSubtle: t("color-foreground-onAccentSubtle"),
  onBase: t("color-foreground-onBase"),
  onBaseFaint: t("color-foreground-onBaseFaint"),
  onBaseMuted: t("color-foreground-onBaseMuted"),
  onCritical: t("color-foreground-onCritical"),
  onCriticalSubtle: t("color-foreground-onCriticalSubtle"),
  onGradient: t("color-foreground-onGradient"),
  onGradientMuted: t("color-foreground-onGradientMuted"),
  onInfo: t("color-foreground-onInfo"),
  onInfoSubtle: t("color-foreground-onInfoSubtle"),
  onPrimary: t("color-foreground-onPrimary"),
  onPrimarySubtle: t("color-foreground-onPrimarySubtle"),
  onRaised: t("color-foreground-onRaised"),
  onSuccess: t("color-foreground-onSuccess"),
  onSuccessSubtle: t("color-foreground-onSuccessSubtle"),
  onSunken: t("color-foreground-onSunken"),
  onSunkenStrong: t("color-foreground-onSunkenStrong"),
  onWarningSubtle: t("color-foreground-onWarningSubtle"),
  primary: t("color-foreground-primary"),
  success: t("color-foreground-success"),
  warning: t("color-foreground-warning"),
} as const;

export const border = {
  accent: t("color-border-accent"),
  critical: t("color-border-critical"),
  info: t("color-border-info"),
  neutral: t("color-border-neutral"),
  primary: t("color-border-primary"),
  strong: t("color-border-strong"),
  success: t("color-border-success"),
  warning: t("color-border-warning"),
} as const;

export const radius = {
  action: t("shape-radius-action"),
  badge: t("shape-radius-badge"),
  container: t("shape-radius-container"),
  field: t("shape-radius-field"),
  sub: t("shape-radius-subcontainer"),
} as const;

export const space = {
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
} as const;

export const shadow = {
  overlay: t("shadow-overlay"),
  raised: t("shadow-raised"),
} as const;

export const transition = {
  chart: t("transition-chart"),
  interactive: t("transition-interactive"),
  theme: t("transition-theme"),
} as const;

// Translucent scrim colors layered over an interactive element to signal
// hover/active. They only shift the color beneath them, so the same pair works
// on solid and transparent backgrounds alike.
export const interactive = {
  active: t("color-interactive-background-active"),
  hover: t("color-interactive-background-hover"),
} as const;

export const font = {
  action: t("font-action-family"),
  field: t("font-field-family"),
  primary: t("font-body-family"),
  secondary: t("font-heading-family"),
} as const;

export const weight = {
  action: t("font-action-weight"),
  bodyBold: t("font-body-weight-bold"),
  bodyRegular: t("font-body-weight-regular"),
  field: t("font-field-weight"),
  heading: t("font-heading-weight"),
} as const;

// Control-typography ramps. Each t-shirt size gives you a font-size and a
// line-height that's pre-tuned to match an icon-only button/input at the
// same size, so text and icon variants share outer heights:
//   xs → 12px text + 14px icon
//   sm → 14px text + 16px icon
//   md → 16px text + 20px icon
//   lg → 18px text + 24px icon
export type ControlSize = "xs" | "sm" | "md" | "lg";

export const action: Record<ControlSize, { size: string; lineHeight: string }> =
  {
    lg: {
      lineHeight: t("font-action-lg-lineheight"),
      size: t("font-action-lg-size"),
    },
    md: {
      lineHeight: t("font-action-md-lineheight"),
      size: t("font-action-md-size"),
    },
    sm: {
      lineHeight: t("font-action-sm-lineheight"),
      size: t("font-action-sm-size"),
    },
    xs: {
      lineHeight: t("font-action-xs-lineheight"),
      size: t("font-action-xs-size"),
    },
  };

export const field: Record<ControlSize, { size: string; lineHeight: string }> =
  {
    lg: {
      lineHeight: t("font-field-lg-lineheight"),
      size: t("font-field-lg-size"),
    },
    md: {
      lineHeight: t("font-field-md-lineheight"),
      size: t("font-field-md-size"),
    },
    sm: {
      lineHeight: t("font-field-sm-lineheight"),
      size: t("font-field-sm-size"),
    },
    xs: {
      lineHeight: t("font-field-xs-lineheight"),
      size: t("font-field-xs-size"),
    },
  };

export const gradient = t("gradient-primary");
