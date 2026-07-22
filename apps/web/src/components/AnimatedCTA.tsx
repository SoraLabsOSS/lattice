import { motion, useMotionValue, useSpring } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { siteImages } from "../lib/siteImages";

interface AnimatedCTAProps {
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
  href?: string;
  id?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

const ASSETS = {
  leaf2: siteImages.leaf2,
  pink: siteImages.flowerPink,
  yellow: siteImages.flowerYellow,
};

export const AnimatedCTA: React.FC<AnimatedCTAProps> = ({
  children,
  className = "",
  onClick,
  href,
  id,
  variant = "primary",
  size = "md",
  ariaLabel,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Mouse tracking for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const translateX = useSpring(mouseX, springConfig);
  const translateY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      return;
    }

    const { clientX, clientY } = e;

    rafRef.current = requestAnimationFrame(() => {
      if (!buttonRef.current) {
        rafRef.current = null;
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Subtle cursor tracking - buttons move around as pointer does
      const distanceX = (clientX - centerX) * 0.1;
      const distanceY = (clientY - centerY) * 0.2;

      mouseX.set(distanceX);
      mouseY.set(distanceY);
      rafRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    []
  );

  const variantClasses =
    variant === "primary" ? "btn btn-primary" : "btn btn-secondary";

  const sizeClasses = size === "sm" && "text-sm btn-sm";

  const isFullWidth = className.includes("w-full");
  const isSecondary = variant === "secondary";

  return (
    <motion.div
      className={`relative ${isFullWidth ? "w-full" : "inline-block"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        x: translateX,
        y: translateY,
      }}
    >
      {/* Flower Decorations - scaling up and in */}
      <motion.img
        alt=""
        animate={
          isHovered
            ? { opacity: 1, rotate: 0, scale: 1, x: 0, y: 0 }
            : { opacity: 0, rotate: -15, scale: 0, x: 15, y: 15 }
        }
        className={`absolute ${isSecondary ? "-top-2.5 -left-2.5 h-7 w-7" : "-top-4 -left-4 h-10 w-10"} pointer-events-none z-0`}
        initial={{ opacity: 0, rotate: -15, scale: 0, x: 15, y: 15 }}
        src={ASSETS.pink}
        transition={{ damping: 20, stiffness: 200, type: "spring" }}
      />
      <motion.img
        alt=""
        animate={
          isHovered
            ? { opacity: 1, rotate: 0, scale: 1, x: 0, y: 0 }
            : { opacity: 0, rotate: 15, scale: 0, x: -15, y: -15 }
        }
        className={`absolute ${isSecondary ? "right-11.5 -bottom-4.5 h-7 w-7" : "right-12 -bottom-6 h-10 w-10"} pointer-events-none z-0`}
        initial={{ opacity: 0, rotate: 15, scale: 0, x: -15, y: -15 }}
        src={ASSETS.yellow}
        transition={{
          damping: 20,
          delay: 0.05,
          stiffness: 150,
          type: "spring",
        }}
      />
      <motion.img
        alt=""
        animate={
          isHovered
            ? {
                opacity: 1,
                rotate: 0,
                scale: 1,
                transformOrigin: "bottom",
                x: 0,
                y: 0,
              }
            : {
                opacity: 0,
                rotate: 15,
                scale: 0,
                transformOrigin: "bottom",
                x: -25,
                y: -15,
              }
        }
        className={`absolute ${isSecondary ? "top-0 -right-7 h-9 w-9" : "-top-2 -right-10 h-12 w-12"} pointer-events-none z-0`}
        initial={{ opacity: 0, rotate: 45, scale: 0, x: -25, y: -15 }}
        src={ASSETS.leaf2}
        transition={{ damping: 20, delay: 0.1, stiffness: 150, type: "spring" }}
      />

      {href ? (
        <motion.a
          aria-label={ariaLabel}
          href={href}
          id={id}
          onClick={onClick}
          ref={buttonRef as any}
          {...(href?.includes("/generate")
            ? { "data-astro-reload": true }
            : {})}
          className={`btn relative z-10 ${variantClasses} ${sizeClasses} ${className}`}
        >
          {children}
        </motion.a>
      ) : (
        <motion.button
          aria-label={ariaLabel}
          className={`btn relative z-10 ${variantClasses} ${sizeClasses} ${className}`}
          id={id}
          onClick={onClick}
          ref={buttonRef}
        >
          {children}
        </motion.button>
      )}
    </motion.div>
  );
};
