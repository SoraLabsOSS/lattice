import { motion, useMotionValue, useSpring } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { siteImages } from "../lib/site-images";

// Scroll distance (px) before flowers begin to disappear. Kept small so it feels scroll-driven.
const HIDE_THRESHOLD = 140;
// Total stagger window (s) from first to last element. Small to keep interruption snappy.
// Duration/easing for the hide animation itself live in `.floral-hide` in global.css.
const HIDE_STAGGER = 0.28;

type TokenKind = "color" | "radius" | "spacing" | "font";

interface TokenDef {
  kind: TokenKind;
  name: string;
  value: string;
}

interface Position {
  delay: number;
  rotation: number;
  scale: number;
  token?: TokenDef;
  type: "pink" | "yellow" | "leaf1" | "leaf2" | "bubble";
  x: number;
  y: number;
}

const ASSETS = {
  leaf1: siteImages.leaf1,
  leaf2: siteImages.leaf2,
  pink: siteImages.flowerPink,
  yellow: siteImages.flowerYellow,
};

const LEFT_CLUSTER: Position[] = [
  // Extreme Outer Vertical Edge (Denser at bottom, less high)
  { delay: 0.05, rotation: -10, scale: 0.95, type: "pink", x: 1, y: 98 },
  { delay: 0.08, rotation: 15, scale: 1.1, type: "yellow", x: 2, y: 88 },
  { delay: 0.12, rotation: -20, scale: 0.85, type: "pink", x: 0, y: 78 },
  { delay: 0.15, rotation: 30, scale: 1.05, type: "yellow", x: 3, y: 68 },
  { delay: 0.18, rotation: -5, scale: 0.9, type: "pink", x: 1, y: 58 },
  { delay: 0.22, rotation: 10, scale: 0.8, type: "yellow", x: 4, y: 48 },
  { delay: 0.25, rotation: -15, scale: 0.75, type: "pink", x: 2, y: 38 },
  { delay: 0.28, rotation: 25, scale: 0.85, type: "yellow", x: 3, y: 32 }, // Reduced verticality

  // Second Vertical Layer
  { delay: 0.28, rotation: 5, scale: 1.2, type: "pink", x: 8, y: 95 },
  { delay: 0.31, rotation: -10, scale: 0.9, type: "yellow", x: 7, y: 82 },
  { delay: 0.34, rotation: 20, scale: 1.15, type: "pink", x: 9, y: 72 },
  {
    delay: 0.3,
    rotation: 0,
    scale: 1,
    token: { kind: "color", name: "--foreground-primary", value: "#1c7583" },
    type: "bubble",
    x: 20,
    y: 60,
  },
  { delay: 0.4, rotation: -25, scale: 0.85, type: "yellow", x: 10, y: 52 },
  { delay: 0.43, rotation: 15, scale: 0.7, type: "pink", x: 11, y: 42 },
  { delay: 0.46, rotation: -15, scale: 0.75, type: "pink", x: 9, y: 35 }, // Reduced verticality

  // Third Layer (Spreading)
  { delay: 0.46, rotation: -15, scale: 1.0, type: "yellow", x: 18, y: 92 },
  { delay: 0.49, rotation: 10, scale: 0.85, type: "pink", x: 22, y: 80 },
  { delay: 0.52, rotation: -5, scale: 1.1, type: "yellow", x: 25, y: 96 },
  { delay: 0.55, rotation: 25, scale: 0.9, type: "pink", x: 20, y: 70 },
  {
    delay: 0.45,
    rotation: 15,
    scale: 1,
    token: { kind: "radius", name: "--shape-radius-container", value: "8px" },
    type: "bubble",
    x: 34,
    y: 90,
  },
  { delay: 0.61, rotation: -10, scale: 0.8, type: "yellow", x: 24, y: 55 },
  { delay: 0.64, rotation: 20, scale: 0.7, type: "pink", x: 21, y: 45 },

  // Transition Layers
  { delay: 0.64, rotation: 20, scale: 1.2, type: "pink", x: 35, y: 94 },
  { delay: 0.67, rotation: -5, scale: 0.95, type: "yellow", x: 42, y: 85 },
  { delay: 0.7, rotation: 15, scale: 1.05, type: "pink", x: 48, y: 98 },
  { delay: 0.73, rotation: -10, scale: 0.8, type: "yellow", x: 55, y: 88 },
  {
    delay: 0.6,
    rotation: 0,
    scale: 1,
    token: { kind: "spacing", name: "--space-lg", value: "16px" },
    type: "bubble",
    x: 54,
    y: 76,
  },

  // Tapering
  { delay: 0.79, rotation: 10, scale: 1.1, type: "pink", x: 65, y: 95 },
  { delay: 0.82, rotation: -5, scale: 0.9, type: "yellow", x: 75, y: 98 },
  { delay: 0.85, rotation: 35, scale: 0.75, type: "yellow", x: 15, y: 88 },
  { delay: 0.88, rotation: -15, scale: 0.8, type: "pink", x: 32, y: 78 },
  { delay: 0.94, rotation: -20, scale: 0.85, type: "pink", x: 50, y: 92 },

  // New Leaves at Bottom
  { delay: 0.1, rotation: 45, scale: 0.8, type: "leaf1", x: 5, y: 92 },
  { delay: 0.2, rotation: -10, scale: 0.75, type: "leaf2", x: 12, y: 85 },
  { delay: 0.3, rotation: 20, scale: 0.9, type: "leaf1", x: 28, y: 96 },

  // Diagonal Accents (Down and In)
  { delay: 0.65, rotation: -15, scale: 0.8, type: "pink", x: 60, y: 80 },
  { delay: 0.55, rotation: -5, scale: 0.85, type: "pink", x: 30, y: 50 },
  { delay: 0.65, rotation: 15, scale: 0.95, type: "yellow", x: 40, y: 70 },

  // Shallow Diagonal Accents (~25º Down and In)
  { delay: 0.3, rotation: 10, scale: 0.8, type: "pink", x: 4, y: 45 },
  { delay: 0.4, rotation: -5, scale: 0.85, type: "yellow", x: 18, y: 52 },
  { delay: 0.5, rotation: 15, scale: 0.9, type: "pink", x: 32, y: 59 },
  { delay: 0.6, rotation: -10, scale: 0.8, type: "yellow", x: 46, y: 66 },
];

