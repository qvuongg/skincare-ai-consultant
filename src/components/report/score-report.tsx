"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";

import { HeroSection } from "./hero-section";
import { LifestyleImpactSection } from "./lifestyle-impact-section";
import { MetricsGrid } from "./metrics-grid";
import { RoutineCta } from "./routine-cta";
import { REPORT_SPRING, type ScanReportPayload } from "./types";

/**
 * Top-level Skin Health Report shell — composes the §8 sections.
 *
 * The `--score-color` CSS var on the root is the single switch the whole
 * report rotates around: hero halo, gauge stroke, metric tints (where
 * they're band-derived), and the routine CTA all consume it. Children
 * never have to know the actual hex.
 */
type Props = {
  result: ScanReportPayload;
  userName: string;
  /** Pulled from onboarding — `null` when the user skipped that step. */
  skinType: string | null;
  onRetry: () => void;
};

export function ScoreReport({ result, userName, skinType, onRetry }: Props) {
  const rootStyle = {
    ["--score-color" as string]: result.score_band.color,
  } as CSSProperties;

  return (
    <div className="flex flex-1 flex-col gap-4" style={rootStyle}>
      <HeroSection
        userName={userName}
        overallScore={result.overall_score}
        scoreBand={result.score_band}
        skinType={skinType}
      />

      <MetricsGrid
        breakdown={result.composite_breakdown}
        acne={result.ai_metrics.acne}
      />

      <LifestyleImpactSection
        mods={result.lifestyle_modifiers}
        totalApplied={result.modifier_total.applied}
        totalRaw={result.modifier_total.raw}
      />

      <RoutineCta />

      {/* Disclaimer + secondary "scan again" — scan-again kept because
          page.tsx still wires `restartScan` in. The disclaimer is a
          full-glass surface so it doesn't visually break the rhythm. */}
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
