"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { getScoreBand } from "@/lib/scoring/engine";

import { GlassCard } from "./glass-card";
import { InsightBubble } from "./insight-bubble";
import type { Insight } from "./insights";
import { REPORT_SPRING } from "./types";

/**
 * Single metric card for the §8.3 grid.
 *
 *   - Color-codes the icon, score number, and the bar fill by the
 *     metric's own band — quick at-a-glance "is this good or bad" scan.
 *   - Bar is a `motion.div` width animation; the parent stagger delay
 *     hands off seamlessly so the bars sweep in left-to-right within
 *     each row.
 *   - `subtitle` carries optional secondary copy (e.g. acne severity
 *     counts) — kept opt-in so most cards stay clean.
 */
type Props = {
  label: string;
  /** English keyword, displayed as a small uppercase eyebrow above the label. */
  hint: string;
  /** 0–100 — already direction-corrected (100 = good). */
  score: number;
  Icon: LucideIcon;
  index: number;
  subtitle?: string | null;
  /** Optional comparative insight (§8.3 personalization). `null` = hide. */
  insight?: Insight | null;
};

export function MetricCard({
  label,
  hint,
  score,
  Icon,
  index,
  subtitle,
  insight,
}: Props) {
  const rounded = Math.round(score);
  const band = getScoreBand(rounded);
  const isConcern = rounded < 60;
  const isGreat = rounded >= 80;

  const cardTint = isConcern
    ? "color-mix(in srgb, #F43F5E 7%, rgba(255, 255, 255, 0.75))"
    : isGreat
      ? "color-mix(in srgb, #10B981 7%, rgba(255, 255, 255, 0.75))"
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REPORT_SPRING, delay: 0.08 + index * 0.04 }}
    >
      <GlassCard className="p-4" tint={cardTint}>
        <div className="flex items-start justify-between gap-2">
          <span
            className="flex size-9 items-center justify-center rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${band.color} 18%, white)`,
              color: band.color,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.55)`,
            }}
          >
            <Icon className="size-4" strokeWidth={2.2} />
          </span>
          <span
            className="text-[22px] font-semibold leading-none tabular-nums tracking-tight"
            style={{ color: band.color }}
          >
            {rounded}
          </span>
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/45">
            {hint}
          </p>
          <p className="text-[13px] font-semibold tracking-tight text-foreground">
            {label}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-foreground/60">{subtitle}</p>
          )}
        </div>

        <div className="mt-3 h-[5px] w-full overflow-hidden rounded-full bg-white/45">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${rounded}%` }}
            transition={{ ...REPORT_SPRING, delay: 0.18 + index * 0.04 }}
            style={{
              background: band.color,
              boxShadow: `0 0 12px color-mix(in srgb, ${band.color} 60%, transparent)`,
            }}
          />
        </div>

        {insight && (
          <div className="mt-3">
            <InsightBubble tone={insight.tone}>{insight.text}</InsightBubble>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
