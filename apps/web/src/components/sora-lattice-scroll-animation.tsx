import { motion, useReducedMotion } from "framer-motion";
import { siteImages } from "../lib/site-images";

interface FlowerProps {
  index: number;
  left: string;
  rotate: number;
  scale: number;
  top: string;
  type: "pink" | "yellow" | "leaf1" | "leaf2";
}

const ASSETS = {
  leaf1: siteImages.leaf1,
  leaf2: siteImages.leaf2,
  pink: siteImages.flowerPink,
  yellow: siteImages.flowerYellow,
};

const Flower = ({ type, top, left, rotate, scale, index }: FlowerProps) => {
  const reducedMotion = useReducedMotion();

  const visible = { opacity: 1, rotate, scale };
  const hidden = { opacity: 0, rotate: rotate - 25, scale: 0 };

  return (
    <motion.div
      initial={reducedMotion ? visible : hidden}
      style={{
        height: "clamp(40px, 5vw, 60px)",
        left,
        pointerEvents: "none",
        position: "absolute",
        top,
        width: "clamp(40px, 5vw, 60px)",
        x: "-50%",
        y: "-50%",
        zIndex: 0,
      }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : {
              delay: index * 0.08,
              duration: 0.7,
              ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
            }
      }
      viewport={{ margin: "-40px", once: true }}
      whileInView={visible}
    >
      <img alt="" className="h-full w-full object-contain" src={ASSETS[type]} />
    </motion.div>
  );
};

export const SoraLatticeScrollAnimation = () => {
  const flowers: Omit<FlowerProps, "index">[] = [
    { left: "48%", rotate: -15, scale: 0.9, top: "6%", type: "pink" },
    { left: "52%", rotate: 45, scale: 0.8, top: "16%", type: "leaf1" },
    { left: "47%", rotate: 10, scale: 1.1, top: "28%", type: "yellow" },
    { left: "53%", rotate: -20, scale: 0.75, top: "42%", type: "leaf2" },
    { left: "49%", rotate: 25, scale: 1.0, top: "56%", type: "pink" },
    { left: "51%", rotate: -10, scale: 0.85, top: "72%", type: "yellow" },
    { left: "48%", rotate: 60, scale: 0.9, top: "88%", type: "leaf1" },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-50 md:opacity-100"
      style={{ zIndex: 0 }}
    >
      {/* Sora Lattice — fades in from the top so it reads as growing down from the hero */}
      <motion.div
        animate={{ opacity: 1, scaleY: 1 }}
        className="absolute top-0 bottom-0 left-1/2 w-20 -translate-x-1/2 opacity-60 md:w-28 lg:w-32"
        initial={{ opacity: 0, scaleY: 0 }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='36' height='36' viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0L36 36M36 0L0 36' stroke='%23E5E7EB' stroke-width='2.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
          maskImage:
            "linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)",
          transformOrigin: "top center",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)",
        }}
        transition={{ delay: 0.1, duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
      />

      {/* Flowers/Leaves — each pops in once it scrolls into view */}
      <div className="relative mx-auto h-full w-full max-w-7xl opacity-50 md:opacity-100">
        {flowers.map((flower, i) => (
          <Flower key={i} {...flower} index={i} />
        ))}
      </div>
    </div>
  );
};

export default SoraLatticeScrollAnimation;
