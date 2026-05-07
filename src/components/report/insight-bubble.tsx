"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { InsightTone } from "./insights";
import { REPORT_SPRING } from "./types";

/**
 * Sub-bubble that sits inside a GlassCard to surface a personalized
 * insight (§8.3 / §8.4 personalization).
 *
 *   - 20px backdrop-filter (lighter than the parent card's 24px) so it
 *     reads as a sub-layer per the spec.
 *   - Italic + opacity 0.8 — sets it visually apart from the card's
 *     primary copy without being aggressive.
 *   - Color depends on tone: green tint = praise, red = warning,
 *     neutral white = factual statement. Border + text color follow.
 */

const TONE_BG: Record<InsightTone, string> = {
  praise: "color-mix(in srgb, #2ECC71 22%, rgba(255,255,255,0.55))",
  warning: "color-mix(in srgb, #E74C3C 18%, rgba(255,255,255,0.55))",
  neutral: "rgba(255,255,255,0.55)",
};

const TONE_BORDER: Record<InsightTone, string> = {
  praise: "rgba(34,197,94,0.45)",
  warning: "rgba(220,38,38,0.40)",
  neutral: "rgba(255,255,255,0.55)",
};

const TONE_TEXT: Record<InsightTone, string> = {
  praise: "#15532b",
  warning: "#7f1d1d",
  neutral: "rgba(15,23,42,0.85)",
};

type Props = {
  tone: InsightTone;
  children: ReactNode;
  className?: string;
};

export function InsightBubble({ tone, children, className = "" }: Props) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 0.8, y: 0 }}
      transition={REPORT_SPRING}
      className={`rounded-2xl px-3 py-1.5 text-[11px] italic leading-snug ${className}`}
      style={{
        background: TONE_BG[tone],
        border: `1px solid ${TONE_BORDER[tone]}`,
        color: TONE_TEXT[tone],
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      {children}
    </motion.p>
  );
}
