"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { REPORT_SPRING } from "./types";

/**
 * SPEC §8.6.4 — Primary glass CTA into the (future) routine engine.
 *
 * Click handler is the placeholder alert per the task brief — wire it
 * to the real routine route when §9 ships.
 */
export function RoutineCta() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.alert("Tính năng Routine đang phát triển!");
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...REPORT_SPRING, delay: 0.25 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex h-16 w-full items-center justify-center gap-2 overflow-hidden rounded-[24px] text-[15px] font-semibold tracking-tight text-white"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--score-color) 92%, white), color-mix(in srgb, var(--score-color) 65%, transparent))",
        border: "1px solid rgba(255,255,255,0.30)",
        boxShadow:
          "0 18px 44px color-mix(in srgb, var(--score-color) 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.45)",
      }}
    >
      {/* Glass highlight sweeping across the top — the "soft light" cue
          from §2.1 that distinguishes a glass surface from a flat fill. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
        }}
      />
      <Sparkles className="size-4" />
      Xem Routine chăm sóc da của bạn
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </motion.button>
  );
}
