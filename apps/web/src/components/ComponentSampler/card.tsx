import type React from "react";
import { bg, border, radius, shadow, space, transition } from "./tokens";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      backgroundColor: bg.raised,
      border: `1px solid ${border.neutral}`,
      borderRadius: radius.container,
      boxShadow: shadow.raised,
      padding: space.lg,
      transition: transition.theme,
      ...style,
    }}
  >
    {children}
  </div>
);

export default Card;
