"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";

import { HeroSection } from "./hero-section";
import type { ReportContext } from "./insights";
import { LifestyleImpactSection } from "./lifestyle-impact-section";
import { MetricsGrid } from "./metrics-grid";
import { RoutineSection } from "./routine-section";
import { REPORT_SPRING, type ScanReportPayload } from "./types";

/**
 * Top-level Skin Health Report shell — composes the §8 sections.
 *
 * The `--score-color` CSS var on the root is the single switch the whole
 * report rotates around: hero halo, gauge stroke, metric tints (where
 * they're band-derived), and the routine CTA all consume it. Children
 * never have to know the actual hex.
 *
 * `ctx` carries every onboarding field the personalization layer reads —
 * resolving labels once at the page boundary keeps deep children clean.
 */
type Props = {
  result: ScanReportPayload;
  /** Pre-resolved onboarding context for personalized copy. */
  ctx: ReportContext;
  /** Self-reported skin type (already a Vietnamese label). */
  skinType: string | null;
  onRetry: () => void;
};

export function ScoreReport({ result, ctx, skinType, onRetry }: Props) {
  const rootStyle = {
    ["--score-color" as string]: result.score_band.color,
  } as CSSProperties;

  return (
    <div className="flex flex-1 flex-col gap-4" style={rootStyle}>
      <HeroSection
        ctx={ctx}
        overallScore={result.overall_score}
        scoreBand={result.score_band}
        skinType={skinType}
      />

      <MetricsGrid
        breakdown={result.composite_breakdown}
        acne={result.ai_metrics.acne}
        ctx={ctx}
      />

      <LifestyleImpactSection
        mods={result.lifestyle_modifiers}
        totalApplied={result.modifier_total.applied}
        totalRaw={result.modifier_total.raw}
        ctx={ctx}
        breakdown={result.composite_breakdown}
      />

      <RoutineSection ctx={ctx} breakdown={result.composite_breakdown} />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...REPORT_SPRING, delay: 0.35 }}
        className="rounded-[20px] border border-white/55 bg-white/45 p-4 text-[11px] leading-relaxed text-foreground/55"
        style={{
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
        }}
      >
        {result.disclaimer}
      </motion.p>

      <motion.button
        type="button"
        onClick={onRetry}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...REPORT_SPRING, delay: 0.4 }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/55 bg-white/55 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-white/70"
        style={{
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
        }}
      >
        <RotateCcw className="size-4" />
        Scan lại lần nữa
      </motion.button>
    </div>
  );
}
