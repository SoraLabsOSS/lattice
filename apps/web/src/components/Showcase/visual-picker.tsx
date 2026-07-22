import { motion } from "framer-motion";
import type React from "react";

export interface VisualPickerOption {
  description: string;
  id: string;
  label: string;
  preview: React.ReactNode;
}

interface VisualPickerProps {
  compact?: boolean;
  label: string;
  onChange: (id: string) => void;
  options: VisualPickerOption[];
  value: string;
}

export const VisualPicker: React.FC<VisualPickerProps> = ({
  label,
  value,
  options,
  onChange,
  compact = false,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-[12px] text-charcoal/80">{label}</label>
    <div
      className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3"}`}
    >
      {options.map((option) => (
        <motion.button
          className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
            value === option.id
              ? "border-forest-green bg-forest-green/5 ring-2 ring-forest-green/10"
              : "border-charcoal/5 bg-white hover:border-charcoal/20"
          }`}
          key={option.id}
          onClick={() => onChange(option.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="mb-3 flex items-center justify-center rounded-lg bg-charcoal/5 p-4">
            {option.preview}
          </div>
          <div className="mb-0.5 font-bold text-sm">{option.label}</div>
          <div className="text-[12px] text-charcoal/50 leading-relaxed">
            {option.description}
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);
