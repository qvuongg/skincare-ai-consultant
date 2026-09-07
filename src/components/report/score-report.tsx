"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

import { computePotentialScore } from "@/lib/scoring/engine";
import { HeroSection } from "./hero-section";
import type { ReportContext } from "./insights";
import { LifestyleImpactSection } from "./lifestyle-impact-section";
import { MetricsGrid } from "./metrics-grid";
import { RoutineSection } from "./routine-section";
import { SkinHighlightsCard } from "./skin-highlights-card";
import { ReportTabNav, type ReportTabId } from "./report-tab-nav";
import { REPORT_SPRING, type ScanReportPayload } from "./types";

/**
 * Top-level Skin Health Report Hub — SPEC §8 sections redesigned
 * with an Interactive Guided Tabbed Hub architecture.
 *
 * Hero & Quick Diagnostic Highlights sit prominently at the top,
 * followed by a Sticky Glass Segmented Tab Bar that lets users toggle
 * between:
 *   1. 🔬 9 Clinical Metrics (Grouped into 3 biological pillars)
 *   2. 🌿 Lifestyle Impact & What-If Simulator
 *   3. ✨ Personalized Daily Routine & Recommended Products
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
  const [activeTab, setActiveTab] = useState<ReportTabId>("metrics");

  const rootStyle = {
    ["--score-color" as string]: result.score_band.color,
  } as CSSProperties;

  // Calculate potential score gain to display in the tab badge
  const potentialGain = useMemo(() => {
    const res = computePotentialScore(
      result.composite_score,
      result.lifestyle_modifiers
    );
    return res.delta;
  }, [result.composite_score, result.lifestyle_modifiers]);

  return (
    <div className="flex flex-1 flex-col gap-4" style={rootStyle}>
      {/* ── Fixed Anchor 1: Hero Score & Circular Gauge ───────────── */}
      <HeroSection
        ctx={ctx}
        overallScore={result.overall_score}
        scoreBand={result.score_band}
        skinType={skinType}
      />

      {/* ── Fixed Anchor 2: Urgent Alerts vs Skin Strengths ───────── */}
      <SkinHighlightsCard
        breakdown={result.composite_breakdown}
        onJumpToTab={(tab) => setActiveTab(tab)}
      />

      {/* ── Sticky Segmented Tab Navigation Bar ───────────────────── */}
      <ReportTabNav
        activeTab={activeTab}
        onChange={setActiveTab}
        potentialGain={potentialGain}
      />

      {/* ── Dynamic Tab View Content with Spring Transitions ──────── */}
      <div className="relative min-h-[360px]">
        <AnimatePresence mode="wait">
          {activeTab === "metrics" && (
            <motion.div
              key="tab-metrics"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <MetricsGrid
                breakdown={result.composite_breakdown}
                acne={result.ai_metrics.acne}
                ctx={ctx}
                onNextTab={() => setActiveTab("lifestyle")}
              />
            </motion.div>
          )}

          {activeTab === "lifestyle" && (
            <motion.div
              key="tab-lifestyle"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <LifestyleImpactSection
                mods={result.lifestyle_modifiers}
                totalApplied={result.modifier_total.applied}
                totalRaw={result.modifier_total.raw}
                ctx={ctx}
                breakdown={result.composite_breakdown}
                compositeScore={result.composite_score}
                overallScore={result.overall_score}
                onNextTab={() => setActiveTab("routine")}
              />
            </motion.div>
          )}

          {activeTab === "routine" && (
            <motion.div
              key="tab-routine"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <RoutineSection
                ctx={ctx}
                breakdown={result.composite_breakdown}
                recommendedProducts={result.recommended_products}
                aiMetrics={result.ai_metrics}
                budgetVnd={result.budget_vnd}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer Disclaimer & Retake Scan ───────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...REPORT_SPRING, delay: 0.35 }}
        className="rounded-[20px] border border-white/60 bg-white/50 p-4 text-[11px] leading-relaxed text-foreground/55 shadow-sm"
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
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/65 bg-white/60 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-white/80 active:scale-98 shadow-sm"
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