const RIGHT_CLUSTER: Position[] = [
  // Extreme Outer Vertical Edge (Denser at bottom, less high)
  { delay: 0.05, rotation: 10, scale: 0.95, type: "yellow", x: 99, y: 98 },
  { delay: 0.08, rotation: -15, scale: 1.1, type: "pink", x: 98, y: 88 },
  { delay: 0.12, rotation: 20, scale: 0.85, type: "yellow", x: 100, y: 78 },
  { delay: 0.15, rotation: -30, scale: 1.05, type: "pink", x: 97, y: 68 },
  { delay: 0.18, rotation: 5, scale: 0.9, type: "yellow", x: 99, y: 58 },
  { delay: 0.22, rotation: -10, scale: 0.8, type: "pink", x: 96, y: 48 },
  { delay: 0.25, rotation: 15, scale: 0.75, type: "pink", x: 98, y: 38 },
  { delay: 0.28, rotation: -25, scale: 0.85, type: "yellow", x: 97, y: 32 }, // Reduced verticality

  // Second Vertical Layer
  { delay: 0.28, rotation: -5, scale: 1.2, type: "yellow", x: 92, y: 95 },
  { delay: 0.31, rotation: 10, scale: 0.9, type: "pink", x: 93, y: 82 },
  { delay: 0.34, rotation: -20, scale: 1.15, type: "yellow", x: 91, y: 72 },
  {
    delay: 0.3,
    rotation: 0,
    scale: 1,
    token: { kind: "color", name: "--foreground-accent", value: "#8f5466" },
    type: "bubble",
    x: 82,
    y: 62,
  },
  { delay: 0.4, rotation: 25, scale: 0.85, type: "pink", x: 90, y: 52 },
  { delay: 0.43, rotation: -15, scale: 0.7, type: "yellow", x: 89, y: 42 },
  { delay: 0.46, rotation: 15, scale: 0.75, type: "pink", x: 91, y: 35 }, // Reduced verticality

  // Third Layer (Spreading)
  { delay: 0.46, rotation: 15, scale: 1.0, type: "pink", x: 82, y: 92 },
  { delay: 0.49, rotation: -10, scale: 0.85, type: "yellow", x: 78, y: 80 },
  { delay: 0.52, rotation: 5, scale: 1.1, type: "pink", x: 75, y: 96 },
  { delay: 0.55, rotation: -25, scale: 0.9, type: "yellow", x: 80, y: 70 },
  {
    delay: 0.45,
    rotation: -15,
    scale: 1,
    token: { kind: "font", name: "--font-heading-md-size", value: "24px" },
    type: "bubble",
    x: 66,
    y: 90,
  },
  { delay: 0.61, rotation: 10, scale: 0.8, type: "pink", x: 76, y: 55 },
  { delay: 0.64, rotation: -20, scale: 0.7, type: "yellow", x: 79, y: 45 },

  // Transition Layers
  { delay: 0.64, rotation: -20, scale: 1.2, type: "yellow", x: 65, y: 94 },
  { delay: 0.67, rotation: 5, scale: 0.95, type: "pink", x: 58, y: 85 },
  { delay: 0.7, rotation: -15, scale: 1.05, type: "yellow", x: 52, y: 98 },
  { delay: 0.73, rotation: 10, scale: 0.8, type: "pink", x: 45, y: 88 },
  {
    delay: 0.6,
    rotation: 0,
    scale: 1,
    token: { kind: "color", name: "--background-critical", value: "#e23d3f" },
    type: "bubble",
    x: 48,
    y: 72,
  },

  // Tapering
  { delay: 0.79, rotation: -10, scale: 1.1, type: "yellow", x: 35, y: 95 },
  { delay: 0.82, rotation: 5, scale: 0.9, type: "pink", x: 25, y: 98 },
  { delay: 0.85, rotation: -35, scale: 0.75, type: "yellow", x: 85, y: 88 },
  { delay: 0.88, rotation: 15, scale: 0.8, type: "yellow", x: 68, y: 78 },
  { delay: 0.94, rotation: 20, scale: 0.85, type: "yellow", x: 50, y: 92 },

  // New Leaves at Bottom
  { delay: 0.1, rotation: -45, scale: 0.8, type: "leaf2", x: 95, y: 92 },
  { delay: 0.2, rotation: 10, scale: 0.75, type: "leaf1", x: 88, y: 85 },
  { delay: 0.3, rotation: -20, scale: 0.9, type: "leaf2", x: 72, y: 96 },

  // Diagonal Accents (Down and In)
  { delay: 0.65, rotation: 15, scale: 0.8, type: "yellow", x: 40, y: 80 },
  { delay: 0.45, rotation: -10, scale: 0.9, type: "pink", x: 80, y: 45 },
  { delay: 0.55, rotation: 5, scale: 0.85, type: "yellow", x: 70, y: 50 },
  { delay: 0.65, rotation: -15, scale: 0.95, type: "pink", x: 60, y: 70 },

  // Shallow Diagonal Accents (~25º Down and In)
  { delay: 0.3, rotation: -10, scale: 0.8, type: "yellow", x: 96, y: 45 },
  { delay: 0.5, rotation: -15, scale: 0.9, type: "yellow", x: 68, y: 59 },
  { delay: 0.6, rotation: 10, scale: 0.8, type: "pink", x: 54, y: 66 },
];

