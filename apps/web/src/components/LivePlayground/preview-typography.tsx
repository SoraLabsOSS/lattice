import { ScrollArea } from "@sora-lattice/ui/components/scroll-area";
import type React from "react";

// ---------------------------------------------------------------------------
// Helpers — mirrors PlaygroundDashboard token accessors
// ---------------------------------------------------------------------------

const t = (token: string) => `var(--${token})`;

const bg = {
  accent: t("color-background-accent"),
  accentSubtle: t("color-background-accentSubtle"),
  base: t("color-background-base"),
  primary: t("color-background-primary"),
  primarySubtle: t("color-background-primarySubtle"),
  raised: t("color-background-raised"),
  sunken: t("color-background-sunken"),
};
const fg = {
  onAccent: t("color-foreground-onAccent"),
  onAccentSubtle: t("color-foreground-onAccentSubtle"),
  onBase: t("color-foreground-onBase"),
  onBaseMuted: t("color-foreground-onBaseMuted"),
  onGradient: t("color-foreground-onGradient"),
  onPrimary: t("color-foreground-onPrimary"),
  primary: t("color-foreground-primary"),
};
const border = {
  neutral: t("color-border-neutral"),
  primary: t("color-border-primary"),
};
const radius = {
  action: t("shape-radius-action"),
  badge: t("shape-radius-badge"),
  container: t("shape-radius-container"),
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
const transition = {
  interactive: t("transition-interactive"),
  theme: t("transition-theme"),
};
const font = {
  primary: t("font-body-family"),
  secondary: t("font-heading-family"),
};
const weight = {
  bodyBold: t("font-body-weight-bold"),
  bodyLight: t("font-body-weight-light"),
  bodyRegular: t("font-body-weight-regular"),
  heading: t("font-heading-weight"),
};
// ---------------------------------------------------------------------------
// Article Preview — styled like an editorial blog post
// ---------------------------------------------------------------------------

interface PreviewTypographyProps {
  bodyFont: string;
  fontScale: number;
  headingFont: string;
}

const PreviewTypography: React.FC<PreviewTypographyProps> = ({
  headingFont: _headingFontName,
  bodyFont: _bodyFontName,
}) => {
  return (
    <ScrollArea
      className="h-full"
      style={{
        backgroundColor: bg.base,
        color: fg.onBase,
        fontFamily: font.primary,
        transition: transition.theme,
      }}
    >
      {/* ── Navigation ── */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between"
        style={{
          backgroundColor: bg.base,
          padding: `${space.md} ${space.lg}`,
          transition: transition.theme,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center font-bold text-xs"
            style={{
              background: bg.accent,
              borderRadius: radius.badge,
              color: fg.onAccent,
              transition: transition.theme,
            }}
          >
            A
          </div>
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: fg.onBase, fontFamily: font.secondary }}
          >
            Acme
          </span>
        </div>
        <div className="flex items-center" style={{ gap: space.md }}>
          {["Design", "Technology", "Culture"].map((item) => (
            <span
              className="hidden cursor-pointer font-medium text-xs hover:opacity-70 sm:inline"
              key={item}
              style={{
                color: fg.onBaseMuted,
                transition: transition.interactive,
              }}
            >
              {item}
            </span>
          ))}
          <button
            className="cursor-pointer font-semibold text-xs"
            style={{
              backgroundColor: bg.primary,
              borderRadius: radius.action,
              color: fg.onPrimary,
              padding: `${space.sm} ${space.lg}`,
              transition: transition.interactive,
            }}
            type="button"
          >
            Subscribe
          </button>
        </div>
      </nav>

      {/* ── Article ── */}
      <article
        className="mx-auto max-w-3xl"
        style={{ marginTop: `calc(${space.lg} + 24px)`, padding: space.lg }}
      >
        {/* Tags / Eyebrow */}
        <div
          className="flex items-center"
          style={{ gap: space.md, marginBottom: space.lg }}
        >
          <span
            className="font-semibold text-[11px]"
            style={{
              backgroundColor: bg.primarySubtle,
              borderRadius: radius.badge,
              color: fg.primary,
              padding: `${space.sm} ${space.lg}`,
              transition: transition.theme,
            }}
          >
            Design Systems
          </span>
          <span className="text-[11px]" style={{ color: fg.onBaseMuted }}>
            8 min read
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            color: fg.onBase,
            fontFamily: font.secondary,
            fontSize: "2.25rem",
            fontWeight: weight.heading as unknown as number,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          The Quiet Power of Typography in Digital Interfaces
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: fg.onBaseMuted,
            fontFamily: font.primary,
            fontSize: "1.125rem",
            fontWeight: weight.bodyLight as unknown as number,
            lineHeight: 1.5,
            margin: 0,
            marginTop: space.md,
          }}
        >
          How thoughtful type choices shape perception, guide attention, and
          build trust — often without anyone noticing.
        </p>

        {/* Author row */}
        <div
          className="flex items-center"
          style={{
            borderTop: `1px solid ${border.neutral}`,
            gap: space.md,
            marginTop: space.lg,
            paddingTop: space.lg,
            transition: transition.theme,
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center font-bold text-xs"
            style={{
              background: bg.accentSubtle,
              borderRadius: radius.container,
              color: fg.onAccentSubtle,
              transition: transition.theme,
            }}
          >
            EK
          </div>
          <div className="flex flex-col">
            <span
              className="font-semibold text-sm"
              style={{ color: fg.onBase, fontFamily: font.primary }}
            >
              Elena Kim
            </span>
            <span className="text-xs" style={{ color: fg.onBaseMuted }}>
              Mar 18, 2026
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ marginTop: space.lg }}>
          <div className="flex flex-col" style={{ gap: space.lg }}>
            <p
              style={{
                color: fg.onBase,
                fontFamily: font.primary,
                fontSize: "1rem",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              When we talk about visual design, color and layout tend to steal
              the spotlight. But typography is the real workhorse — it carries
              meaning, establishes hierarchy, and sets the emotional register of
              an entire product. The best type systems feel invisible precisely
              because they work so well.
            </p>

            <h2
              style={{
                color: fg.onBase,
                fontFamily: font.secondary,
                fontSize: "1.375rem",
                fontWeight: weight.heading as unknown as number,
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Hierarchy Is Orientation
            </h2>

            <p
              style={{
                color: fg.onBase,
                fontFamily: font.primary,
                fontSize: "1rem",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              A clear typographic hierarchy isn't decoration — it's wayfinding.
              Readers unconsciously use size, weight, and spacing to understand
              what's important, what's supporting context, and what they can
              skip. Without this structure, even brilliant content becomes a
              wall of undifferentiated text.
            </p>

            {/* Pull quote */}
            <blockquote
              style={{
                borderLeft: `3px solid ${border.neutral}`,
                color: fg.onBaseMuted,
                fontFamily: font.secondary,
                fontSize: "1.125rem",
                fontStyle: "italic",
                fontWeight: weight.heading as unknown as number,
                lineHeight: 1.5,
                margin: 0,
                padding: `${space.sm} ${space.lg}`,
              }}
            >
              "Typography is the craft of endowing human language with a durable
              visual form."
            </blockquote>

            <p
              style={{
                color: fg.onBase,
                fontFamily: font.primary,
                fontSize: "1rem",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              Consider the difference between a page set in a single weight and
              size versus one that uses a careful scale. The scaled version
              feels intentional and professional — not because anything flashy
              happened, but because the type is doing what readers need it to
              do.
            </p>

            <h2
              style={{
                color: fg.onBase,
                fontFamily: font.secondary,
                fontSize: "1.375rem",
                fontWeight: weight.heading as unknown as number,
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Choosing a Typeface Pairing
            </h2>

            <p
              style={{
                color: fg.onBase,
                fontFamily: font.primary,
                fontSize: "1rem",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              The classic approach pairs contrasting families: a geometric or
              high-contrast serif for headings alongside a neutral, highly
              legible sans-serif for body text. Contrast creates energy, while
              shared proportions maintain cohesion. The goal isn't novelty —
              it's clarity with character.
            </p>

            {/* Callout box */}
            <div
              className="flex"
              style={{
                backgroundColor: bg.primarySubtle,
                borderRadius: radius.container,
                gap: space.md,
                padding: space.lg,
                transition: transition.theme,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontSize: "1.25rem",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                &#x2728;
              </span>
              <div>
                <span
                  className="block font-semibold text-sm"
                  style={{
                    color: fg.primary,
                    fontFamily: font.secondary,
                    marginBottom: space.md,
                  }}
                >
                  Quick Tip
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: fg.primary,
                    fontFamily: font.primary,
                    lineHeight: 1.6,
                  }}
                >
                  Test your type pairing at real content lengths, not just
                  "Lorem ipsum." Reading comfort only reveals itself after a few
                  paragraphs.
                </span>
              </div>
            </div>

            <p
              style={{
                color: fg.onBase,
                fontFamily: font.primary,
                fontSize: "1rem",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              Ultimately, great typography recedes. It doesn't demand attention
              for itself — it lends attention to everything else. When the type
              is right, the content simply feels trustworthy, clear, and worth
              reading. That's the quiet power at the heart of every design
              system.
            </p>
          </div>
        </div>

        {/* ── Tags / Footer ── */}
        <div
          className="flex flex-wrap items-center"
          style={{
            borderTop: `1px solid ${border.neutral}`,
            gap: space.md,
            marginTop: space.lg,
            paddingTop: space.lg,
            transition: transition.theme,
          }}
        >
          {["Typography", "Design Systems", "UI Design", "Accessibility"].map(
            (tag) => (
              <span
                className="font-medium text-[11px]"
                key={tag}
                style={{
                  backgroundColor: bg.sunken,
                  borderRadius: radius.badge,
                  color: fg.onBaseMuted,
                  padding: `${space.sm} ${space.lg}`,
                  transition: transition.theme,
                }}
              >
                {tag}
              </span>
            )
          )}
        </div>
      </article>
    </ScrollArea>
  );
};

export default PreviewTypography;
