"use client";

import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { GPU, SPRING } from "./landing-tokens";

type Props = {
  label: string;
  onClick: () => void;
  reduced: boolean;
  icon?: LucideIcon;
  size?: "lg" | "md";
};

// Primary action across the page. Vivid purple→blue→emerald gradient fill;
// hover triggers an expanding multi-color halo (the "iris glow") via layered
// boxShadow rings. Use `size="md"` for inline reuse in tighter contexts.
export function IrisCta({
  label,
  onClick,
  reduced,
  icon: Icon = ArrowRight,
  size = "lg",
}: Props) {
  const isLg = size === "lg";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={
        reduced
          ? undefined
          : {
              scale: 1.03,
              boxShadow:
                "0 0 0 8px rgba(168,85,247,0.14), 0 0 0 22px rgba(59,130,246,0.08), 0 32px 80px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.95)",
            }
      }
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className={
        isLg
          ? "relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-7 py-4 text-[16px] font-semibold text-white"
          : "relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
      }
      style={{
        background:
          "linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%)",
        border: "1px solid rgba(255,255,255,0.45)",
        boxShadow:
          "0 22px 50px rgba(168,85,247,0.40), inset 0 1px 0 rgba(255,255,255,0.55)",
        ...GPU,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
        }}
      />
      <span className="relative">{label}</span>
      <Icon className={isLg ? "relative size-4" : "relative size-3.5"} strokeWidth={2.6} />
    </motion.button>
  );
}