const FloralElement = React.memo(
  ({
    pos,
    mouseX,
    mouseY,
    cluster,
    masterDelay = 0,
    containerRef,
  }: {
    pos: Position;
    mouseX: any;
    mouseY: any;
    cluster: "left" | "right";
    masterDelay?: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    // Cached element center; refreshed on mount/resize/page-swap instead of every mousemove.
    const centerRef = useRef<{ x: number; y: number } | null>(null);

    const springConfig = { damping: 25, stiffness: 200 };
    const translateX = useSpring(0, springConfig);
    const translateY = useSpring(0, springConfig);

    // Randomize sway parameters for natural feel
    const swayOffset = useMemo(() => Math.random() * Math.PI, []);
    const swayDuration = useMemo(() => 3 + Math.random() * 2, []);
    const swayAmount = useMemo(() => 4 + Math.random() * 4, []);

    // Per-element stagger delays based on horizontal proximity to screen center.
    // - Going hidden: inner-most elements leave first (delayOut = 0 at center, max at edges).
    // - Coming back: outer-most elements return first (delayIn = 0 at edges, max at center).
    // The values are emitted as CSS custom properties below; the `.floral-hide` rule consumes
    // them via `transition-delay` so direction reversal is handled by the browser, not JS.
    const { delayIn, delayOut } = useMemo(() => {
      const inwardness =
        cluster === "left"
          ? Math.min(1, Math.max(0, pos.x / 75))
          : Math.min(1, Math.max(0, (100 - pos.x) / 75));
      return {
        delayIn: inwardness * HIDE_STAGGER,
        delayOut: (1 - inwardness) * HIDE_STAGGER,
      };
    }, [pos.x, cluster]);

    useEffect(() => {
      const updateCenter = () => {
        if (!elementRef.current) {
          return;
        }
        const rect = elementRef.current.getBoundingClientRect();
        centerRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      };

      // Defer first read to next frame so parent layout (and any entrance transforms) has settled.
      const raf = requestAnimationFrame(updateCenter);

      let resizeRaf = 0;
      const scheduleUpdate = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(updateCenter);
      };

      window.addEventListener("resize", scheduleUpdate);
      document.addEventListener("astro:after-swap", updateCenter);

      return () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(resizeRaf);
        window.removeEventListener("resize", scheduleUpdate);
        document.removeEventListener("astro:after-swap", updateCenter);
      };
    }, []);

    useEffect(() => {
      const updateMovement = () => {
        // Cheap bail-out while the page is actively scrolling. With Lenis driving smooth scroll
        // on the same rAF loop as Framer's springs, suppressing 80×2 spring updates per scroll
        // frame removes the main bottleneck during the hide animation window.
        if (containerRef.current?.dataset.floralScrolling === "true") {
          return;
        }

        const center = centerRef.current;
        if (!center) {
          return;
        }

        const mx = mouseX.get();
        const my = mouseY.get();
        const dx = mx - center.x;
        const dy = my - center.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 250;

        if (dist < maxDist) {
          const power = (1 - dist / maxDist) * 30;
          const angle = Math.atan2(dy, dx);
          translateX.set(Math.cos(angle) * -power);
          translateY.set(Math.sin(angle) * -power);
        } else {
          translateX.set(0);
          translateY.set(0);
        }
      };

      const unsubscribeX = mouseX.on("change", updateMovement);
      const unsubscribeY = mouseY.on("change", updateMovement);

      return () => {
        unsubscribeX();
        unsubscribeY();
      };
    }, [mouseX, mouseY, translateX, translateY, containerRef]);

    const renderContent = () => {
      if (pos.type === "bubble" && pos.token) {
        const { name, kind, value } = pos.token;
        let visual: React.ReactNode = null;
        if (kind === "color") {
          visual = (
            <div
              className="h-4 w-4 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: value }}
            />
          );
        } else if (kind === "radius") {
          visual = (
            <div
              className="h-4 w-4 shrink-0 border border-black/10 bg-neutral-100"
              style={{ borderRadius: value }}
            />
          );
        } else if (kind === "spacing") {
          visual = (
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-neutral-300">
              <div
                className="max-h-full max-w-full rounded-sm bg-neutral-100"
                style={{ height: value, width: value }}
              />
            </div>
          );
        } else if (kind === "font") {
          visual = (
            <div className="flex h-4 w-4 shrink-0 items-center justify-center font-semibold text-[13px] text-neutral-900 leading-none">
              Aa
            </div>
          );
        }
        return (
          <div className="hidden flex-row items-center gap-2 rounded-full border border-gray-100/50 bg-white px-3 py-1.5 shadow-lg backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 md:inline-flex">
            {visual}
            <span className="whitespace-nowrap font-mono text-[13px] text-neutral-700">
              {name}
            </span>
          </div>
        );
      }
      if (pos.type === "bubble") {
        return null;
      }
      return (
        <img
          alt=""
          className="h-full w-full select-none object-contain drop-shadow-sm"
          draggable={false}
          src={ASSETS[pos.type]}
        />
      );
    };

    const rotateDuration = swayDuration;
    const translateDuration = swayDuration * 1.2;

    return (
      <div
        ref={elementRef}
        style={{
          left: `${pos.x}%`,
          position: "absolute",
          top: `${pos.y}%`,
          transform: "translate(-50%, -50%)",
          zIndex: pos.type === "bubble" ? 20 : 10,
          // Per-element CSS vars drive the sway keyframes (no per-element Framer tweens).
          ["--floral-sway-amount" as any]: `${swayAmount}px`,
          ["--floral-sway-duration" as any]: `${rotateDuration}s`,
          ["--floral-sway-translate-duration" as any]: `${translateDuration}s`,
          ["--floral-sway-rotate-delay" as any]: `${pos.delay + masterDelay}s`,
          ["--floral-sway-translate-delay" as any]: `${swayOffset}s`,
          // Consumed by `.floral-hide` for the compositor-driven scale+fade transition.
          ["--floral-delay-in" as any]: `${delayIn}s`,
          ["--floral-delay-out" as any]: `${delayOut}s`,
        }}
      >
        <motion.div
          animate={{ opacity: 1, rotate: pos.rotation, scale: pos.scale }}
          className="cursor-pointer"
          initial={{ opacity: 0, rotate: pos.rotation - 20, scale: 0 }}
          style={{
            height: pos.type === "bubble" ? "auto" : "clamp(60px, 8vw, 100px)",
            width: pos.type === "bubble" ? "auto" : "clamp(60px, 8vw, 100px)",
            x: translateX,
            y: translateY,
          }}
          transition={{
            delay: pos.delay + masterDelay,
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <div className="floral-hide">
            <div className="floral-sway-rotate">
              <div className="floral-sway-translate">{renderContent()}</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
);

export const FloralDecoration = ({
  masterDelay = 0,
  hideThreshold = HIDE_THRESHOLD,
}: {
  masterDelay?: number;
  hideThreshold?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Single boolean reflected as `data-floral-past` on the root. The hide/show animation
  // is pure CSS (see `.floral-hide` in global.css), so this state only flips twice per
  // visit (once on cross, once on cross-back) — the React render cost is negligible.
  const [pastThreshold, setPastThreshold] = useState(false);

  // One passive scroll listener, rAF-throttled, replaces the ~80 per-element
  // scroll subscriptions. It does two things:
  //   1. Toggles `data-floral-scrolling` on the container so CSS can pause sway and
  //      JS can short-circuit per-element parallax updates during continuous scroll.
  //   2. Updates `pastThreshold` only on threshold cross — drives the CSS hide/show.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    let rafId = 0;
    let resetTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastPast = window.scrollY > hideThreshold;
    setPastThreshold(lastPast);

    const handle = () => {
      rafId = 0;
      if (!containerRef.current) {
        return;
      }

      if (containerRef.current.dataset.floralScrolling !== "true") {
        containerRef.current.dataset.floralScrolling = "true";
      }
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
      resetTimeout = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.dataset.floralScrolling = "false";
        }
      }, 120);

      const past = window.scrollY > hideThreshold;
      if (past !== lastPast) {
        lastPast = past;
        setPastThreshold(past);
      }
    };

    const onScroll = () => {
      if (rafId) {
        return;
      }
      rafId = requestAnimationFrame(handle);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
    };
  }, [hideThreshold]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  return (
    <div
      className="floral-root pointer-events-none absolute inset-0 select-none overflow-hidden"
      data-floral-past={pastThreshold ? "true" : "false"}
      data-floral-scrolling="false"
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      {/* Hide/show is driven entirely by the `data-floral-past` attribute on the root and
          per-element CSS vars; the cluster wrappers exist only for positioning + their own
          compositor layer (`.floral-cluster`). */}
      <div className="floral-cluster pointer-events-auto absolute bottom-[120px] left-[-50px] h-[600px] w-[45vw]">
        {LEFT_CLUSTER.map((pos, i) => (
          <FloralElement
            cluster="left"
            containerRef={containerRef}
            key={`left-${i}`}
            masterDelay={masterDelay}
            mouseX={mouseX}
            mouseY={mouseY}
            pos={pos}
          />
        ))}
      </div>

      <div className="floral-cluster pointer-events-auto absolute right-[-50px] bottom-[120px] h-[600px] w-[45vw]">
        <div className="relative h-full w-full">
          {RIGHT_CLUSTER.map((pos, i) => (
            <FloralElement
              cluster="right"
              containerRef={containerRef}
              key={`right-${i}`}
              masterDelay={masterDelay}
              mouseX={mouseX}
              mouseY={mouseY}
              pos={pos}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloralDecoration;
